import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { ProModal } from '@/components/ProModal';
import { useData, useUpdate } from '@/features/store';
import { SMART_DEVICES } from '@/features/devices';
import { platform } from '@/features/platform';
import { translator } from '@/lib/i18n';

const ROWS: ReadonlyArray<[string, IconName, string, string]> = [
  ['/sleep', 'moon', 'Sleep', 'Recovery score, sleep stages and trends'],
  ['/settings', 'settings', 'Settings', 'Profile, units, appearance, language, backup'],
];

export function More(): JSX.Element {
  const data = useData();
  const update = useUpdate();
  const navigate = useNavigate();
  const t = translator(data.settings.lang);
  const [showPro, setShowPro] = useState(false);

  const toggleDevice = (name: string): void => {
    const has = data.devices.includes(name);
    update({ devices: has ? data.devices.filter((d) => d !== name) : [...data.devices, name] });
  };

  return (
    <div className="screen">
      <h1 className="screen__title">{t('more')}</h1>

      <div className="stack">
        {ROWS.map(([to, icon, label, desc]) => (
          <Card
            key={to}
            onClick={() => navigate(to)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name={icon} size={21} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{label}</div>
              <div className="state__msg" style={{ textAlign: 'left', margin: 0 }}>
                {desc}
              </div>
            </div>
            <Icon name="plan" size={16} style={{ color: 'var(--muted)' }} />
          </Card>
        ))}
      </div>

      {/* Account & sync (platform layer — local stub today) */}
      <span className="pulse-header" style={{ display: 'block', marginTop: 22 }}>
        {t('accountSync')}
      </span>
      <Card style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'var(--accent-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="refresh" size={21} style={{ color: 'var(--accent)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{t('localAccount')}</div>
          <div className="state__msg" style={{ textAlign: 'left', margin: 0 }}>
            {platform.sync.status().detail}
          </div>
        </div>
      </Card>

      {/* Membership */}
      <span className="pulse-header" style={{ display: 'block', marginTop: 22 }}>
        {t('membership')}
      </span>
      {data.pro ? (
        <>
          <Card
            style={{
              marginTop: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>FORGE PRO</div>
              <div className="state__msg" style={{ textAlign: 'left', margin: 0 }}>
                Active
              </div>
            </div>
            <Button variant="ghost" onClick={() => update({ pro: false })}>
              {t('manage')}
            </Button>
          </Card>

          <span className="pulse-header" style={{ display: 'block', marginTop: 22 }}>
            {t('devices')}
          </span>
          <div className="stack" style={{ marginTop: 12 }}>
            {SMART_DEVICES.map((name) => {
              const on = data.devices.includes(name);
              return (
                <Card
                  key={name}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontWeight: 700 }}>{name}</span>
                  {on ? (
                    <button
                      type="button"
                      onClick={() => toggleDevice(name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {t('connected')}
                    </button>
                  ) : (
                    <Button variant="ghost" onClick={() => toggleDevice(name)}>
                      {t('connect')}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
          <div className="state__msg" style={{ textAlign: 'left', marginTop: 8 }}>
            {t('devNote')}
          </div>
        </>
      ) : (
        <Card
          style={{
            marginTop: 12,
            textAlign: 'center',
            borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)',
            background: 'linear-gradient(135deg, var(--glass), var(--accent-soft))',
          }}
        >
          <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            FORGE PRO
          </div>
          <div className="state__msg" style={{ margin: '6px 0 12px' }}>
            {t('proPitch')}
          </div>
          <Button onClick={() => setShowPro(true)}>{t('upgrade')}</Button>
        </Card>
      )}

      {showPro ? (
        <ProModal
          lang={data.settings.lang}
          onClose={() => setShowPro(false)}
          onActivate={() => {
            update({ pro: true });
            setShowPro(false);
          }}
        />
      ) : null}
    </div>
  );
}
