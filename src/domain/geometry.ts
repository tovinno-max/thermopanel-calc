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
/**
 * Odd rows move right by 500 mm. That is the shift ≡ 0 (mod 250) with the
 * largest gap between vertical joints (375 mm of the 875 mm pitch) while the
 * upper row's bottom course stays half a brick off the lower row's top course.
 */
export const ROW_SHIFT_MM = 500;

export type Orientation = 'A' | 'B';

/** Bottom-up course widths of orientation A: long bottom, short top. */
export const ROWS_BOTTOM_UP = [4, 3, 4, 3, 4, 3, 4, 3] as const;
/** Orientation B is A rotated 180°: short bottom, long top. */
export const ROWS_BOTTOM_UP_B = [3, 4, 3, 4, 3, 4, 3, 4] as const;

export type Xy = [number, number];

export type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type CourseCount = 3 | 4;

export function coursesOf(orientation: Orientation): readonly CourseCount[] {
  return orientation === 'A' ? ROWS_BOTTOM_UP : ROWS_BOTTOM_UP_B;
}

function courseLeft(bricks: CourseCount): number {
  return bricks === 4 ? 0 : TOOTH_MM;
}

function courseRight(bricks: CourseCount): number {
  return bricks === 4 ? PANEL_W_MM : PANEL_W_MM - TOOTH_MM;
}

export function outlineFor(courses: readonly CourseCount[]): Xy[] {
  const count = courses.length;
  const height = count * ROW_MM;
  const bottomLeft = courseLeft(courses[0]);
  const bottomRight = courseRight(courses[0]);
  const pts: Xy[] = [
    [bottomLeft, 0],
    [bottomRight, 0],
  ];
  let x = bottomRight;
  for (let course = 0; course < count; course += 1) {
    const y0 = course * ROW_MM;
    const y1 = y0 + ROW_MM;
    const right = courseRight(courses[course]);
    if (x !== right) {
      pts.push([right, y0]);
      x = right;
    }
    pts.push([right, y1]);
  }
  const topLeft = courseLeft(courses[count - 1]);
  pts.push([topLeft, height]);
  x = topLeft;
  for (let course = count - 1; course >= 0; course -= 1) {
    const y0 = course * ROW_MM;
    const y1 = y0 + ROW_MM;
    const left = courseLeft(courses[course]);
    if (x !== left) {
      pts.push([left, y1]);
      x = left;
    }
    const closesStart = course === 0 && left === bottomLeft && y0 === 0;
    if (!closesStart) pts.push([left, y0]);
  }
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (last && first && last[0] === first[0] && last[1] === first[1]) pts.pop();
  return pts;
}

export function panelOutline(): Xy[] {
  return outlineFor(ROWS_BOTTOM_UP);
}

/** Base strips the outline is built from. A 3-brick course is the tooth notch. */
export function courseRectsFor(courses: readonly CourseCount[]): Box[] {
  return courses.map((bricks, course) => {
    const y = course * ROW_MM;
    const x = courseLeft(bricks);
    return { x, y, w: courseRight(bricks) - x, h: ROW_MM };
  });
}

export function courseRects(): Box[] {
  return courseRectsFor(ROWS_BOTTOM_UP);
}

export function brickRectsFor(courses: readonly CourseCount[]): Box[] {
  const bricks: Box[] = [];
  courses.forEach((count, course) => {
    const y = course * ROW_MM + EDGE_MM;
    const x0 = courseLeft(count) + EDGE_MM;
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

export function brickRects(): Box[] {
  return brickRectsFor(ROWS_BOTTOM_UP);
}

export function rotateBox180(box: Box): Box {
  return {
    x: PANEL_W_MM - box.x - box.w,
    y: PANEL_H_MM - box.y - box.h,
    w: box.w,
    h: box.h,
  };
}

export const PANEL_OUTLINE = panelOutline();
export const PANEL_OUTLINE_B = outlineFor(ROWS_BOTTOM_UP_B);
export const COURSE_RECTS = courseRects();
export const COURSE_RECTS_B = courseRectsFor(ROWS_BOTTOM_UP_B);
export const BRICK_RECTS = brickRects();
export const BRICK_RECTS_B = brickRectsFor(ROWS_BOTTOM_UP_B);

export function outlineOf(orientation: Orientation): Xy[] {
  return orientation === 'A' ? PANEL_OUTLINE : PANEL_OUTLINE_B;
}

export function courseRectsOf(orientation: Orientation): Box[] {
  return orientation === 'A' ? COURSE_RECTS : COURSE_RECTS_B;
}

export function brickRectsOf(orientation: Orientation): Box[] {
  return orientation === 'A' ? BRICK_RECTS : BRICK_RECTS_B;
}
