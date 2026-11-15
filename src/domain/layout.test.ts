import { describe, expect, it } from 'vitest';
import {
  coveredAreaMm2,
  layoutWall,
  overlapAreaMm2,
  pointHits,
} from './layout';
import type { Grid } from './types';

const grid: Grid = { pitchXmm: 875, pitchYmm: 600, columnOffsetMm: 75 };

describe('layout counting', () => {
  it('counts the 10×3 wall as 50 whole and 16 cut panels', () => {
    const result = layoutWall(10_000, 3000, grid);
    expect(result.overflow).toBe(false);
    expect(result.whole).toBe(50);
    expect(result.cut).toBe(16);
    expect(result.total).toBe(66);
    expect(result.panels.some((panel) => panel.column < 0)).toBe(false);
    expect(result.panels).toContainEqual({
      column: 0,
      row: 0,
      xMm: 0,
      yMm: 0,
      cut: false,
    });
    expect(result.panels).toContainEqual({
      column: 1,
      row: 0,
      xMm: 875,
      yMm: -75,
      cut: true,
    });
    expect(result.panels).toContainEqual({
      column: 1,
      row: 5,
      xMm: 875,
      yMm: 2925,
      cut: true,
    });
  });

  it('counts the 6×3 wall as 27 whole and 11 cut panels', () => {
    const result = layoutWall(6000, 3000, grid);
    expect(result.whole).toBe(27);
    expect(result.cut).toBe(11);
    expect(result.total).toBe(38);
  });

  it('covers both example walls without overlaps, leaving only the left-edge notches', () => {
    for (const [width, height] of [
      [10_000, 3000],
      [6000, 3000],
    ] as const) {
      const { panels } = layoutWall(width, height, grid);
      const covered = coveredAreaMm2(panels, width, height);
      expect(overlapAreaMm2(panels)).toBe(0);
      expect(width * height - covered).toBe(187_500);
    }
  });

  it('lets a tooth of column 0 fill the notch of column 1', () => {
    const { panels } = layoutWall(10_000, 3000, grid);
    expect(pointHits(900, 40, panels)).toBe(1);
    expect(pointHits(1100, 40, panels)).toBe(1);
    expect(pointHits(60, 100, panels)).toBe(0);
    expect(pointHits(200, 100, panels)).toBe(1);
  });

  it('fits one whole panel on a base-sized wall and still trims the neighbour column', () => {
    const result = layoutWall(1000, 600, grid);
    expect(result.whole).toBe(1);
    expect(result.cut).toBe(2);
    expect(result.total).toBe(3);
  });

  it('ignores a zero-size wall and refuses an unbounded grid', () => {
    expect(layoutWall(0, 3000, grid).total).toBe(0);
    expect(layoutWall(10_000, 0, grid).total).toBe(0);
    expect(layoutWall(-1, 3000, grid).total).toBe(0);
    const overflow = layoutWall(100_000, 100_000, {
      pitchXmm: 50,
      pitchYmm: 50,
      columnOffsetMm: 0,
    });
    expect(overflow.overflow).toBe(true);
    expect(overflow.total).toBe(0);
  });

  it('changes the count when the pitch or the column offset changes', () => {
    const baseline = layoutWall(10_000, 3000, grid).total;
    expect(layoutWall(10_000, 3000, { ...grid, columnOffsetMm: 0 }).total).not.toBe(baseline);
    expect(layoutWall(10_000, 3000, { ...grid, pitchXmm: 1000 }).total).not.toBe(baseline);
  });
});
