import { useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ActiveWorkout } from './train/ActiveWorkout';
import { RoutineBuilder } from './train/RoutineBuilder';
import { BodyMapFinder } from './train/BodyMapFinder';
import { useData, useUpdate } from '@/features/store';
import {
  PLAN_CATALOGUE,
  PLAN_LEVELS,
  getPlan,
  DEFAULT_PLAN_ID,
  type PlanLevel,
} from '@/features/workouts/plans';
import { translator } from '@/lib/i18n';
import { dayIdx } from '@/lib/calc';
import type { CustomPlan } from '@/types/schemas';
import './train/train.css';

export function Train(): JSX.Element {
  const data = useData();
  const update = useUpdate();
  const t = translator(data.settings.lang);
  const [sel, setSel] = useState<number | null>(null);
  const [builder, setBuilder] = useState<{ open: boolean; editing: CustomPlan | null }>({
    open: false,
    editing: null,
  });
  const [finder, setFinder] = useState(false);
  const [query, setQuery] = useState('');
  const [levelF, setLevelF] = useState<'all' | PlanLevel>('all');
  const [daysF, setDaysF] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLAN_CATALOGUE.filter((e) => {
      // All-level plans (level === null) stay visible under every level filter.
      if (levelF !== 'all' && e.level !== null && e.level !== levelF) return false;
      if (daysF !== 'all') {
        const ok =
          daysF === '12' ? e.days <= 2 : daysF === '6' ? e.days >= 6 : e.days === Number(daysF);
        if (!ok) return false;
      }
      if (q && !`${e.plan.name} ${e.plan.tag} ${e.plan.desc}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [query, levelF, daysF]);

  const filtersActive = query.trim() !== '' || levelF !== 'all' || daysF !== 'all';
  const clearFilters = (): void => {
    setQuery('');
    setLevelF('all');
    setDaysF('all');
  };

  if (data.active) {
    return <ActiveWorkout active={data.active} />;
  }

  const plan = getPlan(data.planId, data.customPlans);
  const todaySched = data.schedule[String(dayIdx())];
  const defaultDay =
    sel != null
      ? sel
      : todaySched
        ? Math.min(Number(todaySched.day) || 0, plan.days.length - 1)
        : 0;
  const startDay = plan.days[defaultDay];

  const startSession = (): void => {
    update({ active: { day: defaultDay, checked: [], swaps: {} } });
  };

  const selectPlan = (id: string): void => {
    update({ planId: id });
    setSel(null);
  };

  const saveRoutine = (routine: CustomPlan): void => {
    // Replace in place when editing (preserves list order); append when new.
    const exists = data.customPlans.some((c) => c.id === routine.id);
    const customPlans = exists
      ? data.customPlans.map((c) => (c.id === routine.id ? routine : c))
      : [...data.customPlans, routine];
    update({ customPlans, planId: routine.id });
    setSel(null);
    setBuilder({ open: false, editing: null });
  };

  const deleteRoutine = (id: string): void => {
    update({
      customPlans: data.customPlans.filter((c) => c.id !== id),
      ...(data.planId === id ? { planId: DEFAULT_PLAN_ID } : {}),
    });
    setSel(null);
  };

  return (
    <div className="screen">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <h1 className="screen__title" style={{ margin: 0 }}>
          Train
        </h1>
        <Button variant="ghost" onClick={() => setFinder(true)}>
          {t('findByMuscle')}
        </Button>
      </div>
      <p className="screen__lede">{t('startSession')}.</p>

      <Card
        style={{
          borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)',
          marginBottom: 18,
        }}
      >
        <span className="pulse-header">{t('chooseSession')}</span>
        <select
          className="select"
          style={{ margin: '10px 0 6px' }}
          aria-label={t('chooseSession')}
          value={defaultDay}
          onChange={(e) => setSel(Number(e.target.value))}
        >
          {plan.days.map((d, i) => (
            <option key={i} value={i}>
              {d.name}
              {d.focus ? ` — ${d.focus}` : ''}
            </option>
          ))}
        </select>
        <div className="state__msg" style={{ textAlign: 'left', marginBottom: 14 }}>
          {startDay?.ex.length} exercises
          {todaySched && (Number(todaySched.day) || 0) === defaultDay
            ? ` · ${t('today')} ${todaySched.time}`
            : ''}
        </div>
        <Button onClick={startSession} style={{ width: '100%' }}>
          {t('start')}
        </Button>
        {!todaySched ? (
          <div className="state__msg" style={{ textAlign: 'left', marginTop: 10 }}>
            {t('restStart')}
          </div>
        ) : null}
      </Card>

      {/* Custom routines */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="pulse-header">{t('myRoutines')}</span>
        <Button variant="ghost" onClick={() => setBuilder({ open: true, editing: null })}>
          {t('createRoutine')}
        </Button>
      </div>
      <div className="stack" style={{ margin: '12px 0 18px' }}>
        {data.customPlans.length === 0 ? (
          <Card>
            <div className="state__msg" style={{ textAlign: 'left', margin: 0 }}>
              {t('routineHint')}
            </div>
          </Card>
        ) : (
          data.customPlans.map((c) => (
            <Card
              key={c.id}
              style={{ borderColor: c.id === data.planId ? 'var(--accent)' : undefined }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => selectPlan(c.id)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>{c.name}</span>
                    {c.id === data.planId ? <span className="pro-badge">{t('active')}</span> : null}
                  </div>
                  <div className="state__msg" style={{ textAlign: 'left', margin: '3px 0 0' }}>
                    {c.days.length} day{c.days.length === 1 ? '' : 's'} ·{' '}
                    {c.days.reduce((n, d) => n + d.ex.length, 0)} exercises
                  </div>
                </button>
                <Button
                  variant="ghost"
                  aria-label={`${t('edit')} ${c.name}`}
                  onClick={() => setBuilder({ open: true, editing: c })}
                >
                  {t('edit')}
                </Button>
                <button
                  type="button"
                  className="modal-close"
                  style={{ width: 36 }}
                  aria-label={`${t('deleteR')} ${c.name}`}
                  onClick={() => deleteRoutine(c.id)}
                >
                  ✕
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      <span className="pulse-header">{t('workouts')}</span>
      <p className="state__msg" style={{ textAlign: 'left', margin: '6px 0 12px' }}>
        {t('yourPlan')}: <b style={{ color: 'var(--text)' }}>{plan.name}</b>
      </p>

      {/* Filters for the program catalogue */}
      <input
        className="input"
        style={{ width: '100%', marginBottom: 10 }}
        aria-label="Search workouts"
        placeholder="Search workouts…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="train-filter">
        <span className="stat-label train-filter__label">Level</span>
        <div className="train-filter__chips">
          <Chip label="All" active={levelF === 'all'} onClick={() => setLevelF('all')} />
          {PLAN_LEVELS.map((lvl) => (
            <Chip
              key={lvl}
              label={lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              active={levelF === lvl}
              onClick={() => setLevelF(lvl)}
            />
          ))}
        </div>
      </div>
      <div className="train-filter">
        <span className="stat-label train-filter__label">Days / week</span>
        <div className="train-filter__chips">
          {(
            [
              ['all', 'All'],
              ['12', '1–2'],
              ['3', '3'],
              ['4', '4'],
              ['5', '5'],
              ['6', '6+'],
            ] as const
          ).map(([k, l]) => (
            <Chip key={k} label={l} active={daysF === k} onClick={() => setDaysF(k)} />
          ))}
        </div>
      </div>
      <div
        className="state__msg"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left',
          margin: '4px 0 12px',
          gap: 8,
        }}
      >
        <span>
          {filtered.length} {filtered.length === 1 ? 'workout' : 'workouts'}
        </span>
        {filtersActive ? (
          <button type="button" className="train-clear" onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="state__msg" style={{ margin: 0 }}>
            No workouts match these filters. Try clearing one.
          </div>
        </Card>
      ) : (
        <div className="stack">
          {filtered.map(({ id, plan: pl }) => (
            <Card
              key={id}
              onClick={() => selectPlan(id)}
              style={{ borderColor: id === data.planId ? 'var(--accent)' : undefined }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{pl.name}</div>
                {id === data.planId ? <span className="pro-badge">{t('active')}</span> : null}
              </div>
              <div
                style={{
                  color: 'var(--accent)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  margin: '3px 0 5px',
                }}
              >
                {pl.tag}
              </div>
              <div className="state__msg" style={{ textAlign: 'left', margin: 0 }}>
                {pl.desc}
              </div>
            </Card>
          ))}
        </div>
      )}

      {builder.open ? (
        <RoutineBuilder
          lang={data.settings.lang}
          initial={builder.editing}
          onSave={saveRoutine}
          onClose={() => setBuilder({ open: false, editing: null })}
        />
      ) : null}

      {finder ? <BodyMapFinder lang={data.settings.lang} onClose={() => setFinder(false)} /> : null}
    </div>
  );
}
