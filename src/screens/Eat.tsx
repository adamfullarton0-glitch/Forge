import { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Bar } from '@/components/Bar';
import { Icon } from '@/components/Icon';
import { Loading, ErrorState, EmptyState } from '@/components/states';
import { Micronutrients } from './eat/Micronutrients';
import { useData, useUpdate } from '@/features/store';
import { QUICK_FOODS } from '@/features/nutrition/constants';
import { sumMicros } from '@/features/nutrition/micros';
import { searchFoods, type FoodItem } from '@/lib/api/openfoodfacts';
import { calcTargets, calorieGuide, todayKey } from '@/lib/calc';
import { translator } from '@/lib/i18n';
import type { FoodEntry, Profile } from '@/types/schemas';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;
type Meal = (typeof MEALS)[number];

const n = (v: number | undefined): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

function hourMeal(): Meal {
  const h = new Date().getHours();
  return h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 21 ? 'dinner' : 'snacks';
}

interface CustomFood {
  n: string;
  kcal: string;
  p: string;
  c: string;
  f: string;
  fiber: string;
  sugar: string;
  sodium: string;
}
const emptyCustom: CustomFood = {
  n: '',
  kcal: '',
  p: '',
  c: '',
  f: '',
  fiber: '',
  sugar: '',
  sodium: '',
};

