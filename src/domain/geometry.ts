/**
 * Panel geometry from the final 240×65 drawing.
 * Brick 240×65, joint 10, base edge 5 mm.
 * Eight stretcher courses, top to bottom 3/4/3/4/3/4/3/4 (28 bricks).
 * Base 1000×600 mm. Courses of 3 are inset 125 mm each side.
 *
 * Local coordinates: origin at the bounding-box bottom-left, y up, millimetres.
 * That box is the outer teeth of the 4-brick courses.
 */

export const BRICK_W_MM = 240;
export const BRICK_H_MM = 65;
export const JOINT_MM = 10;
export const EDGE_MM = 5;
export const BRICK_PITCH_MM = BRICK_W_MM + JOINT_MM;
export const ROW_MM = BRICK_H_MM + JOINT_MM;
export const TOOTH_MM = BRICK_PITCH_MM / 2;
export const PANEL_W_MM = 1000;
export const PANEL_H_MM = 600;
export const PANEL_USEFUL_M2 = 0.525;

export const RECOMMENDED_PITCH_X_MM = 3.5 * BRICK_PITCH_MM;
export const RECOMMENDED_PITCH_Y_MM = PANEL_H_MM;
export const RECOMMENDED_OFFSET_MM = ROW_MM;

/** Bottom-up course widths. Top-to-bottom order is 3/4/3/4/3/4/3/4. */
export const ROWS_BOTTOM_UP = [4, 3, 4, 3, 4, 3, 4, 3] as const;

export type Xy = [number, number];

export type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export function panelOutline(): Xy[] {
  const rows = ROWS_BOTTOM_UP;
  const count = rows.length;
  const pts: Xy[] = [
    [0, 0],
    [PANEL_W_MM, 0],
  ];
  let x = PANEL_W_MM;
  for (let course = 0; course < count; course += 1) {
    const y0 = course * ROW_MM;
    const y1 = y0 + ROW_MM;
    const right = rows[course] === 4 ? PANEL_W_MM : PANEL_W_MM - TOOTH_MM;
    if (x !== right) {
      pts.push([right, y0]);
      x = right;
    }
    pts.push([right, y1]);
  }
  const topLeft = rows[count - 1] === 4 ? 0 : TOOTH_MM;
  pts.push([topLeft, PANEL_H_MM]);
  x = topLeft;
  for (let course = count - 1; course >= 0; course -= 1) {
    const y0 = course * ROW_MM;
    const y1 = y0 + ROW_MM;
    const left = rows[course] === 4 ? 0 : TOOTH_MM;
    if (x !== left) {
      pts.push([left, y1]);
      x = left;
    }
    pts.push([left, y0]);
  }
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (last[0] === first[0] && last[1] === first[1]) pts.pop();
  return pts;
}

/** Base strips the outline is built from. A 3-brick course is the tooth notch. */
export function courseRects(): Box[] {
  return ROWS_BOTTOM_UP.map((bricks, course) => {
    const y = course * ROW_MM;
    if (bricks === 4) return { x: 0, y, w: PANEL_W_MM, h: ROW_MM };
    return { x: TOOTH_MM, y, w: PANEL_W_MM - 2 * TOOTH_MM, h: ROW_MM };
  });
}

export function brickRects(): Box[] {
  const bricks: Box[] = [];
  ROWS_BOTTOM_UP.forEach((count, course) => {
    const y = course * ROW_MM + EDGE_MM;
    const x0 = (count === 4 ? 0 : TOOTH_MM) + EDGE_MM;
    for (let index = 0; index < count; index += 1) {
      bricks.push({
        x: x0 + index * BRICK_PITCH_MM,
        y,
        w: BRICK_W_MM,
        h: BRICK_H_MM,
      });
    }
  });
  return bricks;
}

export const PANEL_OUTLINE = panelOutline();
export const COURSE_RECTS = courseRects();
export const BRICK_RECTS = brickRects();
