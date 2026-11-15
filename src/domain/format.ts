const meters = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const area = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integer = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

const flexible = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 });

export function formatMeters(value: number): string {
  return meters.format(value);
}

export function formatArea(value: number): string {
  return `${area.format(value)} м²`;
}

export function formatInt(value: number): string {
  return integer.format(value);
}

export function formatFlexible(value: number): string {
  return flexible.format(value);
}

export function formatPercent(value: number): string {
  return `${flexible.format(value)}%`;
}

export function methodLabel(method: 'layout' | 'area'): string {
  return method === 'layout' ? 'по раскладке' : 'по площади';
}
