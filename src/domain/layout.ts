import {
  PANEL_H_MM,
  PANEL_W_MM,
  ROW_SHIFT_MM,
  brickRectsOf,
  courseRectsOf,
  outlineOf,
} from './geometry';
import type { Orientation } from './geometry';
import type { Grid } from './types';

export type PlacedPanel = {
  column: number;
  row: number;
  xMm: number;
  yMm: number;
  orientation: Orientation;
  cut: boolean;
};

export type LayoutResult = {
  panels: PlacedPanel[];
  whole: number;
  cut: number;
  total: number;
  overflow: boolean;
};

export type MaterialRect = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

/** Safety cap so a tiny pitch cannot lock the page. */
export const MAX_GRID_CELLS = 250_000;

const EMPTY: LayoutResult = {
  panels: [],
  whole: 0,
  cut: 0,
  total: 0,
  overflow: false,
};

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

export function metersToMm(meters: number): number {
  if (!Number.isFinite(meters)) return 0;
  return Math.round(meters * 1000);
}

export function orientationAt(column: number): Orientation {
  return mod(column, 2) === 0 ? 'A' : 'B';
}

export function materialRects(xMm: number, yMm: number, orientation: Orientation): MaterialRect[] {
  return courseRectsOf(orientation).map((course) => ({
    x1: xMm + course.x,
    y1: yMm + course.y,
    x2: xMm + course.x + course.w,
    y2: yMm + course.y + course.h,
  }));
}

export function placedBricks(panel: PlacedPanel): MaterialRect[] {
  return brickRectsOf(panel.orientation).map((brick) => ({
    x1: panel.xMm + brick.x,
    y1: panel.yMm + brick.y,
    x2: panel.xMm + brick.x + brick.w,
    y2: panel.yMm + brick.y + brick.h,
  }));
}

function overlapLength(a1: number, a2: number, b1: number, b2: number): number {
  return Math.min(a2, b2) - Math.max(a1, b1);
}

export function rectWallArea(rect: MaterialRect, widthMm: number, heightMm: number): number {
  const width = overlapLength(rect.x1, rect.x2, 0, widthMm);
  const height = overlapLength(rect.y1, rect.y2, 0, heightMm);
  if (width <= 1e-6 || height <= 1e-6) return 0;
  return width * height;
}

function panelHitsWall(
  xMm: number,
  yMm: number,
  orientation: Orientation,
  widthMm: number,
  heightMm: number,
): boolean {
  return materialRects(xMm, yMm, orientation).some(
    (rect) => rectWallArea(rect, widthMm, heightMm) > 0,
  );
}

function panelInsideWall(
  xMm: number,
  yMm: number,
  orientation: Orientation,
  widthMm: number,
  heightMm: number,
): boolean {
  return outlineOf(orientation).every(([x, y]) => {
    const px = xMm + x;
    const py = yMm + y;
    return px >= -1e-6 && py >= -1e-6 && px <= widthMm + 1e-6 && py <= heightMm + 1e-6;
  });
}

/**
 * Rows run bottom-up from the left corner. Every panel in a row shares one
 * height. Along a row the panels alternate A, B, A, B… at `pitchX`: B is A
 * turned 180°, so a long course fills the neighbour's short-course recess.
 * Odd rows are shifted right by ROW_SHIFT_MM (500). The panel that then
 * sticks out past the left edge is cut, as are the right-hand end and a top
 * row that passes the wall. A cut panel is still one whole panel to order.
 */
