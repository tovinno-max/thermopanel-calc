import { layoutWall, metersToMm } from './layout';
import type { PlacedPanel } from './layout';
import type { Settings, Wall } from './types';

export type WallResult = {
  id: string;
  name: string;
  widthM: number;
  heightM: number;
  widthMm: number;
  heightMm: number;
  areaM2: number;
  valid: boolean;
  overflow: boolean;
  whole: number;
  cut: number;
  layoutTotal: number;
  areaTotal: number;
  counted: number;
  panels: PlacedPanel[];
};

export type OrderSummary = {
  walls: WallResult[];
  totalAreaM2: number;
  withoutMargin: number;
  marginPercent: number;
  withMargin: number;
  minOrder: number;
  multiple: number;
  toOrder: number;
  hasWork: boolean;
  incomplete: boolean;
};

export function countByArea(areaM2: number, usefulAreaM2: number): number {
  if (!(areaM2 > 0) || !(usefulAreaM2 > 0)) return 0;
  return Math.ceil(areaM2 / usefulAreaM2 - 1e-9);
}

/** ceil(count × (1 + margin/100)), with margin rounded to 0.01%. */
export function panelsWithMargin(count: number, marginPercent: number): number {
  if (!(count > 0)) return 0;
  const scaled = Math.max(0, Math.round(marginPercent * 100));
  return Math.ceil((count * (10_000 + scaled)) / 10_000 - 1e-9);
}

/**
 * max(withMargin, minimum order), then round up to a multiple of N.
 * An empty job (no wall with area) orders nothing, minimum included.
 */
export function panelsToOrder(
  withMargin: number,
  minOrder: number,
  multiple: number,
  hasWork: boolean,
): number {
  if (!hasWork) return 0;
  const step = Math.max(1, Math.round(multiple));
  const floor = Math.max(0, Math.round(minOrder));
  const base = Math.max(Math.max(0, Math.round(withMargin)), floor);
  return Math.ceil(base / step) * step;
}

export function wallAreaM2(widthM: number, heightM: number): number {
  const widthMm = metersToMm(widthM);
  const heightMm = metersToMm(heightM);
  if (widthMm <= 0 || heightMm <= 0) return 0;
  return (widthMm * heightMm) / 1_000_000;
}

export function summarize(walls: Wall[], settings: Settings): OrderSummary {
  const grid = {
    pitchXmm: settings.pitchXmm,
    pitchYmm: settings.pitchYmm,
    columnOffsetMm: settings.columnOffsetMm,
  };

  const results: WallResult[] = walls.map((wall) => {
    const widthMm = metersToMm(wall.widthM);
    const heightMm = metersToMm(wall.heightM);
    const areaM2 = widthMm > 0 && heightMm > 0 ? (widthMm * heightMm) / 1_000_000 : 0;
    const valid = areaM2 > 0;
    const layout = valid ? layoutWall(widthMm, heightMm, grid) : null;
    const layoutTotal = layout && !layout.overflow ? layout.total : 0;
    const areaTotal = countByArea(areaM2, settings.usefulAreaM2);
    const counted = settings.method === 'layout' ? layoutTotal : areaTotal;
    return {
      id: wall.id,
      name: wall.name,
      widthM: wall.widthM,
      heightM: wall.heightM,
      widthMm,
      heightMm,
      areaM2,
      valid,
      overflow: Boolean(layout?.overflow),
      whole: layout && !layout.overflow ? layout.whole : 0,
      cut: layout && !layout.overflow ? layout.cut : 0,
      layoutTotal,
      areaTotal,
      counted,
      panels: layout && !layout.overflow ? layout.panels : [],
    };
  });

  const workable = results.filter((wall) => wall.valid && !(settings.method === 'layout' && wall.overflow));
  const hasWork = workable.length > 0;
  const withoutMargin = workable.reduce((sum, wall) => {
    return sum + (settings.method === 'layout' ? wall.layoutTotal : wall.areaTotal);
  }, 0);
  const withMargin = panelsWithMargin(withoutMargin, settings.marginPercent);
  return {
    walls: results,
    totalAreaM2: results.reduce((sum, wall) => sum + wall.areaM2, 0),
    withoutMargin,
    marginPercent: settings.marginPercent,
    withMargin,
    minOrder: settings.minOrder,
    multiple: settings.orderMultiple,
    toOrder: panelsToOrder(withMargin, settings.minOrder, settings.orderMultiple, hasWork),
    hasWork,
    incomplete: results.some((wall) => wall.overflow),
  };
}
