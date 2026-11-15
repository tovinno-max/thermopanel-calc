import { describe, expect, it } from 'vitest';
import { defaultSettings } from './defaults';
import { parseState } from './storage';

describe('saved state', () => {
  it('rejects a payload that is not a wall list', () => {
    expect(parseState(null)).toBeNull();
    expect(parseState({})).toBeNull();
    expect(parseState({ walls: 'нет' })).toBeNull();
  });

  it('keeps a valid wall and falls back when a colour is unknown', () => {
    const parsed = parseState({
      walls: [{ id: 'a', name: '  Двор  ', widthM: 10, heightM: 3 }],
      settings: { brickColorId: 'радуга', method: 'area', marginPercent: 7 },
    });
    expect(parsed?.walls).toEqual([{ id: 'a', name: 'Двор', widthM: 10, heightM: 3 }]);
    expect(parsed?.settings.method).toBe('area');
    expect(parsed?.settings.marginPercent).toBe(7);
    expect(parsed?.settings.brickColorId).toBe(defaultSettings.brickColorId);
    expect(parsed?.settings.pitchXmm).toBe(875);
  });

  it('accepts an empty wall list as a deliberate save', () => {
    const parsed = parseState({ walls: [], settings: {} });
    expect(parsed?.walls).toEqual([]);
    expect(parsed?.settings.usefulAreaM2).toBe(0.52);
  });
});
