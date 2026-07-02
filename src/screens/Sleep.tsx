import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Ring } from '@/components/Ring';
import { Icon, type IconName } from '@/components/Icon';
import { useData } from '@/features/store';
import { simulatedSleepAdapter } from '@/features/sleep/adapter';
import {
  buildTrend,
  sleepReadiness,
  nightStages,
  sleepTips,
  sleepTracker,
  fmtClock,
  SLEEP_RANGES,
  type SleepRange,
} from '@/features/sleep/sleep';
import { buildRecovery } from '@/features/sleep/recovery';
import { Recovery } from './sleep/Recovery';
import { translator } from '@/lib/i18n';
import './sleep/sleep.css';

const adapter = simulatedSleepAdapter;

export function Sleep(): JSX.Element {
  const data = useData();
  const navigate = useNavigate();
  const t = translator(data.settings.lang);
  const [range, setRange] = useState<SleepRange>('2W');

  const back = (
    <button
      type="button"
      onClick={() => navigate('/more')}
      style={{
        background: 'none',
        border: 'none',
        color: 'var(--accent)',
        fontWeight: 700,
        cursor: 'pointer',
        padding: 0,
      }}
    >
      ← {t('more')}
    </button>
  );

  if (!data.pro) {
    return (
      <div className="screen">
        {back}
        <h1 className="screen__title">{t('sleep')}</h1>
        <Card
          style={{
            textAlign: 'center',
            borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)',
          }}
        >
          <Icon name="moon" size={30} style={{ color: 'var(--accent)' }} />
          <div
            style={{
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '6px 0',
            }}
          >
            {t('proOnly')}
          </div>
          <div className="state__msg" style={{ marginBottom: 14 }}>
            Connect a smartwatch or band and FORGE reads your sleep automatically — hours, stages, a
            recovery score and tips. No manual logging.
          </div>
          <Button onClick={() => navigate('/more')}>{t('upgrade')}</Button>
        </Card>
      </div>
    );
  }

  const tracker = sleepTracker(data.devices);
  if (!tracker) {
    return (
      <div className="screen">
        {back}
        <h1 className="screen__title">{t('sleep')}</h1>
        <Card
          style={{
            textAlign: 'center',
            borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)',
          }}
        >
          <Icon name="bolt" size={28} style={{ color: 'var(--accent)' }} />
          <div style={{ fontWeight: 700, margin: '6px 0' }}>Connect a sleep tracker</div>
          <div className="state__msg" style={{ marginBottom: 14 }}>
            Sleep is tracked automatically from a smartwatch or band — hours, stages, recovery score
            and tips. Pair one to begin.
          </div>
          <Button onClick={() => navigate('/more')}>{t('connect')}</Button>
        </Card>
      </div>
    );
  }

  const { night, readiness: rd } = sleepReadiness(adapter);
  const stages = nightStages(night);
  const trend = buildTrend(adapter, range);
  const tips = sleepTips(trend, night);
  const recovery = buildRecovery(adapter);

  const tiles: ReadonlyArray<[string, string]> = [
    [`${night.hours}h`, 'last night'],
    [fmtClock(night.bedMinutes), 'asleep'],
    [fmtClock(night.wakeMinutes), 'awake'],
    [String(night.restingHr), 'rest HR'],
  ];

  return (
    <div className="screen">
      {back}
      <h1 className="screen__title">{t('sleep')}</h1>

      {/* Sync source */}
      <Card
        style={{
          marginBottom: 12,
          display: 'flex',
          gap: 11,
          alignItems: 'center',
          borderColor: 'color-mix(in srgb, var(--accent) 27%, transparent)',
        }}
      >
        <Icon name="bolt" size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>Auto-synced from {tracker}</div>
          <div className="state__msg" style={{ textAlign: 'left', margin: 0, fontSize: '0.7rem' }}>
            Tracked automatically every night. {t('devNote')}
          </div>
        </div>
      </Card>

      {/* Readiness */}
      <Card style={{ marginBottom: 14 }}>
        <span className="pulse-header">Today&apos;s session readiness</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
          <Ring
            value={rd.score}
            max={100}
            size={92}
            stroke={8}
            color={rd.color}
            sub="/ 100"
            numberSize={26}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: rd.color }}>{rd.band}</div>
            <div className="state__msg" style={{ textAlign: 'left', margin: '4px 0 0' }}>
              {rd.recommendation}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {tiles.map(([v, l]) => (
            <div key={l} className="sleep-readiness-tile">
              <div className="sleep-readiness-tile__v">{v}</div>
              <div className="sleep-readiness-tile__l">{l}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recovery / HRV */}
      <Recovery lang={data.settings.lang} recovery={recovery} />

      {/* Stages */}
      <Card style={{ marginBottom: 14 }}>
        <span className="pulse-header">Last night · sleep stages</span>
        <div className="sleep-stages" style={{ marginTop: 10 }}>
          {stages.map(([n, frac, c]) => (
            <div
              key={n}
              style={{ width: `${frac * 100}%`, background: c }}
              title={`${n} ${Math.round(frac * 100)}%`}
            />
          ))}
        </div>
        <div className="sleep-legend">
          {stages.map(([n, frac, c]) => (
            <span key={n}>
              <i style={{ background: c }} />
              {n} {Math.round(frac * 100)}%
            </span>
          ))}
        </div>
      </Card>

      {/* Trend */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {SLEEP_RANGES.map(([k]) => (
            <Chip key={k} label={k} active={range === k} onClick={() => setRange(k)} />
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 10,
          }}
        >
          <span className="pulse-header">Avg over {range}</span>
          <span className="pulse-stat" style={{ fontSize: '1.05rem' }}>
            {trend.rangeAvg}h
          </span>
        </div>
        <div className={`sleep-trend ${trend.buckets.length > 20 ? 'sleep-trend--dense' : ''}`}>
          {trend.buckets.map((b, i) => (
            <div key={i} className="sleep-trend__col">
              <div
                className="sleep-trend__bar"
                title={`${b.hours}h`}
                style={{
                  height: Math.max(6, (b.hours / trend.maxHours) * 82),
                  opacity: 0.5 + (b.quality / 5) * 0.5,
                }}
              />
              {trend.showLabels ? <div className="sleep-trend__label">{b.label}</div> : null}
            </div>
          ))}
        </div>
        {!trend.showLabels ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span className="sleep-trend__label">{trend.startLabel}</span>
            <span className="sleep-trend__label">best {trend.bestHours}h</span>
            <span className="sleep-trend__label">{trend.endLabel}</span>
          </div>
        ) : null}
        <div className="state__msg" style={{ textAlign: 'left', marginTop: 8, fontSize: '0.7rem' }}>
          Brighter bars = better-quality nights.
        </div>
      </Card>

      {/* Tips */}
      <span className="pulse-header">How to improve</span>
      <div className="stack" style={{ marginTop: 10 }}>
        {tips.map((tip, i) => (
          <Card key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name={tip.icon as IconName} size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{tip.title}</div>
              <div className="state__msg" style={{ textAlign: 'left', margin: '2px 0 0' }}>
                {tip.text}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
