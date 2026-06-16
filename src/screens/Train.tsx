import { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ActiveWorkout } from './train/ActiveWorkout';
import { useData, useUpdate } from '@/features/store';
import { PLANS, getPlan } from '@/features/workouts/plans';
import { translator } from '@/lib/i18n';
import { dayIdx } from '@/lib/calc';
import './train/train.css';

export function Train(): JSX.Element {
  const data = useData();
  const update = useUpdate();
  const t = translator(data.settings.lang);
  const [sel, setSel] = useState<number | null>(null);

  if (data.active) {
    return <ActiveWorkout active={data.active} />;
  }

  const plan = getPlan(data.planId);
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
              {d.name} — {d.focus}
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

      <span className="pulse-header">{t('workouts')}</span>
      <p className="state__msg" style={{ textAlign: 'left', margin: '6px 0 12px' }}>
        {t('yourPlan')}: <b style={{ color: 'var(--text)' }}>{plan.name}</b>
      </p>
      <div className="stack">
        {Object.entries(PLANS).map(([id, pl]) => (
          <Card
            key={id}
            onClick={() => {
              update({ planId: id });
              setSel(null);
            }}
            style={{
              cursor: 'pointer',
              borderColor: id === data.planId ? 'var(--accent)' : undefined,
            }}
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
    </div>
  );
}
