import { useEffect, useMemo, useState } from 'react';
import { SpecTab } from './components/SpecTab';
import { WallsTab } from './components/WallsTab';
import { cloneSettings, defaultSettings, defaultWalls } from './domain/defaults';
import { summarize } from './domain/summary';
import { loadState, saveState } from './domain/storage';
import type { Settings, Wall } from './domain/types';
import { formatInt, methodLabel } from './domain/format';

type Tab = 'walls' | 'spec';

export function App() {
  const [stored] = useState(() => loadState());
  const [tab, setTab] = useState<Tab>('walls');
  const [walls, setWalls] = useState<Wall[]>(stored?.walls ?? defaultWalls);
  const [settings, setSettings] = useState<Settings>(stored?.settings ?? cloneSettings());
  const summary = useMemo(() => summarize(walls, settings), [walls, settings]);

  useEffect(() => {
    saveState({ walls, settings });
  }, [walls, settings]);

  return (
    <>
      <header className="top">
        <div className="brand">
          <Logo />
          <div>
            <h1>Калькулятор термопанелей</h1>
            <p>Кирпич 240×65 мм · шов 10 мм · край основы 5 мм</p>
          </div>
        </div>
        <div className="tabs no-print" role="tablist" aria-label="Разделы">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'walls'}
            onClick={() => setTab('walls')}
          >
            Стены
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'spec'}
            onClick={() => setTab('spec')}
          >
            Спецификация
          </button>
        </div>
      </header>

      <p className="order-pill no-print" data-testid="order-pill">
        К заказу <strong>{formatInt(summary.toOrder)} шт.</strong>
        <span>
          {methodLabel(settings.method)} · запас {settings.marginPercent}%
        </span>
      </p>

      <main>
        <div className={tab === 'walls' ? 'tab walls-tab active' : 'tab walls-tab'} role="tabpanel">
          <WallsTab
            walls={walls}
            settings={settings}
            summary={summary}
            onAdd={() =>
              setWalls((list) => [
                ...list,
                {
                  id: crypto.randomUUID(),
                  name: `Стена ${list.length + 1}`,
                  widthM: 4,
                  heightM: 3,
                },
              ])
            }
            onRemove={(id) => setWalls((list) => list.filter((wall) => wall.id !== id))}
            onUpdate={(id, patch) =>
              setWalls((list) => list.map((wall) => (wall.id === id ? { ...wall, ...patch } : wall)))
            }
          />
        </div>
        <div
          className={tab === 'spec' ? 'tab spec-tab active no-print' : 'tab spec-tab no-print'}
          role="tabpanel"
        >
          <SpecTab
            settings={settings}
            summary={summary}
            onChange={setSettings}
            onReset={() => setSettings(cloneSettings(defaultSettings))}
          />
        </div>
      </main>
    </>
  );
}

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#f7f1e6" />
      <path fill="#d7c09a" d="M6 32h36v8H6z" />
      <path fill="#9a3f24" d="M12 20h24v8H12z" />
      <path fill="#d7c09a" d="M6 8h36v8H6z" />
    </svg>
  );
}
