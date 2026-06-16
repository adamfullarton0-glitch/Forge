import { useState } from 'react';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ftin2cm, lb2kg } from '@/lib/calc';
import { ALLERGENS, DISLIKE_CHIPS } from '@/features/nutrition/constants';
import { EQUIPMENT, DEFAULT_GEAR } from '@/features/workouts/plans';
import { useData, useUpdate } from '@/features/store';
import { LANGS } from '@/lib/i18n';
import type { Profile, Settings } from '@/types/schemas';
import './onboarding.css';

const TOTAL_STEPS = 6;

type Goal = Profile['goal'];
type Activity = Profile['activity'];
type Experience = Profile['experience'];

interface FormState {
  name: string;
  sex: Profile['sex'];
  age: string;
  heightCm: string;
  heightFt: string;
  heightIn: string;
  weight: string;
  targetWeight: string;
  weightUnit: Profile['weightUnit'];
  heightUnit: Profile['heightUnit'];
  goal: Goal;
  activity: Activity;
  experience: Experience;
  allergies: string[];
  dislikes: string[];
  dislikeText: string;
  gear: string[];
}

const initialForm: FormState = {
  name: '',
  sex: 'm',
  age: '',
  heightCm: '',
  heightFt: '',
  heightIn: '',
  weight: '',
  targetWeight: '',
  weightUnit: 'kg',
  heightUnit: 'cm',
  goal: 'lose',
  activity: 'moderate',
  experience: 'beginner',
  allergies: [],
  dislikes: [],
  dislikeText: '',
  gear: [...DEFAULT_GEAR],
};

const num = (v: string, fallback = 0): number => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

