import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { MICROS, microStatus, type MicroTotals } from '@/features/nutrition/micros';
import { translator } from '@/lib/i18n';

interface MicronutrientsProps {
  lang: string;
  totals: MicroTotals;
}

/** Daily micronutrient breakdown: goals to hit and limits to stay under. */
export function Micronutrients({ lang, totals }: MicronutrientsProps): JSX.Element {
  const t = translator(lang);

  return (
    <Card style={{ marginBottom: 14 }}>
      <span className="pulse-header">{t('micros')}</span>
      <div className="state__msg" style={{ textAlign: 'left', margin: '4px 0 12px' }}>
        {t('microsSub')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {MICROS.map((m) => {
          const value = totals[m.key];
          const s = microStatus(m, value);
          const barColor = s.over ? '#F0479C' : m.color;
          return (
            <div key={m.key}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 5,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{m.label}</span>
                  {s.met ? <Icon name="check" size={13} style={{ color: '#10B981' }} /> : null}
                  {s.over ? (
                    <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#F0479C' }}>
                      {t('overLimit')}
                    </span>
                  ) : null}
                </div>
                <div className="state__msg" style={{ margin: 0 }}>
                  <b style={{ color: 'var(--text)' }}>{Math.round(value)}</b>
                  <span style={{ color: 'var(--muted)' }}>
                    {' '}
                    / {m.target} {m.unit}
                  </span>
                </div>
              </div>
              <div
                style={{
                  height: 7,
                  background: 'var(--panel-2)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${s.pct * 100}%`,
                    height: '100%',
                    background: barColor,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div
        className="state__msg"
        style={{ textAlign: 'left', fontSize: '0.72rem', margin: '12px 0 0' }}
      >
        {t('microsNote')}
      </div>
    </Card>
  );
}
