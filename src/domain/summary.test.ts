import { describe, expect, it } from 'vitest';
import { defaultSettings } from './defaults';
import {
  countByArea,
  panelsToOrder,
  panelsWithMargin,
  summarize,
} from './summary';
import type { Wall } from './types';

const examples: Wall[] = [
  { id: 'wall-1', name: 'Стена 1', widthM: 10, heightM: 3 },
  { id: 'wall-2', name: 'Стена 2', widthM: 6, heightM: 3 },
];

describe('area counting', () => {
  it('rounds each example wall up at the default useful area 0.52 m²', () => {
    expect(countByArea(30, 0.52)).toBe(58);
    expect(countByArea(18, 0.52)).toBe(35);
    expect(countByArea(30, 0.525)).toBe(58);
    expect(countByArea(18, 0.525)).toBe(35);
  });

  it('uses the useful area the user typed', () => {
    expect(countByArea(1.05, 0.52)).toBe(3);
    expect(countByArea(1.05, 0.525)).toBe(2);
    expect(countByArea(0, 0.52)).toBe(0);
    expect(countByArea(30, 0)).toBe(0);
  });
});

describe('order rounding', () => {
  it('adds the margin by rounding up', () => {
    expect(panelsWithMargin(104, 5)).toBe(110);
    expect(panelsWithMargin(93, 5)).toBe(98);
    expect(panelsWithMargin(40, 5)).toBe(42);
    expect(panelsWithMargin(1, 5)).toBe(2);
    expect(panelsWithMargin(0, 5)).toBe(0);
  });

  it('applies the minimum order and the multiple only when there is work', () => {
    expect(panelsToOrder(110, 50, 1, true)).toBe(110);
    expect(panelsToOrder(98, 50, 10, true)).toBe(100);
    expect(panelsToOrder(110, 50, 25, true)).toBe(125);
    expect(panelsToOrder(10, 50, 1, true)).toBe(50);
    expect(panelsToOrder(50, 0, 2, true)).toBe(50);
    expect(panelsToOrder(51, 0, 30, true)).toBe(60);
    expect(panelsToOrder(10, 50, 1, false)).toBe(0);
  });
});

describe('example facade', () => {
  it('orders 110 panels by layout for walls 10×3 and 6×3', () => {
    const summary = summarize(examples, { ...defaultSettings, method: 'layout' });
    expect(summary.walls[0]).toMatchObject({
      areaM2: 30,
      whole: 50,
      cut: 16,
      layoutTotal: 66,
      areaTotal: 58,
      counted: 66,
    });
    expect(summary.walls[1]).toMatchObject({
      areaM2: 18,
      whole: 27,
      cut: 11,
      layoutTotal: 38,
      areaTotal: 35,
      counted: 38,
    });
    expect(summary.totalAreaM2).toBe(48);
    expect(summary.withoutMargin).toBe(104);
    expect(summary.withMargin).toBe(110);
    expect(summary.toOrder).toBe(110);
  });

  it('orders 98 panels by area for the same walls, with 5% margin and minimum 50', () => {
    const summary = summarize(examples, { ...defaultSettings, method: 'area' });
    expect(summary.walls.map((wall) => wall.counted)).toEqual([58, 35]);
    expect(summary.withoutMargin).toBe(93);
    expect(summary.withMargin).toBe(98);
    expect(summary.toOrder).toBe(98);
  });

  it('raises a small wall to the minimum order', () => {
    const summary = summarize(
      [{ id: 'small', name: 'Стена', widthM: 1, heightM: 1 }],
      { ...defaultSettings, method: 'area' },
    );
    expect(summary.withoutMargin).toBe(2);
    expect(summary.withMargin).toBe(3);
    expect(summary.toOrder).toBe(50);
  });

  it('orders nothing when every wall is empty', () => {
    const summary = summarize([], defaultSettings);
    expect(summary.hasWork).toBe(false);
    expect(summary.toOrder).toBe(0);
    expect(summary.withoutMargin).toBe(0);
  });
});
