import type { Settings, Wall } from './types';

export const defaultSettings: Settings = {
  usefulAreaM2: 0.52,
  pitchXmm: 875,
  pitchYmm: 600,
  columnOffsetMm: 75,
  method: 'layout',
  marginPercent: 5,
  minOrder: 50,
  orderMultiple: 1,
  insulationCm: 5,
  brickColorId: 'bezhevyj',
  jointColorId: 'svetlo-seryj',
};

export const defaultWalls: Wall[] = [
  { id: 'wall-1', name: 'Стена 1', widthM: 10, heightM: 3 },
  { id: 'wall-2', name: 'Стена 2', widthM: 6, heightM: 3 },
];

export function cloneSettings(settings: Settings = defaultSettings): Settings {
  return { ...settings };
}
