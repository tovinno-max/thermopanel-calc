import { brickColor, jointColor } from '../domain/colors';
import { formatArea, formatFlexible, formatInt, formatPercent, methodLabel } from '../domain/format';
import type { OrderSummary } from '../domain/summary';
import type { Settings } from '../domain/types';

type Props = {
  summary: OrderSummary;
  settings: Settings;
};

export function SummaryCard({ summary, settings }: Props) {
  const brick = brickColor(settings.brickColorId);
  const joint = jointColor(settings.jointColorId);
  const method = methodLabel(settings.method);
  const rows: Array<[string, string]> = [
    ['Площадь стен', formatArea(summary.totalAreaM2)],
    ['Способ подсчёта', method],
    ['Панелей без запаса', `${formatInt(summary.withoutMargin)} шт.`],
    ['Запас', formatPercent(summary.marginPercent)],
    ['Панелей с запасом', `${formatInt(summary.withMargin)} шт.`],
    ['Минимальный заказ', `${formatInt(summary.minOrder)} шт.`],
    ['Округление до кратности', formatInt(summary.multiple)],
    ['Шаг раскладки', `${formatFlexible(settings.pitchXmm)}×${formatFlexible(settings.pitchYmm)} мм, сдвиг ${formatFlexible(settings.columnOffsetMm)} мм`],
    ['Полезная площадь панели', `${formatFlexible(settings.usefulAreaM2)} м²`],
  ];

  return (
    <section className="card summary-card" aria-label="Спецификация заказа">
      <div className="print-only">
        <h1>Калькулятор термопанелей — спецификация</h1>
        <p>Кирпич 240×65 мм, шов 10 мм, край основы 5 мм. Проёмы не учитываются.</p>
      </div>
      <header className="section-head">
        <h2>Спецификация</h2>
        <p className="hint">
          {settings.method === 'layout'
            ? 'В сумму идут все панели раскладки, включая подрезанные. Запас добавляется сверху.'
            : 'Площадь каждой стены делится на полезную площадь и округляется вверх, затем стены складываются.'}
        </p>
      </header>
      <div className="order-hero">
        <span>К заказу</span>
        <strong data-testid="order-qty">{formatInt(summary.toOrder)} шт.</strong>
      </div>
      <dl className="spec-rows">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        <div>
          <dt>Цвет кирпича</dt>
          <dd>
            <i className="swatch tiny" style={{ background: brick.fill }} />
            {brick.name}
          </dd>
        </div>
        <div>
          <dt>Цвет шва</dt>
          <dd>
            <i className="swatch tiny" style={{ background: joint.fill }} />
            {joint.name}
          </dd>
        </div>
        <div>
          <dt>Толщина утеплителя</dt>
          <dd>{settings.insulationCm} см</dd>
        </div>
      </dl>
      {summary.incomplete && (
        <p className="warn">Часть стен не посчитана: шаг слишком мелкий для их размера.</p>
      )}
      <p className="hint formula">
        К заказу — большее из «панелей с запасом» и минимального заказа, округлённое вверх до
        кратности. Пустой список стен даёт 0.
      </p>
      <button type="button" className="primary print-btn no-print" onClick={() => window.print()}>
        Печать / PDF
      </button>
    </section>
  );
}
