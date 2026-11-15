import { BRICK_COLORS, JOINT_COLORS } from './colors';
import { defaultSettings, defaultWalls } from './defaults';
import type { InsulationCm, Settings, Wall } from './types';

export const STORAGE_KEY = 'thermopanel-calc-v1';

const BRICK_IDS = new Set(BRICK_COLORS.map((color) => color.id));
const JOINT_IDS = new Set(JOINT_COLORS.map((color) => color.id));

export type Persisted = {
  walls: Wall[];
  settings: Settings;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberIn(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return value;
}

function parseWall(value: unknown): Wall | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || value.id.length === 0 || value.id.length > 80) return null;
  if (typeof value.name !== 'string') return null;
  const widthM = numberIn(value.widthM, 0, 500);
  const heightM = numberIn(value.heightM, 0, 500);
  if (widthM === null || heightM === null) return null;
  const name = value.name.trim().slice(0, 80);
  return {
    id: value.id,
    name: name.length > 0 ? name : 'Стена',
    widthM,
    heightM,
  };
}

function parseSettings(value: unknown): Settings {
  const raw = isRecord(value) ? value : {};
  const method = raw.method === 'area' || raw.method === 'layout' ? raw.method : defaultSettings.method;
  const insulation: InsulationCm = raw.insulationCm === 3 || raw.insulationCm === 5
    ? raw.insulationCm
    : defaultSettings.insulationCm;
  const brickColorId = typeof raw.brickColorId === 'string' && BRICK_IDS.has(raw.brickColorId)
    ? raw.brickColorId
    : defaultSettings.brickColorId;
  const jointColorId = typeof raw.jointColorId === 'string' && JOINT_IDS.has(raw.jointColorId)
    ? raw.jointColorId
    : defaultSettings.jointColorId;
  return {
    usefulAreaM2: numberIn(raw.usefulAreaM2, 0.001, 10) ?? defaultSettings.usefulAreaM2,
    pitchXmm: numberIn(raw.pitchXmm, 1, 5000) ?? defaultSettings.pitchXmm,
    pitchYmm: numberIn(raw.pitchYmm, 1, 5000) ?? defaultSettings.pitchYmm,
    columnOffsetMm: numberIn(raw.columnOffsetMm, 0, 5000) ?? defaultSettings.columnOffsetMm,
    method,
    marginPercent: numberIn(raw.marginPercent, 0, 100) ?? defaultSettings.marginPercent,
    minOrder: numberIn(raw.minOrder, 0, 100_000) ?? defaultSettings.minOrder,
    orderMultiple: numberIn(raw.orderMultiple, 1, 10_000) ?? defaultSettings.orderMultiple,
    insulationCm: insulation,
    brickColorId,
    jointColorId,
  };
}

/** Returns null when the payload is not a saved state. An empty wall list is valid. */
export function parseState(raw: unknown): Persisted | null {
  if (!isRecord(raw) || !Array.isArray(raw.walls)) return null;
  const walls: Wall[] = [];
  for (const item of raw.walls) {
    const wall = parseWall(item);
    if (wall) walls.push(wall);
    if (walls.length >= 50) break;
  }
  return { walls, settings: parseSettings(raw.settings) };
}

export function loadState(): Persisted | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return null;
    return parseState(JSON.parse(text) as unknown);
  } catch {
    return null;
  }
}

export function saveState(state: Persisted): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Private mode and full storage should not break the calculator. */
  }
}

export { defaultWalls };
