export type CountMethod = 'layout' | 'area';

export type InsulationCm = 3 | 5;

export type Settings = {
  usefulAreaM2: number;
  pitchXmm: number;
  pitchYmm: number;
  /** Odd columns are shifted down by this many millimetres. */
  columnOffsetMm: number;
  method: CountMethod;
  marginPercent: number;
  minOrder: number;
  orderMultiple: number;
  insulationCm: InsulationCm;
  brickColorId: string;
  jointColorId: string;
};

export type Wall = {
  id: string;
  name: string;
  widthM: number;
  heightM: number;
};

export type Grid = {
  pitchXmm: number;
  pitchYmm: number;
  columnOffsetMm: number;
};
