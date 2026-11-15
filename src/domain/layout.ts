import { COURSE_RECTS, PANEL_H_MM, PANEL_OUTLINE } from './geometry';
import type { Grid } from './types';

export type PlacedPanel = {
  column: number;
  row: number;
  xMm: number;
  yMm: number;
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

export function metersToMm(meters: number): number {
  if (!Number.isFinite(meters)) return 0;
  return Math.round(meters * 1000);
}

export function materialRects(xMm: number, yMm: number): MaterialRect[] {
  return COURSE_RECTS.map((course) => ({
    x1: xMm + course.x,
    y1: yMm + course.y,
    x2: xMm + course.x + course.w,
    y2: yMm + course.y + course.h,
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

function panelHitsWall(xMm: number, yMm: number, widthMm: number, heightMm: number): boolean {
  return materialRects(xMm, yMm).some((rect) => rectWallArea(rect, widthMm, heightMm) > 0);
}

function panelInsideWall(xMm: number, yMm: number, widthMm: number, heightMm: number): boolean {
  return PANEL_OUTLINE.every(([x, y]) => {
    const px = xMm + x;
    const py = yMm + y;
    return px >= -1e-6 && py >= -1e-6 && px <= widthMm + 1e-6 && py <= heightMm + 1e-6;
  });
}

/**
 * Tile a wall from the bottom-left corner.
 * Column i sits at x = i * pitchX (i = 0, 1, 2, …).
 * Even columns start on the bottom edge. Odd columns are shifted down
 * by `columnOffsetMm`, so they hang below the wall and are trimmed;
 * the same shift leaves a 75 mm step at the top that is also trimmed.
 * Panels whose base only touches the boundary (zero area) are not counted.
 * There is no column to the left of the corner: the tooth notches of column 0
 * stay on the wall edge and are finished in place.
 */
export function layoutWall(widthMm: number, heightMm: number, grid: Grid): LayoutResult {
  const { pitchXmm, pitchYmm, columnOffsetMm } = grid;
  if (!(widthMm > 0) || !(heightMm > 0)) return EMPTY;
  if (!(pitchXmm >= 1) || !(pitchYmm >= 1) || !Number.isFinite(columnOffsetMm)) return EMPTY;
  if ((widthMm / pitchXmm) * (heightMm / pitchYmm) > MAX_GRID_CELLS) {
    return { ...EMPTY, overflow: true };
  }

  const panels: PlacedPanel[] = [];
  const iMax = Math.floor((widthMm - 1e-6) / pitchXmm);
  for (let column = 0; column <= iMax; column += 1) {
    const shift = column % 2 === 1 ? columnOffsetMm : 0;
    const jLow = Math.floor((-PANEL_H_MM + shift) / pitchYmm) - 1;
    const jHigh = Math.floor((heightMm + shift) / pitchYmm) + 1;
    for (let row = jLow; row <= jHigh; row += 1) {
      const xMm = column * pitchXmm;
      const yMm = row * pitchYmm - shift;
      if (!panelHitsWall(xMm, yMm, widthMm, heightMm)) continue;
      const whole = panelInsideWall(xMm, yMm, widthMm, heightMm);
      panels.push({ column, row, xMm, yMm, cut: !whole });
    }
  }

  panels.sort((a, b) => a.column - b.column || a.row - b.row);
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
      materialRects(panel.xMm, panel.yMm).reduce(
        (area, rect) => area + rectWallArea(rect, widthMm, heightMm),
        0,
      )
    );
  }, 0);
}

/** Positive area where two different panels both have base material. */
export function overlapAreaMm2(panels: PlacedPanel[]): number {
  const groups = panels.map((panel) => materialRects(panel.xMm, panel.yMm));
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

export function pointHits(x: number, y: number, panels: PlacedPanel[]): number {
  let hits = 0;
  for (const panel of panels) {
    for (const rect of materialRects(panel.xMm, panel.yMm)) {
      if (x > rect.x1 && x < rect.x2 && y > rect.y1 && y < rect.y2) {
        hits += 1;
        break;
      }
    }
  }
  return hits;
}
