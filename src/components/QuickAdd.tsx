import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import { Button } from './Button';
import { useData, useUpdate } from '@/features/store';
import { lb2kg, todayKey } from '@/lib/calc';
import './quickadd.css';

/**
 * A floating "+" quick-add menu (like the macro trackers' add sheet): jump
 * straight to logging food / a workout, add a glass of water or log today's
 * weight, or hop to recipes / sleep / progress — all wired to FORGE's real data.
 */
export function QuickAdd(): JSX.Element {
  const data = useData();
  const update = useUpdate();
  const navigate = useNavigate();
  const p = data.profile;

  const [open, setOpen] = useState(false);
  const [weighing, setWeighing] = useState(false);
  const [wVal, setWVal] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const close = (): void => {
    setOpen(false);
    setWeighing(false);
    setWVal('');
  };

  const go = (path: string): void => {
    close();
    navigate(path);
  };

  const tk = todayKey();
  const addWater = (): void => {
    update({ water: { ...data.water, [tk]: (data.water[tk] ?? 0) + 1 } });
    close();
  };

  const wu = p?.weightUnit ?? 'kg';
  const saveWeight = (): void => {
    const v = parseFloat(wVal);
    if (!Number.isFinite(v) || v <= 0) return;
    const kg = wu === 'lb' ? lb2kg(v) : v;
    update({
      weights: [...data.weights.filter((x) => x.d !== tk), { d: tk, w: Math.round(kg * 10) / 10 }],
    });
    close();
  };

  const card = (label: string, icon: IconName, color: string, onClick: () => void): JSX.Element => (
    <button type="button" className="qa-card" onClick={onClick}>
      <span className="qa-ic" style={{ background: color }}>
        <Icon name={icon} size={26} />
      </span>
      {label}
    </button>
  );

  const row = (
    label: string,
    icon: IconName,
    color: string,
    onClick: () => void,
    hint?: string,
  ): JSX.Element => (
    <button type="button" className="qa-row" onClick={onClick}>
      <span className="qa-ic--sm" style={{ background: color }}>
        <Icon name={icon} size={17} />
      </span>
      {label}
      {hint ? <span className="qa-row__hint">{hint}</span> : null}
    </button>
  );

  return (
    <>
      <button
        type="button"
        className="qa-fab"
        aria-label="Quick add"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Icon name="plus" size={28} />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="qa-backdrop"
            aria-label="Close quick add"
            onClick={close}
          />
          <div className="qa-sheet" role="dialog" aria-modal="true" aria-label="Quick add">
            <div className="qa-grip" aria-hidden="true" />
            <h2 className="qa-title">Quick add</h2>

            {weighing ? (
              <div className="qa-weigh">
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  autoFocus
                  aria-label={`Today's weight in ${wu}`}
                  placeholder={`Today's weight (${wu})`}
                  value={wVal}
                  onChange={(e) => setWVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveWeight()}
                />
                <Button onClick={saveWeight}>Save</Button>
              </div>
            ) : null}

            <div className="qa-grid">
              {card('Log Food', 'eat', '#3d8bff', () => go('/eat'))}
              {card('Log Workout', 'dumbbell', '#ff5e8a', () => go('/train'))}
              {card('Add Water', 'water', '#22b8cf', addWater)}
              {card('Log Weight', 'stats', '#3ddc84', () => setWeighing((v) => !v))}
            </div>

            <div className="qa-rows">
              {row('Browse Recipes', 'recipes', '#9775fa', () => go('/recipes'))}
              {row('Log Sleep', 'moon', '#5c7cfa', () => go('/sleep'))}
              {row('View Progress', 'chart', '#ff922b', () => go('/stats'))}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
