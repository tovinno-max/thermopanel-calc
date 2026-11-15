import { describe, expect, it } from 'vitest';
import {
  BRICK_RECTS,
  COURSE_RECTS,
  PANEL_OUTLINE,
  PANEL_USEFUL_M2,
  ROWS_BOTTOM_UP,
} from './geometry';

const EXPECTED_OUTLINE: Array<[number, number]> = [
  [0, 0],
  [1000, 0],
  [1000, 75],
  [875, 75],
  [875, 150],
  [1000, 150],
  [1000, 225],
  [875, 225],
  [875, 300],
  [1000, 300],
  [1000, 375],
  [875, 375],
  [875, 450],
  [1000, 450],
  [1000, 525],
  [875, 525],
  [875, 600],
  [125, 600],
  [125, 525],
  [0, 525],
  [0, 450],
  [125, 450],
  [125, 375],
  [0, 375],
  [0, 300],
  [125, 300],
  [125, 225],
  [0, 225],
  [0, 150],
  [125, 150],
  [125, 75],
  [0, 75],
];

function shoelace(points: Array<[number, number]>): number {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[(index + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

describe('panel geometry', () => {
  it('follows courses 3/4/3/4/3/4/3/4 from the top', () => {
    expect([...ROWS_BOTTOM_UP].reverse()).toEqual([3, 4, 3, 4, 3, 4, 3, 4]);
  });

  it('draws the tooth outline of the 1000×600 base', () => {
    expect(PANEL_OUTLINE).toEqual(EXPECTED_OUTLINE);
    expect(shoelace(PANEL_OUTLINE)).toBe(525_000);
    expect(PANEL_USEFUL_M2).toBeCloseTo(0.525, 6);
  });

  it('places 28 bricks of 240×65 inside the courses', () => {
    expect(BRICK_RECTS).toHaveLength(28);
    expect(BRICK_RECTS[0]).toEqual({ x: 5, y: 5, w: 240, h: 65 });
    const top = BRICK_RECTS[BRICK_RECTS.length - 1];
    expect(top.y).toBe(530);
    expect(top.x).toBe(130 + 2 * 250);
    for (const brick of BRICK_RECTS) {
      const course = COURSE_RECTS.find(
        (row) => brick.y >= row.y && brick.y + brick.h <= row.y + row.h,
      );
      expect(course).toBeDefined();
      expect(brick.x).toBeGreaterThanOrEqual(course!.x);
      expect(brick.x + brick.w).toBeLessThanOrEqual(course!.x + course!.w);
    }
  });

  it('matches the useful area of the eight courses', () => {
    const area = COURSE_RECTS.reduce((sum, row) => sum + row.w * row.h, 0);
    expect(area).toBe(525_000);
  });
});
