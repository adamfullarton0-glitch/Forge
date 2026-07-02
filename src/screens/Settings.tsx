import { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { useData, useUpdate, useReset, usePhotos, useSetPhotos } from '@/features/store';
import { accents } from '@/theme/pulse';
import { EQUIPMENT } from '@/features/workouts/plans';
import { ALLERGENS, DISLIKE_CHIPS } from '@/features/nutrition/constants';
import { exportBackup, importBackup } from '@/lib/storage';
import { getUnits, kg2lb, cm2ftin } from '@/lib/calc';
import { translator, LANGS } from '@/lib/i18n';
import type { Profile, Settings as SettingsT } from '@/types/schemas';

export function Settings(): JSX.Element | null {
  const data = useData();
  const update = useUpdate();
  const reset = useReset();
  const photos = usePhotos();
  const setPhotos = useSetPhotos();
  const t = translator(data.settings.lang);
  const [msg, setMsg] = useState('');

  const p = data.profile;
  if (!p) return null;

  const { wu, hu } = getUnits(p);
  const upP = (patch: Partial<Profile>): void => update({ profile: { ...p, ...patch } });
  const setSetting = (patch: Partial<SettingsT>): void =>
    update({ settings: { ...data.settings, ...patch } });
  const gear = data.gear.length ? data.gear : EQUIPMENT.map((e) => e[0]);

  const hVal =
    hu === 'cm'
      ? `${p.height} cm`
      : (() => {
          const { ft, inch } = cm2ftin(p.height);
          return `${ft}'${inch}"`;
        })();
  const wShow = (kg: number): string => (wu === 'lb' ? `${kg2lb(kg)} lb` : `${kg} kg`);

  const doExport = (): void => {
    try {
      const blob = new Blob([exportBackup(data, photos)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forge-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch {
      setMsg('Export failed.');
    }
  };

  const doImport = (file: File | undefined): void => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const result = importBackup(text);
      if (result.ok) {
        update(result.state);
        if (result.photos.length > 0) setPhotos(result.photos);
        setMsg(t('imported'));
      } else {
        setMsg(t('badNote'));
      }
    };
    reader.onerror = () => setMsg(t('badNote'));
    reader.readAsText(file);
  };

  return (
    <div className="screen">
      <h1 className="screen__title">{t('settings')}</h1>

      {/* Language */}
      <span className="pulse-header">{t('language')}</span>
      <div className="ob-chips" style={{ margin: '12px 0 8px' }}>
        {Object.entries(LANGS).map(([k, v]) => (
          <Chip
            key={k}
            label={v}
            active={data.settings.lang === k}
            onClick={() => setSetting({ lang: k as SettingsT['lang'] })}
          />
        ))}
      </div>
      <div className="state__msg" style={{ textAlign: 'left' }}>
        {t('langNote')}
      </div>

      {/* Appearance */}
      <span className="pulse-header" style={{ display: 'block', marginTop: 22 }}>
        {t('appearance')}
      </span>
      <div className="ob-chips" style={{ marginTop: 12 }}>
        <Chip
          label={t('dark')}
          active={data.settings.dark}
          onClick={() => setSetting({ dark: true })}
        />
        <Chip
          label={t('light')}
          active={!data.settings.dark}
          onClick={() => setSetting({ dark: false })}
        />
      </div>
      <div className="stat-label" style={{ margin: '14px 0 8px' }}>
        {t('accentC')}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {Object.entries(accents).map(([k, a]) => (
          <button
            key={k}
            type="button"
            aria-label={a.name}
            aria-pressed={data.settings.accent === k}
            onClick={() => setSetting({ accent: k as SettingsT['accent'] })}
            style={{
              width: 34,
              height: 34,
              borderRadius: 99,
              background: a.c,
              border:
                data.settings.accent === k ? '3px solid var(--text)' : '3px solid transparent',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* Equipment */}
      <span className="pulse-header" style={{ display: 'block', marginTop: 22 }}>
        {t('equipment')}
      </span>
      <div className="ob-chips" style={{ marginTop: 12 }}>
        {EQUIPMENT.map(([id, label]) => (
          <Chip
            key={id}
            label={label}
            active={gear.includes(id)}
            onClick={() =>
              update({ gear: gear.includes(id) ? gear.filter((x) => x !== id) : [...gear, id] })
            }
          />
        ))}
      </div>

      {/* Profile */}
      <span className="pulse-header" style={{ display: 'block', marginTop: 22 }}>
        {t('profile')}
      </span>
      <Card style={{ marginTop: 12 }}>
        <div className="stat-label">
          {t('wUnit')} / {t('hUnit')}
        </div>
        <div className="ob-chips" style={{ margin: '8px 0 12px' }}>
          <Chip label="kg" active={wu === 'kg'} onClick={() => upP({ weightUnit: 'kg' })} />
          <Chip label="lbs" active={wu === 'lb'} onClick={() => upP({ weightUnit: 'lb' })} />
          <span style={{ width: 10 }} />
          <Chip label="cm" active={hu === 'cm'} onClick={() => upP({ heightUnit: 'cm' })} />
          <Chip
            label="ft + in"
            active={hu === 'ftin'}
            onClick={() => upP({ heightUnit: 'ftin' })}
          />
        </div>
        <div className="state__msg" style={{ textAlign: 'left', marginBottom: 12 }}>
          {t('mix')}
        </div>
        {(
          [
            [t('age'), String(p.age)],
            [t('heightL'), hVal],
            [t('weightL'), wShow(p.weight)],
            [t('targetL'), wShow(p.targetWeight)],
          ] as const
        ).map(([l, v]) => (
          <div
            key={l}
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}
          >
            <span style={{ color: 'var(--muted)', fontWeight: 700 }}>{l}</span>
            <span style={{ fontWeight: 700 }}>{v}</span>
          </div>
        ))}
        <div className="stat-label" style={{ margin: '12px 0 8px' }}>
          {t('goal')}
        </div>
        <div className="ob-chips">
          {(
            [
              ['lose', t('lose')],
              ['maintain', t('maintain')],
              ['gain', t('gain')],
            ] as const
          ).map(([k, l]) => (
            <Chip key={k} label={l} active={p.goal === k} onClick={() => upP({ goal: k })} />
          ))}
        </div>
      </Card>

      {/* Food filters */}
      <span className="pulse-header" style={{ display: 'block', marginTop: 22 }}>
        {t('filters')}
      </span>
      <div className="stat-label" style={{ margin: '12px 0 8px' }}>
        {t('allergies')}
      </div>
      <div className="ob-chips">
        {ALLERGENS.map((a) => (
          <Chip
            key={a}
            label={a}
            active={p.allergies.includes(a)}
            onClick={() =>
              upP({
                allergies: p.allergies.includes(a)
                  ? p.allergies.filter((x) => x !== a)
                  : [...p.allergies, a],
              })
            }
          />
        ))}
      </div>
      <div className="stat-label" style={{ margin: '14px 0 8px' }}>
        {t('dislikes')}
      </div>
      <div className="ob-chips">
        {DISLIKE_CHIPS.map((d) => {
          const dd = d.toLowerCase();
          return (
            <Chip
              key={d}
              label={d}
              active={p.dislikes.includes(dd)}
              onClick={() =>
                upP({
                  dislikes: p.dislikes.includes(dd)
                    ? p.dislikes.filter((x) => x !== dd)
                    : [...p.dislikes, dd],
                })
              }
            />
          );
        })}
      </div>

      {/* Backup */}
      <span className="pulse-header" style={{ display: 'block', marginTop: 22 }}>
        {t('backup')}
      </span>
      <Card style={{ marginTop: 12 }}>
        <div className="state__msg" style={{ textAlign: 'left', marginBottom: 12 }}>
          {t('exportNote')}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button onClick={doExport}>{t('exportD')}</Button>
          <label>
            <span
              style={{
                display: 'inline-block',
                padding: '12px 18px',
                borderRadius: 12,
                border: '1.5px solid var(--glass-border)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {t('importD')}
            </span>
            <input
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              aria-label={t('importD')}
              onChange={(e) => doImport(e.target.files?.[0])}
            />
          </label>
        </div>
        {msg ? (
          <div style={{ color: 'var(--accent)', fontWeight: 700, marginTop: 10 }}>{msg}</div>
        ) : null}
      </Card>

      {/* Help & about */}
      <span className="pulse-header" style={{ display: 'block', marginTop: 22 }}>
        {t('help')}
      </span>
      <Card style={{ marginTop: 12 }}>
        <div className="state__msg" style={{ textAlign: 'left', margin: '0 0 12px' }}>
          FORGE is a private, on-device fitness, nutrition and sleep app. Your data stays in this
          browser — there is no account and nothing is sent to a server.
        </div>
        {[
          {
            q: 'Is my data private?',
            a: "Yes. Everything stays on this device. There's no account and no server — nothing is sent to us. Only food and recipe searches go out, and they send just the term you type.",
          },
          {
            q: 'Does it work offline?',
            a: 'Yes. After your first visit it installs as an app and works with no connection. Only the live food and recipe search needs the internet.',
          },
          {
            q: 'How do reminders and my schedule work?',
            a: 'Set your training days on the Plan tab; the Home screen shows your upcoming sessions. (Phone push notifications arrive with the optional backend.)',
          },
          {
            q: 'How do I move my data to another device?',
            a: 'Use Export above to download a backup file, then Import it on the other device.',
          },
          {
            q: 'Is it free?',
            a: 'Yes. PRO features (sleep tracking, smart devices, extra recipes) are unlocked free in this demo build.',
          },
        ].map(({ q, a }) => (
          <details key={q} className="faq">
            <summary>{q}</summary>
            <div className="state__msg" style={{ textAlign: 'left', margin: '6px 0 0' }}>
              {a}
            </div>
          </details>
        ))}
        <div
          className="state__msg"
          style={{ textAlign: 'left', fontSize: '0.72rem', margin: '12px 0 0' }}
        >
          FORGE · version 0.1.0 · works offline · your data never leaves this device
        </div>
      </Card>

      <div style={{ marginTop: 28 }}>
        <Button variant="ghost" onClick={reset} style={{ width: '100%' }}>
          {t('reset')}
        </Button>
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
}
