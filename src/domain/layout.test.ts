import { describe, expect, it } from 'vitest';
import { JOINT_MM, ROW_MM } from './geometry';
import {
  brickJointGaps,
  brickOverlapAreaMm2,
  coveredAreaMm2,
  layoutWall,
  overlapAreaMm2,
  placedBricks,
  pointHits,
} from './layout';
import type { Grid } from './types';

const grid: Grid = { pitchXmm: 875, pitchYmm: 600 };

function brickStarts(panels: ReturnType<typeof layoutWall>['panels'], y: number): number[] {
  const starts = new Set<number>();
  for (const panel of panels) {
    for (const brick of placedBricks(panel)) {
      if (Math.abs(brick.y1 - y) < 1e-6) starts.add(brick.x1);
    }
  }
  return [...starts].sort((a, b) => a - b);
}

describe('layout counting', () => {
  it('counts the 10×3 wall as 53 whole and 7 cut panels', () => {
    const result = layoutWall(10_000, 3000, grid);
    expect(result.overflow).toBe(false);
    expect(result.whole).toBe(53);
    expect(result.cut).toBe(7);
    expect(result.total).toBe(60);
    expect(result.panels).toContainEqual({
      column: 0,
      row: 0,
      xMm: 0,
      yMm: 0,
      orientation: 'A',
      cut: false,
    });
    expect(result.panels).toContainEqual({
      column: 1,
      row: 0,
      xMm: 875,
      yMm: 0,
      orientation: 'B',
      cut: false,
    });
    expect(result.panels).toContainEqual({
      column: -1,
      row: 1,
      xMm: -375,
      yMm: 600,
      orientation: 'B',
      cut: true,
    });
    expect(result.panels.some((panel) => panel.row === 0 && panel.column < 0)).toBe(false);
    expect(result.panels.some((panel) => panel.yMm < 0)).toBe(false);
  });

  it('counts the 6×3 wall as 30 whole and 7 cut panels', () => {
    const result = layoutWall(6000, 3000, grid);
    expect(result.whole).toBe(30);
    expect(result.cut).toBe(7);
    expect(result.total).toBe(37);
  });

  it('joins A and B with a 10 mm brick joint and no overlaps', () => {
    const { panels } = layoutWall(10_000, 3000, grid);
    const row = panels.filter((panel) => panel.row === 0 && (panel.column === 0 || panel.column === 1));
    const bottom = placedBricks(row[0]).filter((brick) => brick.y1 === 5);
    const neighbour = placedBricks(row[1]).filter((brick) => brick.y1 === 5);
    expect(Math.max(...bottom.map((brick) => brick.x2))).toBe(995);
    expect(Math.min(...neighbour.map((brick) => brick.x1))).toBe(1005);
    expect(brickOverlapAreaMm2(panels)).toBe(0);
    expect(overlapAreaMm2(panels)).toBe(0);
    expect(brickJointGaps(panels).every((gap) => gap === JOINT_MM)).toBe(true);
  });

  it('keeps a half-brick bond across the row seam when odd rows shift by 500 mm', () => {
    const { panels } = layoutWall(10_000, 3000, grid);
    const lowerTop = brickStarts(panels, 7 * ROW_MM + 5);
    const upperBottom = brickStarts(panels, 600 + 5);
    expect(new Set(lowerTop.map((x) => ((x % 250) + 250) % 250))).toEqual(new Set([130]));
    expect(new Set(upperBottom.map((x) => ((x % 250) + 250) % 250))).toEqual(new Set([5]));
    expect(pointHits(900, 40, panels)).toBe(1);
    expect(pointHits(1100, 40, panels)).toBe(1);
    expect(pointHits(900, 115, panels)).toBe(1);
  });

  it('leaves only the short-course notches of unshifted rows uncovered', () => {
    for (const [width, height] of [
      [10_000, 3000],
      [6000, 3000],
    ] as const) {
      const { panels } = layoutWall(width, height, grid);
      expect(width * height - coveredAreaMm2(panels, width, height)).toBe(112_500);
    }
  });

  it('ignores a zero-size wall and refuses an unbounded grid', () => {
    expect(layoutWall(0, 3000, grid).total).toBe(0);
    expect(layoutWall(10_000, 0, grid).total).toBe(0);
    expect(layoutWall(-1, 3000, grid).total).toBe(0);
    const overflow = layoutWall(100_000, 100_000, { pitchXmm: 50, pitchYmm: 50 });
    expect(overflow.overflow).toBe(true);
    expect(overflow.total).toBe(0);
  });

  it('changes the count when the horizontal pitch changes', () => {
    const baseline = layoutWall(10_000, 3000, grid).total;
    expect(layoutWall(10_000, 3000, { ...grid, pitchXmm: 1000 }).total).not.toBe(baseline);
  });
});
