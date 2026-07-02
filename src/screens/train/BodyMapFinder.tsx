import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { BodyMap } from './BodyMap';
import { ExerciseModal } from './ExerciseModal';
import {
  MUSCLE_GROUPS,
  exercisesForMuscle,
  muscleCounts,
  type MuscleGroup,
} from '@/features/workouts/muscles';
import { getExercise } from '@/features/workouts/exercises';
import { translator } from '@/lib/i18n';

interface BodyMapFinderProps {
  lang: string;
  onClose: () => void;
}

/** Find exercises by tapping a muscle group on a body map. */
export function BodyMapFinder({ lang, onClose }: BodyMapFinderProps): JSX.Element {
  const t = translator(lang);
  const [selected, setSelected] = useState<MuscleGroup | null>(null);
  const [exercise, setExercise] = useState<string | null>(null);
  const counts = muscleCounts();
  const results = selected ? exercisesForMuscle(selected) : [];
  const selectedLabel = MUSCLE_GROUPS.find((g) => g.id === selected)?.label ?? '';

  return (
    <Modal onClose={onClose} label={t('findByMuscle')}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t('findByMuscle')}</div>
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>

      <p className="state__msg" style={{ textAlign: 'left', margin: '0 0 12px' }}>
        {t('muscleHint')}
      </p>

      <BodyMap selected={selected} counts={counts} onSelect={setSelected} />

      {/* Accessible muscle picker, mirrors the map regions. */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', margin: '14px 0 6px' }}>
        {MUSCLE_GROUPS.map((g) => (
          <Chip
            key={g.id}
            label={g.label}
            active={selected === g.id}
            onClick={() => setSelected(g.id)}
          />
        ))}
      </div>

      {selected ? (
        <div style={{ marginTop: 12 }}>
          <div className="ex-modal__label">
            {results.length} {selectedLabel} {t('exercisesL')}
          </div>
          <div className="stack">
            {results.map((n) => {
              const ex = getExercise(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setExercise(n)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 12,
                    padding: '11px 14px',
                    cursor: 'pointer',
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{n}</div>
                    <div className="state__msg" style={{ textAlign: 'left', margin: '2px 0 0' }}>
                      {ex?.m} · {ex?.sr}
                    </div>
                  </div>
                  <Icon name="plan" size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {exercise ? (
        <ExerciseModal
          key={exercise}
          name={exercise}
          onClose={() => setExercise(null)}
          onOpen={setExercise}
        />
      ) : null}
    </Modal>
  );
}
