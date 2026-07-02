import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { EXERCISE_NAMES, getExercise } from '@/features/workouts/exercises';
import { translator } from '@/lib/i18n';

interface ExercisePickerProps {
  lang: string;
  tracked: string[];
  onPick: (name: string) => void;
  onClose: () => void;
}

/** A searchable exercise list for starting to track a lift. */
export function ExercisePicker({
  lang,
  tracked,
  onPick,
  onClose,
}: ExercisePickerProps): JSX.Element {
  const t = translator(lang);
  const [q, setQ] = useState('');
  const names = EXERCISE_NAMES.filter((n) => n.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Modal onClose={onClose} label={t('pickEx')}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('pickEx')}</div>
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>
      <input
        className="input"
        style={{ marginBottom: 12 }}
        aria-label={t('searchEx')}
        placeholder={t('searchEx')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {names.map((n) => {
        const ex = getExercise(n);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onPick(n)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: tracked.includes(n) ? 'var(--accent-soft)' : 'transparent',
              border: '1px solid var(--glass-border)',
              borderRadius: 12,
              padding: '11px 14px',
              marginBottom: 8,
              cursor: 'pointer',
              color: 'var(--text)',
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {n}
              {tracked.includes(n) ? (
                <span style={{ color: 'var(--accent)', fontSize: '0.7rem', marginLeft: 6 }}>
                  tracking
                </span>
              ) : null}
            </div>
            <div className="state__msg" style={{ textAlign: 'left', margin: '2px 0 0' }}>
              {ex?.m} · {ex?.sr}
            </div>
          </button>
        );
      })}
    </Modal>
  );
}
