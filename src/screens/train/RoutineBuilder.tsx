import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { ExercisePicker } from '../progress/ExercisePicker';
import { getExercise } from '@/features/workouts/exercises';
import { newCustomPlanId } from '@/features/workouts/plans';
import { translator } from '@/lib/i18n';
import type { CustomPlan } from '@/types/schemas';

interface BuilderItem {
  name: string;
  sr: string;
}
interface BuilderDay {
  name: string;
  /** Preserved across edits even though there's no input for it yet. */
  focus: string | undefined;
  items: BuilderItem[];
}

const DEFAULT_SR = '3 × 8–12';
const srOf = (name: string): string => getExercise(name)?.sr ?? DEFAULT_SR;

function fromCustom(c: CustomPlan): BuilderDay[] {
  return c.days.map((d) => ({
    name: d.name,
    focus: d.focus,
    items: d.ex.map((n) => ({ name: n, sr: c.sr?.[n] ?? srOf(n) })),
  }));
}

interface RoutineBuilderProps {
  lang: string;
  initial: CustomPlan | null;
  onSave: (plan: CustomPlan) => void;
  onClose: () => void;
}

/** Build or edit a custom split: name it, add days + exercises, set sets/reps. */
export function RoutineBuilder({
  lang,
  initial,
  onSave,
  onClose,
}: RoutineBuilderProps): JSX.Element {
  const t = translator(lang);
  const [name, setName] = useState(initial?.name ?? '');
  const [days, setDays] = useState<BuilderDay[]>(
    initial ? fromCustom(initial) : [{ name: 'Day 1', focus: undefined, items: [] }],
  );
  const [pickerDay, setPickerDay] = useState<number | null>(null);

  const valid = name.trim().length > 0 && days.some((d) => d.items.length > 0);

  const patchDay = (i: number, patch: Partial<BuilderDay>): void =>
    setDays((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const addDay = (): void =>
    setDays((ds) => [...ds, { name: `Day ${ds.length + 1}`, focus: undefined, items: [] }]);
  const removeDay = (i: number): void => setDays((ds) => ds.filter((_, j) => j !== i));
  const addItem = (dayIdx: number, exName: string): void => {
    setDays((ds) =>
      ds.map((d, j) =>
        j === dayIdx ? { ...d, items: [...d.items, { name: exName, sr: srOf(exName) }] } : d,
      ),
    );
    setPickerDay(null);
  };
  const patchItem = (dayIdx: number, itemIdx: number, sr: string): void =>
    setDays((ds) =>
      ds.map((d, j) =>
        j === dayIdx
          ? { ...d, items: d.items.map((it, k) => (k === itemIdx ? { ...it, sr } : it)) }
          : d,
      ),
    );
  const removeItem = (dayIdx: number, itemIdx: number): void =>
    setDays((ds) =>
      ds.map((d, j) =>
        j === dayIdx ? { ...d, items: d.items.filter((_, k) => k !== itemIdx) } : d,
      ),
    );

  const save = (): void => {
    const sr: Record<string, string> = {};
    const cleanDays = days
      .filter((d) => d.items.length > 0)
      .map((d) => {
        d.items.forEach((it) => {
          if (it.sr.trim()) sr[it.name] = it.sr.trim();
        });
        return {
          name: d.name.trim() || 'Day',
          ex: d.items.map((it) => it.name),
          // Preserve any existing focus rather than silently dropping it.
          ...(d.focus && d.focus.trim() ? { focus: d.focus } : {}),
        };
      });
    onSave({ id: initial?.id ?? newCustomPlanId(), name: name.trim(), days: cleanDays, sr });
  };

  return (
    <Modal onClose={onClose} label={initial ? t('editRoutine') : t('createRoutine')}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
          {initial ? t('editRoutine') : t('createRoutine')}
        </div>
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>

      <label className="ob-label" htmlFor="routine-name">
        {t('routineName')}
      </label>
      <input
        id="routine-name"
        className="input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. My Upper/Lower"
      />
      <p className="state__msg" style={{ textAlign: 'left', margin: '8px 0 16px' }}>
        {t('routineHint')}
      </p>

      {days.map((day, di) => (
        <div
          key={di}
          style={{
            border: '1px solid var(--glass-border)',
            borderRadius: 14,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <input
              className="input"
              aria-label={`${t('dayName')} ${di + 1}`}
              value={day.name}
              onChange={(e) => patchDay(di, { name: e.target.value })}
            />
            {days.length > 1 ? (
              <button
                type="button"
                className="modal-close"
                aria-label={`Remove ${day.name}`}
                onClick={() => removeDay(di)}
              >
                ✕
              </button>
            ) : null}
          </div>

          {day.items.map((it, ii) => (
            <div
              key={ii}
              style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontWeight: 700,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {it.name}
              </div>
              <input
                className="input"
                style={{ width: 96, padding: '8px 10px' }}
                aria-label={`${it.name} sets and reps`}
                value={it.sr}
                onChange={(e) => patchItem(di, ii, e.target.value)}
              />
              <button
                type="button"
                className="modal-close"
                style={{ width: 32, height: 32 }}
                aria-label={`Remove ${it.name}`}
                onClick={() => removeItem(di, ii)}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            className="add-set"
            style={{ marginTop: 4 }}
            onClick={() => setPickerDay(di)}
          >
            {t('addExercise')}
          </button>
        </div>
      ))}

      <Button variant="ghost" onClick={addDay} style={{ width: '100%', marginBottom: 12 }}>
        {t('addDay')}
      </Button>

      <Button onClick={save} disabled={!valid} style={{ width: '100%' }}>
        {t('saveRoutine')}
      </Button>
      {!valid ? (
        <div className="state__msg" style={{ marginTop: 8 }}>
          {t('emptyRoutine')}
        </div>
      ) : null}

      {pickerDay !== null ? (
        <ExercisePicker
          lang={lang}
          tracked={days[pickerDay]?.items.map((i) => i.name) ?? []}
          onClose={() => setPickerDay(null)}
          onPick={(n) => addItem(pickerDay, n)}
        />
      ) : null}
    </Modal>
  );
}