function CalorieGuideCard({ p }: { p: Profile }): JSX.Element | null {
  const g = calorieGuide(p);
  if (!g) return null;
  const goalKey = p.goal === 'lose' ? 'cut' : p.goal === 'gain' ? 'leanBulk' : 'maintenance';
  const rows: ReadonlyArray<[keyof typeof g, string, string]> = [
    ['maintenance', 'Maintenance', 'Weight stays steady'],
    ['cut', 'Fat loss', '~0.5 kg / week down'],
    ['leanBulk', 'Lean bulk', 'Slow, mostly-muscle gain'],
    ['aggressiveBulk', 'Aggressive bulk', 'Faster gain, more fat'],
  ];
  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="bolt" size={16} style={{ color: 'var(--accent)' }} />
        <div style={{ fontWeight: 700 }}>Your calorie guide</div>
      </div>
      <div className="state__msg" style={{ textAlign: 'left', margin: '4px 0 12px' }}>
        Daily targets from your stats. Your current goal is highlighted.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(([key, label, desc]) => {
          const on = key === goalKey;
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '11px 13px',
                borderRadius: 12,
                background: 'var(--panel-2)',
                border: `1px solid ${on ? 'var(--accent)' : 'transparent'}`,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: on ? 'var(--accent)' : 'var(--text)' }}>
                  {label}
                </div>
                <div className="stat-label" style={{ textTransform: 'none', letterSpacing: 0 }}>
                  {desc}
                </div>
              </div>
              <div className="pulse-stat" style={{ fontSize: '1.05rem' }}>
                {g[key]}
                <span className="stat-label" style={{ marginLeft: 3 }}>
                  kcal
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function Eat(): JSX.Element | null {
  const data = useData();
  const update = useUpdate();
  const t = translator(data.settings.lang);

  const p = data.profile;
  const [meal, setMeal] = useState<Meal>(hourMeal());
  const [custom, setCustom] = useState<CustomFood>(emptyCustom);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  if (!p) return null;

  const tg = calcTargets(p);
  const tk = todayKey();
  const log = data.foodLog[tk] ?? [];

  const tot = log.reduce(
    (s, x) => ({
      kcal: s.kcal + n(x.kcal),
      p: s.p + n(x.p),
      c: s.c + n(x.c),
      f: s.f + n(x.f),
    }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
  const micros = sumMicros(log);

  const addFood = (item: Omit<FoodEntry, 'meal'>): void => {
    update({ foodLog: { ...data.foodLog, [tk]: [...log, { meal, ...item }] } });
  };
  const removeFood = (idx: number): void => {
    update({ foodLog: { ...data.foodLog, [tk]: log.filter((_, j) => j !== idx) } });
  };

  const runSearch = (): void => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(false);
    setResults(null);
    void searchFoods(q).then((res) => {
      setSearching(false);
      if (res.ok) setResults(res.items);
      else {
        setSearchError(true);
        setResults([]);
      }
    });
  };

  const addCustom = (): void => {
    addFood({
      n: custom.n,
      kcal: n(parseFloat(custom.kcal)),
      p: n(parseFloat(custom.p)),
      c: n(parseFloat(custom.c)),
      f: n(parseFloat(custom.f)),
      fiber: n(parseFloat(custom.fiber)),
      sugar: n(parseFloat(custom.sugar)),
      sodium: n(parseFloat(custom.sodium)),
    });
    setCustom(emptyCustom);
  };

  return (
    <div className="screen">
      <h1 className="screen__title">{t('nutrition')}</h1>

      {/* Macro tracking */}
      <Card style={{ marginBottom: 14 }}>
        <span className="pulse-header">{t('track')}</span>
        <div style={{ marginTop: 12 }}>
          <Bar label={t('calories')} value={tot.kcal} max={tg.kcal} color="var(--accent)" />
          <Bar label={t('protein')} value={tot.p} max={tg.protein} color="#3D8BFF" unit="g" />
          <Bar label={t('carbs')} value={tot.c} max={tg.carbs} color="#F5A623" unit="g" />
          <Bar label={t('fat')} value={tot.f} max={tg.fat} color="#F0479C" unit="g" />
        </div>
      </Card>

      <Micronutrients lang={data.settings.lang} totals={micros} />

      <CalorieGuideCard p={p} />

      {/* Meal selector */}
      <span className="pulse-header">{t('logMeal').replace('+ ', '')}</span>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0 14px', flexWrap: 'wrap' }}>
        {MEALS.map((m) => (
          <Chip key={m} label={t(m)} active={meal === m} onClick={() => setMeal(m)} />
        ))}
      </div>

      {/* Open Food Facts search */}
      <Card style={{ marginBottom: 14 }}>
        <span className="pulse-header">{t('searchFood')}</span>
        <div style={{ display: 'flex', gap: 8, margin: '10px 0 8px' }}>
          <input
            className="input"
            aria-label={t('searchFood')}
            placeholder={t('scanHint')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch();
            }}
          />
          <Button onClick={runSearch} aria-label="Search">
            →
          </Button>
        </div>
        <div className="state__msg" style={{ textAlign: 'left', margin: 0 }}>
          {t('foodDbNote')}
        </div>
        {searching ? <Loading label={t('searching')} /> : null}
        {searchError ? (
          <ErrorState
            title="Couldn't reach the food database"
            message="It works in the live app — add a custom food below for now."
            onRetry={runSearch}
          />
        ) : null}
        {results && !searching && results.length === 0 && !searchError ? (
          <EmptyState title={t('noResults')} icon="eat" />
        ) : null}
        {results
          ? results.slice(0, 12).map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 0',
                  borderTop: '1px solid var(--glass-border)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.n}
                  </div>
                  <div className="state__msg" style={{ textAlign: 'left', margin: 0 }}>
                    {r.kcal} kcal · P{r.p} C{r.c} F{r.f} · /{r.basis}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  aria-label={`Add ${r.n}`}
                  onClick={() =>
                    addFood({
                      n: r.n,
                      kcal: r.kcal,
                      p: r.p,
                      c: r.c,
                      f: r.f,
                      fiber: r.fiber,
                      sugar: r.sugar,
                      sodium: r.sodium,
                    })
                  }
                >
                  +
                </Button>
              </div>
            ))
          : null}
      </Card>

      {/* Quick add */}
      <span className="pulse-header">{t('quick')}</span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0 14px' }}>
        {QUICK_FOODS.map((qf) => (
          <Chip key={qf.n} label={`+ ${qf.n}`} onClick={() => addFood({ ...qf })} />
        ))}
      </div>

      {/* Custom food */}
      <span className="pulse-header">{t('custom')}</span>
      <Card style={{ margin: '12px 0 14px' }}>
        <input
          className="input"
          style={{ marginBottom: 10 }}
          aria-label={t('foodName')}
          placeholder={t('foodName')}
          value={custom.n}
          onChange={(e) => setCustom({ ...custom, n: e.target.value })}
        />
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {(['kcal', 'p', 'c', 'f'] as const).map((k) => (
            <input
              key={k}
              className="input"
              style={{ padding: '10px 8px' }}
              type="number"
              aria-label={k === 'kcal' ? 'kcal' : `${k.toUpperCase()} grams`}
              placeholder={k === 'kcal' ? 'kcal' : `${k.toUpperCase()} g`}
              value={custom[k]}
              onChange={(e) => setCustom({ ...custom, [k]: e.target.value })}
            />
          ))}
        </div>
        <Button onClick={addCustom} disabled={!custom.n || !custom.kcal} style={{ width: '100%' }}>
          {t('add')}
        </Button>
      </Card>

      {/* Today's log */}
      <span className="pulse-header">{t('log')}</span>
      <div style={{ marginTop: 12 }}>
        {log.length === 0 ? (
          <Card>
            <EmptyState title={t('empty')} icon="eat" />
          </Card>
        ) : (
          MEALS.map((m) => {
            const items = log
              .map((x, i) => ({ x, i }))
              .filter(({ x }) => (x.meal || 'snacks') === m);
            if (items.length === 0) return null;
            const mealKcal = items.reduce((s, { x }) => s + n(x.kcal), 0);
            return (
              <div key={m} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    margin: '4px 2px 6px',
                  }}
                >
                  <div className="stat-label">{t(m)}</div>
                  <div className="stat-label">{Math.round(mealKcal)} kcal</div>
                </div>
                {items.map(({ x, i }) => (
                  <Card
                    key={i}
                    style={{
                      marginBottom: 6,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {x.n ?? x.name}
                      </div>
                      <div className="state__msg" style={{ textAlign: 'left', margin: 0 }}>
                        {n(x.kcal)} kcal · P{n(x.p)} C{n(x.c)} F{n(x.f)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="modal-close"
                      style={{ width: 32, height: 32 }}
                      aria-label={`Remove ${x.n ?? x.name ?? 'item'}`}
                      onClick={() => removeFood(i)}
                    >
                      ✕
                    </button>
                  </Card>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
