import { Card } from '@/components/Card';
import type { RecoverySummary } from '@/features/sleep/recovery';
import { translator } from '@/lib/i18n';

interface RecoveryProps {
  lang: string;
  recovery: RecoverySummary;
}

/** Renders the HRV sparkline as a simple inline SVG polyline. */
function Sparkline({ values, color }: { values: number[]; color: string }): JSX.Element | null {
  const w = 100;
  const h = 32;
  // Defensive: drop any non-finite point so a bad value can't NaN the geometry.
  const safe = values.filter((v) => Number.isFinite(v));
  if (safe.length === 0) return null;
  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const span = Math.max(1, max - min);
  const step = safe.length > 1 ? w / (safe.length - 1) : w;
  const pts = safe.map((v, i) => `${i * step},${h - 4 - ((v - min) / span) * (h - 8)}`).join(' ');
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** HRV-led recovery panel: today vs personal baseline, plus key biometrics. */
export function Recovery({ lang, recovery }: RecoveryProps): JSX.Element {
  const t = translator(lang);
  const { hrv, baseline, restingHr, respiratory, status, trend } = recovery;
  const devPct = Math.round(status.deviation * 100);
  const devText = `${devPct > 0 ? '+' : ''}${devPct}% ${t('vsBaseline')}`;

  const tiles: ReadonlyArray<[string, string]> = [
    [`${baseline} ms`, t('hrvBaselineL')],
    [`${restingHr} bpm`, t('restHR')],
    [`${respiratory} ${t('rrUnit')}`, t('respRate')],
  ];

  return (
    <Card style={{ marginBottom: 14 }}>
      <span className="pulse-header">{t('recovery')}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1, color: status.color }}>
            {hrv}
            <span className="stat-label" style={{ fontSize: '0.7rem' }}>
              {' '}
              ms
            </span>
          </div>
          <div className="stat-label" style={{ marginTop: 2 }}>
            {t('hrvL')}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: status.color }}>
            {t(`rec${status.band}`)}
          </div>
          <div className="state__msg" style={{ textAlign: 'left', margin: '3px 0 8px' }}>
            {devText}
          </div>
          <Sparkline values={trend.map((p) => p.hrv)} color={status.color} />
        </div>
      </div>
      <div className="state__msg" style={{ textAlign: 'left', margin: '12px 0 14px' }}>
        {status.message}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {tiles.map(([v, l]) => (
          <div key={l} className="sleep-readiness-tile">
            <div className="sleep-readiness-tile__v">{v}</div>
            <div className="sleep-readiness-tile__l">{l}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
