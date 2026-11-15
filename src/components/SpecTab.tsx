import { BRICK_COLORS, JOINT_COLORS, brickColor, jointColor } from '../domain/colors';
import { defaultSettings } from '../domain/defaults';
import { PANEL_USEFUL_M2 } from '../domain/geometry';
import { formatFlexible, formatInt, methodLabel } from '../domain/format';
import type { OrderSummary } from '../domain/summary';
import type { InsulationCm, Settings } from '../domain/types';

type Props = {
  settings: Settings;
  summary: OrderSummary;
  onChange: (settings: Settings) => void;
  onReset: () => void;
};

export function SpecTab({ settings, summary, onChange, onReset }: Props) {
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    onChange({ ...settings, [key]: value });
  };
  const brick = brickColor(settings.brickColorId);
  const joint = jointColor(settings.jointColorId);

  return (
    <div className="stack">
      <section className="card">
        <div className="section-head row">
          <div>
            <h2>Параметры</h2>
            <p className="hint">
              Сейчас к заказу {formatInt(summary.toOrder)} шт. — {methodLabel(settings.method)}.
            </p>
          </div>
          <button type="button" className="ghost" onClick={onReset}>
            Сбросить параметры
          </button>
        </div>

        <fieldset className="choices-wrap">
          <legend>Способ подсчёта</legend>
          <div className="choices">
            <label className="choice">
              <input
                type="radio"
                name="method"
                checked={settings.method === 'layout'}
                onChange={() => set('method', 'layout')}
              />
              <span>
                <strong>По раскладке</strong>
                <small>Каждая панель, которая закрывает хотя бы часть стены, включая подрезанные.</small>
              </span>
            </label>
            <label className="choice">
              <input
                type="radio"
                name="method"
                checked={settings.method === 'area'}
                onChange={() => set('method', 'area')}
              />
              <span>
                <strong>По площади</strong>
                <small>
                  Площадь стены делится на полезную площадь и округляется вверх. Стены считаются
                  отдельно.
                </small>
              </span>
            </label>
          </div>
        </fieldset>

        <div className="form-grid">
          <NumberField
            label="Полезная площадь панели, м²"
            value={settings.usefulAreaM2}
            min={0.001}
            max={10}
            step={0.001}
            hint={`Геометрическая полезная площадь этой панели — ${formatFlexible(PANEL_USEFUL_M2)} м². В расчёт по площади идёт число из поля (по умолчанию ${formatFlexible(defaultSettings.usefulAreaM2)}).`}
            onChange={(value) => set('usefulAreaM2', value)}
          />
          <NumberField
            label="Шаг по горизонтали, мм"
            value={settings.pitchXmm}
            min={1}
            max={5000}
            step={1}
            hint="В ряду панели чередуются: A и поворот на 180° (B). При 875 мм шов между ними 10 мм."
            onChange={(value) => set('pitchXmm', value)}
          />
          <NumberField
            label="Шаг по вертикали, мм"
            value={settings.pitchYmm}
            min={1}
            max={5000}
            step={1}
            hint="Нечётный ряд сдвинут вправо на 500 мм: вертикальные швы расходятся на 375 мм, а кирпич верхнего ряда садится на середину шва нижнего."
            onChange={(value) => set('pitchYmm', value)}
          />
          <NumberField
            label="Запас, %"
            value={settings.marginPercent}
            min={0}
            max={100}
            step={0.5}
            onChange={(value) => set('marginPercent', value)}
          />
          <NumberField
            label="Минимальный заказ, шт."
            value={settings.minOrder}
            min={0}
            max={100000}
            step={1}
            onChange={(value) => set('minOrder', value)}
          />
          <NumberField
            label="Округлять заказ вверх до кратности, шт."
            value={settings.orderMultiple}
            min={1}
            max={10000}
            step={1}
            onChange={(value) => set('orderMultiple', value)}
          />
          <div className="field">
            <span>Толщина утеплителя</span>
            <div className="segment" role="group" aria-label="Толщина утеплителя">
              {([3, 5] as InsulationCm[]).map((cm) => (
                <button
                  key={cm}
                  type="button"
                  aria-pressed={settings.insulationCm === cm}
                  onClick={() => set('insulationCm', cm)}
                >
                  {cm} см
                </button>
              ))}
            </div>
            <p className="hint">На количество панелей не влияет, попадает в спецификацию.</p>
          </div>
          <label className="field">
            Цвет кирпича
            <span className="color-line">
              <i className="swatch" style={{ background: brick.fill, borderColor: brick.stroke }} />
              <select
                value={settings.brickColorId}
                onChange={(event) => set('brickColorId', event.target.value)}
              >
                {BRICK_COLORS.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <label className="field">
            Цвет шва
            <span className="color-line">
              <i className="swatch" style={{ background: joint.fill }} />
              <select
                value={settings.jointColorId}
                onChange={(event) => set('jointColorId', event.target.value)}
              >
                {JOINT_COLORS.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>
        <p className="hint reset-note">Сброс возвращает параметры. Список стен не меняется.</p>
      </section>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  hint?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      {label}
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const next = event.target.valueAsNumber;
          if (!Number.isFinite(next)) return;
          onChange(Math.min(max, Math.max(min, next)));
        }}
        onWheel={(event) => event.currentTarget.blur()}
      />
      {hint ? <span className="hint">{hint}</span> : null}
    </label>
  );
}
