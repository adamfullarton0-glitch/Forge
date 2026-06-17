import { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ActiveWorkout } from './train/ActiveWorkout';
import { RoutineBuilder } from './train/RoutineBuilder';
import { useData, useUpdate } from '@/features/store';
import { PLANS, getPlan, DEFAULT_PLAN_ID } from '@/features/workouts/plans';
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
    const others = data.customPlans.filter((c) => c.id !== routine.id);
    update({ customPlans: [...others, routine], planId: routine.id });
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
      <h1 className="screen__title">Train</h1>
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
      <div className="stack">
        {Object.entries(PLANS).map(([id, pl]) => (
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

      {builder.open ? (
        <RoutineBuilder
          lang={data.settings.lang}
          initial={builder.editing}
          onSave={saveRoutine}
          onClose={() => setBuilder({ open: false, editing: null })}
        />
      ) : null}
    </div>
  );
}
