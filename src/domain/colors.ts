export type BrickColor = {
  id: string;
  name: string;
  fill: string;
  stroke: string;
};

export type JointColor = {
  id: string;
  name: string;
  fill: string;
};

export const BRICK_COLORS: readonly BrickColor[] = [
  { id: 'belyj', name: 'белый', fill: '#f4f1ea', stroke: '#d5cfc3' },
  { id: 'bezhevyj', name: 'бежевый', fill: '#e4cfa4', stroke: '#c9b07e' },
  { id: 'seryj', name: 'серый', fill: '#b7b1a8', stroke: '#8f8980' },
  { id: 'temno-korichnevyj', name: 'тёмно-коричневый', fill: '#5c4033', stroke: '#3d2a22' },
  { id: 'krasno-korichnevyj', name: 'красно-коричневый', fill: '#7d3f34', stroke: '#5c2c24' },
  { id: 'krasnyj', name: 'красный', fill: '#b44434', stroke: '#8a3226' },
  { id: 'oranzhevyj', name: 'оранжевый', fill: '#d4783c', stroke: '#a85a28' },
  { id: 'zheltyj', name: 'жёлтый', fill: '#e2c15a', stroke: '#c4a13e' },
  { id: 'grafit', name: 'графит', fill: '#4a4e55', stroke: '#2e3238' },
];

export const JOINT_COLORS: readonly JointColor[] = [
  { id: 'belyj', name: 'белый', fill: '#f7f6f3' },
  { id: 'svetlo-seryj', name: 'светло-серый', fill: '#d5d0c8' },
  { id: 'temnyj', name: 'тёмный', fill: '#4a4744' },
];

export function brickColor(id: string): BrickColor {
  return BRICK_COLORS.find((color) => color.id === id) ?? BRICK_COLORS[1];
}

export function jointColor(id: string): JointColor {
  return JOINT_COLORS.find((color) => color.id === id) ?? JOINT_COLORS[1];
}