export function layoutWall(widthMm: number, heightMm: number, grid: Grid): LayoutResult {
  const { pitchXmm, pitchYmm } = grid;
  if (!(widthMm > 0) || !(heightMm > 0)) return EMPTY;
  if (!(pitchXmm >= 1) || !(pitchYmm >= 1)) return EMPTY;
  if ((widthMm / pitchXmm) * (heightMm / pitchYmm) > MAX_GRID_CELLS) {
    return { ...EMPTY, overflow: true };
  }

  const panels: PlacedPanel[] = [];
  const rowMax = Math.floor((heightMm - 1e-6) / pitchYmm);
  for (let row = 0; row <= rowMax; row += 1) {
    const yMm = row * pitchYmm;
    const shift = row % 2 === 1 ? ROW_SHIFT_MM : 0;
    const columnMin = shift > 0 ? Math.floor((-PANEL_W_MM - shift) / pitchXmm) - 1 : 0;
    const columnMax = Math.floor((widthMm - 1e-6 - shift) / pitchXmm) + 1;
    for (let column = columnMin; column <= columnMax; column += 1) {
      if (shift === 0 && column < 0) continue;
      const xMm = shift + column * pitchXmm;
      const orientation = orientationAt(column);
      if (!panelHitsWall(xMm, yMm, orientation, widthMm, heightMm)) continue;
      const whole = panelInsideWall(xMm, yMm, orientation, widthMm, heightMm);
      panels.push({ column, row, xMm, yMm, orientation, cut: !whole });
    }
  }

  panels.sort((a, b) => a.row - b.row || a.column - b.column);
  const cut = panels.reduce((sum, panel) => sum + (panel.cut ? 1 : 0), 0);
  return {
    panels,
    whole: panels.length - cut,
    cut,
    total: panels.length,
    overflow: false,
  };
}

export function coveredAreaMm2(
  panels: PlacedPanel[],
  widthMm: number,
  heightMm: number,
): number {
  return panels.reduce((sum, panel) => {
    return (
      sum +
      materialRects(panel.xMm, panel.yMm, panel.orientation).reduce(
        (area, rect) => area + rectWallArea(rect, widthMm, heightMm),
        0,
      )
    );
  }, 0);
}

/** Positive area where two different panels both have base material. */
export function overlapAreaMm2(panels: PlacedPanel[]): number {
  const groups = panels.map((panel) => materialRects(panel.xMm, panel.yMm, panel.orientation));
  let area = 0;
  for (let i = 0; i < groups.length; i += 1) {
    for (let j = i + 1; j < groups.length; j += 1) {
      for (const a of groups[i]) {
        for (const b of groups[j]) {
          const width = overlapLength(a.x1, a.x2, b.x1, b.x2);
          const height = overlapLength(a.y1, a.y2, b.y1, b.y2);
          if (width > 1e-6 && height > 1e-6) area += width * height;
        }
      }
    }
  }
  return area;
}

export function brickOverlapAreaMm2(panels: PlacedPanel[]): number {
  const bricks = panels.flatMap((panel) => placedBricks(panel));
  let area = 0;
  for (let i = 0; i < bricks.length; i += 1) {
    for (let j = i + 1; j < bricks.length; j += 1) {
      const width = overlapLength(bricks[i].x1, bricks[i].x2, bricks[j].x1, bricks[j].x2);
      const height = overlapLength(bricks[i].y1, bricks[i].y2, bricks[j].y1, bricks[j].y2);
      if (width > 1e-6 && height > 1e-6) area += width * height;
    }
  }
  return area;
}

/** Gaps between successive bricks of one course. A sound joint is exactly 10 mm. */
export function brickJointGaps(panels: PlacedPanel[]): number[] {
  const byCourse = new Map<number, Array<[number, number]>>();
  for (const panel of panels) {
    for (const brick of placedBricks(panel)) {
      const key = Math.round(brick.y1 * 1000);
      const list = byCourse.get(key) ?? [];
      list.push([brick.x1, brick.x2]);
      byCourse.set(key, list);
    }
  }
  const gaps: number[] = [];
  for (const segments of byCourse.values()) {
    segments.sort((a, b) => a[0] - b[0]);
    for (let index = 1; index < segments.length; index += 1) {
      gaps.push(segments[index][0] - segments[index - 1][1]);
    }
  }
  return gaps;
}

export function pointHits(x: number, y: number, panels: PlacedPanel[]): number {
  let hits = 0;
  for (const panel of panels) {
    for (const rect of materialRects(panel.xMm, panel.yMm, panel.orientation)) {
      if (x > rect.x1 && x < rect.x2 && y > rect.y1 && y < rect.y2) {
        hits += 1;
        break;
      }
    }
  }
  return hits;
}

export { PANEL_H_MM, PANEL_W_MM };