export function Onboarding(): JSX.Element {
  const data = useData();
  const update = useUpdate();
  const lang = data.settings.lang;

  const [step, setStep] = useState(0);
  const [f, setF] = useState<FormState>(initialForm);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]): void =>
    setF((prev) => ({ ...prev, [k]: v }));
  const toggle = (k: 'allergies' | 'dislikes' | 'gear', v: string): void =>
    setF((prev) => ({
      ...prev,
      [k]: prev[k].includes(v) ? prev[k].filter((x) => x !== v) : [...prev[k], v],
    }));

  const heightOk = f.heightUnit === 'cm' ? f.heightCm !== '' : f.heightFt !== '';
  const canContinue =
    step !== 1 ||
    (f.name.trim() !== '' && f.age !== '' && heightOk && f.weight !== '' && f.targetWeight !== '');

  const finish = (): void => {
    const heightCm =
      f.heightUnit === 'cm' ? num(f.heightCm, 175) : ftin2cm(num(f.heightFt), num(f.heightIn));
    const weightKg = f.weightUnit === 'kg' ? num(f.weight, 75) : lb2kg(num(f.weight, 165));
    const targetKg =
      f.weightUnit === 'kg' ? num(f.targetWeight, weightKg) : lb2kg(num(f.targetWeight, 165));
    const dislikes = [
      ...f.dislikes,
      ...f.dislikeText
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ];
    const profile: Profile = {
      name: f.name.trim(),
      sex: f.sex,
      age: Math.max(0, Math.round(num(f.age, 25))),
      height: Math.round(heightCm),
      weight: Math.round(weightKg * 10) / 10,
      targetWeight: Math.round(targetKg * 10) / 10,
      weightUnit: f.weightUnit,
      heightUnit: f.heightUnit,
      goal: f.goal,
      activity: f.activity,
      experience: f.experience,
      allergies: f.allergies,
      dislikes,
    };
    update({ profile, gear: f.gear });
  };

  return (
    <div className="onboarding">
      <div className="ob-progress">
        <div
          className="ob-progress__fill"
          style={{ width: `${(step / (TOTAL_STEPS - 1)) * 100}%` }}
        />
      </div>

      {step === 0 && (
        <section>
          <div className="ob-eyebrow">WELCOME TO</div>
          <h1 className="ob-title" style={{ fontSize: '3rem' }}>
            FORGE
          </h1>
          <p className="ob-lede">
            Your training, nutrition and recovery — built around your body, your goal, your kitchen
            and your gym.
          </p>
          <label className="ob-label" htmlFor="ob-lang">
            Language
          </label>
          <select
            id="ob-lang"
            className="select"
            value={lang}
            onChange={(e) =>
              update({ settings: { ...data.settings, lang: e.target.value as Settings['lang'] } })
            }
          >
            {Object.entries(LANGS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <p className="ob-lede" style={{ fontSize: '0.8rem' }}>
            Menus &amp; buttons are translated. Exercise steps and recipes stay in English in this
            build.
          </p>
          <div className="ob-next">
            <Button onClick={() => setStep(1)}>Let&apos;s go →</Button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section>
          <h1 className="ob-title">About you</h1>
          <p className="ob-lede">
            This builds your calorie &amp; macro targets. Pick whichever units you think in — mix
            them if you like.
          </p>

          <label className="ob-label" htmlFor="ob-name">
            Name
          </label>
          <input
            id="ob-name"
            className="input"
            value={f.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="What should we call you?"
          />

          <span className="ob-label">Sex (for the calorie maths)</span>
          <div className="ob-row">
            <button
              type="button"
              className="ob-opt"
              style={{ textAlign: 'center' }}
              aria-pressed={f.sex === 'm'}
              onClick={() => set('sex', 'm')}
            >
              Male
            </button>
            <button
              type="button"
              className="ob-opt"
              style={{ textAlign: 'center' }}
              aria-pressed={f.sex === 'f'}
              onClick={() => set('sex', 'f')}
            >
              Female
            </button>
          </div>

          <label className="ob-label" htmlFor="ob-age">
            Age
          </label>
          <input
            id="ob-age"
            className="input"
            type="number"
            inputMode="numeric"
            value={f.age}
            onChange={(e) => set('age', e.target.value)}
            placeholder="e.g. 24"
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="ob-label">Height</span>
            <div className="ob-chips" style={{ marginTop: 16 }}>
              <Chip
                label="cm"
                active={f.heightUnit === 'cm'}
                onClick={() => set('heightUnit', 'cm')}
              />
              <Chip
                label="ft + in"
                active={f.heightUnit === 'ftin'}
                onClick={() => set('heightUnit', 'ftin')}
              />
            </div>
          </div>
          {f.heightUnit === 'cm' ? (
            <input
              className="input"
              type="number"
              inputMode="numeric"
              aria-label="Height in centimetres"
              value={f.heightCm}
              onChange={(e) => set('heightCm', e.target.value)}
              placeholder="e.g. 178"
            />
          ) : (
            <div className="ob-row">
              <input
                className="input"
                type="number"
                aria-label="Height feet"
                value={f.heightFt}
                onChange={(e) => set('heightFt', e.target.value)}
                placeholder="ft"
              />
              <input
                className="input"
                type="number"
                aria-label="Height inches"
                value={f.heightIn}
                onChange={(e) => set('heightIn', e.target.value)}
                placeholder="in"
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="ob-label">Weight</span>
            <div className="ob-chips" style={{ marginTop: 16 }}>
              <Chip
                label="kg"
                active={f.weightUnit === 'kg'}
                onClick={() => set('weightUnit', 'kg')}
              />
              <Chip
                label="lbs"
                active={f.weightUnit === 'lb'}
                onClick={() => set('weightUnit', 'lb')}
              />
            </div>
          </div>
          <div className="ob-row">
            <input
              className="input"
              type="number"
              aria-label={`Current weight in ${f.weightUnit}`}
              value={f.weight}
              onChange={(e) => set('weight', e.target.value)}
              placeholder={`Now (${f.weightUnit})`}
            />
            <input
              className="input"
              type="number"
              aria-label={`Goal weight in ${f.weightUnit}`}
              value={f.targetWeight}
              onChange={(e) => set('targetWeight', e.target.value)}
              placeholder={`Goal (${f.weightUnit})`}
            />
          </div>

          <div className="ob-next">
            <Button onClick={() => setStep(2)} disabled={!canContinue}>
              Next →
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h1 className="ob-title">Your goal</h1>
          <p className="ob-lede">
            This sets your calories, protein target and which recipes get pushed to you.
          </p>
          <span className="ob-label">Main goal</span>
          <div className="ob-grid">
            {(
              [
                ['lose', 'Lose fat', 'Calorie deficit, high protein to keep muscle'],
                ['maintain', 'Maintain & recomp', 'Eat at maintenance, train hard'],
                ['gain', 'Build muscle', 'Small surplus to fuel growth'],
              ] as const
            ).map(([k, title, desc]) => (
              <button
                key={k}
                type="button"
                className="ob-opt"
                aria-pressed={f.goal === k}
                onClick={() => set('goal', k)}
              >
                <div className="ob-opt__title">{title}</div>
                <div className="ob-opt__desc">{desc}</div>
              </button>
            ))}
          </div>

          <span className="ob-label">Activity outside the gym</span>
          <div className="ob-chips">
            {(
              [
                ['sedentary', 'Desk job'],
                ['light', 'On my feet a bit'],
                ['moderate', 'Fairly active'],
                ['high', 'Very active'],
              ] as const
            ).map(([k, l]) => (
              <Chip
                key={k}
                label={l}
                active={f.activity === k}
                onClick={() => set('activity', k)}
              />
            ))}
          </div>

          <span className="ob-label">Training experience</span>
          <div className="ob-chips">
            {(
              [
                ['beginner', 'New (< 1 yr)'],
                ['intermediate', '1–3 years'],
                ['advanced', '3+ years'],
              ] as const
            ).map(([k, l]) => (
              <Chip
                key={k}
                label={l}
                active={f.experience === k}
                onClick={() => set('experience', k)}
              />
            ))}
          </div>

          <div className="ob-next">
            <Button onClick={() => setStep(3)}>Next →</Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h1 className="ob-title">Your equipment</h1>
          <p className="ob-lede">
            Tick what your gym (or home setup) has. FORGE flags exercises you can&apos;t do and
            suggests a swap that fits your gear.
          </p>
          <div className="ob-grid" style={{ marginTop: 22 }}>
            {EQUIPMENT.map(([id, label]) => {
              const on = f.gear.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  className="ob-opt"
                  aria-pressed={on}
                  onClick={() => toggle('gear', id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <span className="ob-opt__title" style={{ flex: 1 }}>
                    {label}
                  </span>
                  <span style={{ color: on ? 'var(--accent)' : 'var(--muted)', fontWeight: 900 }}>
                    {on ? '✓' : '○'}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="ob-lede" style={{ fontSize: '0.8rem' }}>
            Bodyweight moves are always available. Change this anytime in Settings.
          </p>
          <div className="ob-next">
            <Button onClick={() => setStep(4)}>Next →</Button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section>
          <h1 className="ob-title">Allergies</h1>
          <p className="ob-lede">Recipes containing these will never be recommended to you.</p>
          <div className="ob-chips" style={{ marginTop: 22 }}>
            {ALLERGENS.map((a) => (
              <Chip
                key={a}
                label={a}
                active={f.allergies.includes(a)}
                onClick={() => toggle('allergies', a)}
              />
            ))}
          </div>
          <p className="ob-lede" style={{ fontSize: '0.8rem' }}>
            None apply? Just hit next.
          </p>
          <div className="ob-next">
            <Button onClick={() => setStep(5)}>Next →</Button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section>
          <h1 className="ob-title">Foods you hate</h1>
          <p className="ob-lede">
            Life&apos;s too short to eat things you don&apos;t like. We&apos;ll filter these out
            too.
          </p>
          <div className="ob-chips" style={{ margin: '22px 0 14px' }}>
            {DISLIKE_CHIPS.map((d) => {
              const key = d.toLowerCase();
              return (
                <Chip
                  key={d}
                  label={d}
                  active={f.dislikes.includes(key)}
                  onClick={() => toggle('dislikes', key)}
                />
              );
            })}
          </div>
          <label className="ob-label" htmlFor="ob-dislikes">
            Anything else? (comma separated)
          </label>
          <input
            id="ob-dislikes"
            className="input"
            value={f.dislikeText}
            onChange={(e) => set('dislikeText', e.target.value)}
            placeholder="e.g. olives, blue cheese"
          />
          <div className="ob-next">
            <Button onClick={finish}>Build my plan</Button>
          </div>
        </section>
      )}
    </div>
  );
}
