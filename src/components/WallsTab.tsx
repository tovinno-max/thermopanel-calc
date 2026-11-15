import { brickColor, jointColor } from '../domain/colors';
import { formatArea, formatFlexible, formatInt, formatMeters } from '../domain/format';
import type { OrderSummary, WallResult } from '../domain/summary';
import type { Settings, Wall } from '../domain/types';
import { SummaryCard } from './SummaryCard';
import { WallSvg } from './WallSvg';

const BRICK_DRAW_LIMIT = 800;

type Props = {
  walls: Wall[];
  settings: Settings;
  summary: OrderSummary;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Wall>) => void;
};

export function WallsTab({ walls, settings, summary, onAdd, onRemove, onUpdate }: Props) {
  const brick = brickColor(settings.brickColorId);
  const joint = jointColor(settings.jointColorId);
  const standard =
    settings.pitchXmm === 875 && settings.pitchYmm === 600 && settings.columnOffsetMm === 75;

  return (
    <div className="stack">
      <section className="card editor no-print">
        <div className="section-head row">
          <div>
            <h2>Список стен</h2>
            <p className="hint">Ширина и высота в метрах. Окна и двери не вычитаются.</p>
          </div>
          <button type="button" className="primary" onClick={onAdd} disabled={walls.length >= 50}>
            Добавить стену
          </button>
        </div>
        {walls.length === 0 ? (
          <p className="empty">Стен пока нет. Добавьте первую — расчёт начнётся сразу.</p>
        ) : (
          <ul className="wall-list">
            {walls.map((wall) => (
              <li key={wall.id} className="wall-row">
                <label className="field name">
                  Название
                  <input
                    type="text"
                    value={wall.name}
                    maxLength={80}
                    onChange={(event) => onUpdate(wall.id, { name: event.target.value })}
                  />
                </label>
                <label className="field">
                  Ширина, м
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={500}
                    step={0.01}
                    value={wall.widthM}
                    onChange={(event) =>
                      onUpdate(wall.id, { widthM: numberValue(event.target.value) })
                    }
                    onWheel={(event) => event.currentTarget.blur()}
                  />
                </label>
                <label className="field">
                  Высота, м
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={500}
                    step={0.01}
                    value={wall.heightM}
                    onChange={(event) =>
                      onUpdate(wall.id, { heightM: numberValue(event.target.value) })
                    }
                    onWheel={(event) => event.currentTarget.blur()}
                  />
                </label>
                <button
                  type="button"
                  className="ghost danger"
                  onClick={() => onRemove(wall.id)}
                  aria-label={`Удалить ${wall.name}`}
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="stack" aria-label="Раскладка">
        <div className="section-head">
          <h2>Раскладка по стенам</h2>
          <p className="hint">
            Старт от левого нижнего угла. Шаг {formatFlexible(settings.pitchXmm)}×
            {formatFlexible(settings.pitchYmm)} мм, нечётные колонны сдвинуты вниз на{' '}
            {formatFlexible(settings.columnOffsetMm)} мм. На схеме контур основы каждой панели.
          </p>
          {!standard && (
            <p className="warn">
              Шаг отличается от рекомендуемого 875×600 мм со сдвигом 75 мм — зубцы могут не сойтись
              без зазоров.
            </p>
          )}
        </div>
        <ul className="legend">
          <li>
            <i className="key solid" /> Целая панель
          </li>
          <li>
            <i className="key dashed" /> Подрезанная панель
          </li>
          <li>
            <i className="key wall" /> Кромка стены во впадине первой колонны
          </li>
        </ul>
        <div className="results">
          {summary.walls.map((wall) => (
            <WallCard
              key={wall.id}
              wall={wall}
              method={settings.method}
              brick={brick}
              joint={joint}
            />
          ))}
        </div>
      </section>

      <SummaryCard summary={summary} settings={settings} />
    </div>
  );
}

function WallCard({
  wall,
  method,
  brick,
  joint,
}: {
  wall: WallResult;
  method: Settings['method'];
  brick: ReturnType<typeof brickColor>;
  joint: ReturnType<typeof jointColor>;
}) {
  const drawBricks = wall.panels.length > 0 && wall.panels.length <= BRICK_DRAW_LIMIT;
  return (
    <article className="card wall-card" data-testid="wall-card" data-wall-id={wall.id}>
      <header className="wall-card-head">
        <h3>{wall.name.trim() || 'Стена'}</h3>
        <p>
          {formatMeters(wall.widthM)} × {formatMeters(wall.heightM)} м
          <span className="dot">·</span>
          {formatArea(wall.areaM2)}
        </p>
      </header>
      {!wall.valid ? (
        <p className="warn">Укажите ширину и высоту больше нуля.</p>
      ) : wall.overflow && method === 'layout' ? (
        <p className="warn">
          Слишком много панелей для этой стены. Увеличьте шаг или уменьшите размер.
        </p>
      ) : (
        <>
          <div className="stats">
            <Stat label="Целые" value={wall.whole} testId="whole" />
            <Stat label="Подрезанные" value={wall.cut} testId="cut" />
            <Stat
              label="По раскладке"
              value={wall.layoutTotal}
              testId="layout-total"
              active={method === 'layout'}
            />
            <Stat
              label="По площади"
              value={wall.areaTotal}
              testId="area-total"
              active={method === 'area'}
            />
          </div>
          {wall.overflow ? (
            <p className="warn">Схему не построить: слишком мелкий шаг. Число по площади посчитано.</p>
          ) : (
            <div className="svg-frame">
              <WallSvg
                widthMm={wall.widthMm}
                heightMm={wall.heightMm}
                panels={wall.panels}
                brick={brick}
                joint={joint}
                drawBricks={drawBricks}
                label={`${wall.name}: ${wall.whole} целых, ${wall.cut} подрезанных`}
              />
            </div>
          )}
          {!wall.overflow && !drawBricks && wall.panels.length > BRICK_DRAW_LIMIT && (
            <p className="hint">Кирпичи скрыты: панелей много, на схеме только контуры.</p>
          )}
        </>
      )}
    </article>
  );
}

function Stat({
  label,
  value,
  testId,
  active = false,
}: {
  label: string;
  value: number;
  testId: string;
  active?: boolean;
}) {
  return (
    <div className={active ? 'stat active' : 'stat'}>
      <span>{label}</span>
      <b data-testid={testId}>{formatInt(value)}</b>
    </div>
  );
}

function numberValue(raw: string): number {
  if (raw.trim() === '') return 0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}
