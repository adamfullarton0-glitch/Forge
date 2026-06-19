import { type CSSProperties } from 'react';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { useData, useUpdate } from '@/features/store';
import { getPlan } from '@/features/workouts/plans';
import { dayIdx } from '@/lib/calc';
import { translator } from '@/lib/i18n';
import type { PersistedState } from '@/types/schemas';

const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
const LEADS = [15, 30, 45, 60] as const;
const DEFAULT_TIME = '18:00';

/**
 * The weekly training schedule. Drives the Home dashboard's "today's session"
 * + upcoming reminders and Train's pre-selected day. Each weekday is either a
 * rest day or a training day mapped to one day of the active plan.
 */
export function Plan(): JSX.Element | null {
  const data = useData();
  const update = useUpdate();
  const t = translator(data.settings.lang);
  const p = data.profile;
  if (!p) return null;

  const plan = getPlan(data.planId, data.customPlans);
  const schedule = data.schedule;
  const today = dayIdx();
  const trainingDays = DAY_NAMES.filter((_, i) => schedule[String(i)]).length;

  const setSchedule = (next: PersistedState['schedule']): void => update({ schedule: next });

  const toggleDay = (i: number): void => {
    const key = String(i);
    const next = { ...schedule };
    if (next[key]) delete next[key];
    else next[key] = { day: '0', time: DEFAULT_TIME };
    setSchedule(next);
  };
  const setWorkout = (i: number, day: string): void =>
    setSchedule({
      ...schedule,
      [String(i)]: { day, time: schedule[String(i)]?.time ?? DEFAULT_TIME },
    });
  const setTime = (i: number, time: string): void =>
    setSchedule({
      ...schedule,
      [String(i)]: { day: schedule[String(i)]?.day ?? '0', time: time || DEFAULT_TIME },
    });

  const pill = (on: boolean): CSSProperties => ({
    border: `1px solid ${on ? 'var(--accent)' : 'var(--glass-border)'}`,
    background: on ? 'var(--accent-soft)' : 'transparent',
    color: on ? 'var(--accent)' : 'var(--muted)',
    fontWeight: 800,
    fontSize: '0.78rem',
    borderRadius: 99,
    padding: '6px 14px',
    cursor: 'pointer',
    flexShrink: 0,
  });

  return (
    <div className="screen">
      <h1 className="screen__title">{t('plan')}</h1>
      <p className="screen__lede">Your weekly training schedule.</p>

      {/* Summary */}
      <Card
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="stat-label">{t('yourPlan')}</div>
          <div
            style={{
              fontWeight: 800,
              fontSize: '1.05rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {plan.name}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="pulse-stat" style={{ fontSize: '1.4rem' }}>
            {trainingDays}
          </div>
          <div className="stat-label">days / week</div>
        </div>
      </Card>

      {/* Reminders */}
      <span className="pulse-header">Reminders</span>
      <Card style={{ margin: '12px 0 18px' }}>
        <label
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontWeight: 700 }}>Remind me before sessions</span>
          <input
            type="checkbox"
            checked={data.remind.on}
            onChange={(e) => update({ remind: { ...data.remind, on: e.target.checked } })}
            style={{ width: 18, height: 18, flexShrink: 0 }}
          />
        </label>
        {data.remind.on ? (
          <div style={{ marginTop: 12 }}>
            <div className="stat-label" style={{ marginBottom: 6 }}>
              Notify me
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {LEADS.map((m) => (
                <Chip
                  key={m}
                  label={`${m} min before`}
                  active={data.remind.lead === m}
                  onClick={() => update({ remind: { ...data.remind, lead: m } })}
                />
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      {/* Weekly schedule */}
      <span className="pulse-header">Weekly schedule</span>
      <p className="state__msg" style={{ textAlign: 'left', margin: '6px 0 12px' }}>
        Tap a day to switch it between rest and training, then pick the session and time.
      </p>
      <div className="stack">
        {DAY_NAMES.map((name, i) => {
          const entry = schedule[String(i)];
          const on = Boolean(entry);
          return (
            <Card key={name} style={{ borderColor: i === today ? 'var(--accent)' : undefined }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontWeight: 800 }}>
                  {name}
                  {i === today ? (
                    <span className="pro-badge" style={{ marginLeft: 8 }}>
                      {t('today')}
                    </span>
                  ) : null}
                </span>
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={`${name}: ${on ? 'training day, tap for rest' : 'rest day, tap for training'}`}
                  onClick={() => toggleDay(i)}
                  style={pill(on)}
                >
                  {on ? 'Training' : 'Rest'}
                </button>
              </div>
              {on && entry ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <select
                    className="select"
                    style={{ flex: '1 1 150px', minWidth: 0 }}
                    aria-label={`${name} session`}
                    value={entry.day}
                    onChange={(e) => setWorkout(i, e.target.value)}
                  >
                    {plan.days.map((d, di) => (
                      <option key={di} value={String(di)}>
                        {d.name}
                        {d.focus ? ` — ${d.focus}` : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    style={{ width: 124, flexShrink: 0 }}
                    type="time"
                    aria-label={`${name} time`}
                    value={entry.time}
                    onChange={(e) => setTime(i, e.target.value)}
                  />
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
