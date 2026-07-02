import { useState } from 'react';
import { Chip } from '@/components/Chip';
import { Icon, type IconName } from '@/components/Icon';
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

const GOALS: ReadonlyArray<readonly [Goal, string, string, IconName, string]> = [
  ['lose', 'Lose fat', 'Deficit, high protein', 'flame', '#3ddc84'],
  ['maintain', 'Maintain', 'Eat at maintenance', 'bolt', '#3d8bff'],
  ['gain', 'Build muscle', 'Small surplus to grow', 'dumbbell', '#ff5e8a'],
];

const ACTIVITIES: ReadonlyArray<readonly [Activity, string, string]> = [
  ['sedentary', 'Desk job', 'Mostly sitting'],
  ['light', 'On my feet a bit', 'Light moving'],
  ['moderate', 'Fairly active', 'Recommended'],
  ['high', 'Very active', 'On the go'],
];

const EXPERIENCE: ReadonlyArray<readonly [Experience, string, string]> = [
  ['beginner', 'New to lifting', '< 1 year'],
  ['intermediate', 'Intermediate', '1–3 years'],
  ['advanced', 'Advanced', '3+ years'],
];

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

  // Values must parse to something physically sane — `type="number"` still
  // lets "-70" or "0" through, which would poison every downstream target.
  const inRange = (v: string, lo: number, hi: number): boolean => {
    const n = parseFloat(v);
    return Number.isFinite(n) && n >= lo && n <= hi;
  };
  const heightOk = f.heightUnit === 'cm' ? inRange(f.heightCm, 90, 250) : inRange(f.heightFt, 3, 8);
  const weightOk = (v: string): boolean =>
    f.weightUnit === 'kg' ? inRange(v, 25, 350) : inRange(v, 55, 770);
  const canContinue =
    step !== 1 ||
    (f.name.trim() !== '' &&
      inRange(f.age, 10, 100) &&
      heightOk &&
      weightOk(f.weight) &&
      weightOk(f.targetWeight));

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
      // 2-decimal precision so lb entries round-trip exactly (180 lb → 81.65 kg).
      weight: Math.round(weightKg * 100) / 100,
      targetWeight: Math.round(targetKg * 100) / 100,
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

  const next = (): void => (step >= TOTAL_STEPS - 1 ? finish() : setStep((s) => s + 1));
  const ctaLabel = step === 0 ? "Let's go" : step >= TOTAL_STEPS - 1 ? 'Build my plan' : 'Continue';

  return (
    <div className="onboarding">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        {step > 0 && (
          <button
            type="button"
            aria-label="Back"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ←
          </button>
        )}
        <div className="ob-progress" style={{ flex: 1, margin: 0 }}>
          <div
            className="ob-progress__fill"
            style={{ width: `${(step / (TOTAL_STEPS - 1)) * 100}%` }}
          />
        </div>
      </div>

      {step === 0 && (
        <section>
          <div className="ob-eyebrow">WELCOME TO</div>
          <h1 className="ob-title" style={{ fontSize: '3.2rem', marginTop: 2 }}>
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
        </section>
      )}

      {step === 1 && (
        <section>
          <h1 className="ob-title">About you</h1>
          <p className="ob-lede">This builds your calorie &amp; macro targets.</p>

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

          <span className="ob-label">Sex</span>
          <div className="ob-cardgrid" style={{ marginTop: 0 }}>
            {(
              [
                ['m', 'Male', '♂', '#3d8bff'],
                ['f', 'Female', '♀', '#ff5e8a'],
              ] as const
            ).map(([k, label, glyph, color]) => (
              <button
                key={k}
                type="button"
                className="ob-card"
                aria-pressed={f.sex === k}
                onClick={() => set('sex', k)}
              >
                <span
                  className="ob-card__badge"
                  style={{
                    background: `color-mix(in srgb, ${color} 22%, var(--panel-2))`,
                    color,
                    fontSize: '2.4rem',
                    fontWeight: 700,
                  }}
                >
                  {glyph}
                </span>
                <span className="ob-card__title">{label}</span>
              </button>
            ))}
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <span className="ob-label" style={{ margin: '24px 0 0' }}>
              Height
            </span>
            <div className="ob-seg" style={{ width: 150 }}>
              <button
                type="button"
                className="ob-seg__btn"
                aria-pressed={f.heightUnit === 'cm'}
                onClick={() => set('heightUnit', 'cm')}
              >
                cm
              </button>
              <button
                type="button"
                className="ob-seg__btn"
                aria-pressed={f.heightUnit === 'ftin'}
                onClick={() => set('heightUnit', 'ftin')}
              >
                ft·in
              </button>
            </div>
          </div>
          {f.heightUnit === 'cm' ? (
            <div className="ob-bignum">
              <input
                type="number"
                inputMode="numeric"
                aria-label="Height in centimetres"
                value={f.heightCm}
                onChange={(e) => set('heightCm', e.target.value)}
                placeholder="178"
              />
              <span className="ob-bignum__unit">cm</span>
            </div>
          ) : (
            <div className="ob-row" style={{ marginTop: 18 }}>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <span className="ob-label" style={{ margin: '24px 0 0' }}>
              Weight
            </span>
            <div className="ob-seg" style={{ width: 150 }}>
              <button
                type="button"
                className="ob-seg__btn"
                aria-pressed={f.weightUnit === 'kg'}
                onClick={() => set('weightUnit', 'kg')}
              >
                kg
              </button>
              <button
                type="button"
                className="ob-seg__btn"
                aria-pressed={f.weightUnit === 'lb'}
                onClick={() => set('weightUnit', 'lb')}
              >
                lbs
              </button>
            </div>
          </div>
          <div className="ob-bignum">
            <input
              type="number"
              aria-label={`Current weight in ${f.weightUnit}`}
              value={f.weight}
              onChange={(e) => set('weight', e.target.value)}
              placeholder={f.weightUnit === 'kg' ? '75' : '165'}
            />
            <span className="ob-bignum__unit">{f.weightUnit}</span>
          </div>

          <label className="ob-label" htmlFor="ob-target">
            Goal weight ({f.weightUnit})
          </label>
          <input
            id="ob-target"
            className="input"
            type="number"
            aria-label={`Goal weight in ${f.weightUnit}`}
            value={f.targetWeight}
            onChange={(e) => set('targetWeight', e.target.value)}
            placeholder={`Where you'd like to be (${f.weightUnit})`}
          />
        </section>
      )}

      {step === 2 && (
        <section>
          <h1 className="ob-title">What&apos;s your goal?</h1>
          <p className="ob-lede">Sets your calories, protein target and recommended recipes.</p>
          <div className="ob-cardgrid">
            {GOALS.map(([k, title, desc, icon, color]) => (
              <button
                key={k}
                type="button"
                className="ob-card"
                aria-pressed={f.goal === k}
                onClick={() => set('goal', k)}
              >
                <span
                  className="ob-card__badge"
                  style={{ background: `color-mix(in srgb, ${color} 20%, var(--panel-2))` }}
                >
                  <Icon name={icon} size={34} style={{ color }} />
                </span>
                <span className="ob-card__title">{title}</span>
                <span className="ob-card__desc">{desc}</span>
              </button>
            ))}
          </div>

          <span className="ob-label">Activity outside the gym</span>
          <div className="ob-list" style={{ marginTop: 0 }}>
            {ACTIVITIES.map(([k, label, tag]) => (
              <button
                key={k}
                type="button"
                className="ob-rowcard"
                aria-pressed={f.activity === k}
                onClick={() => set('activity', k)}
              >
                <span className="ob-rowcard__label">{label}</span>
                <span className="ob-rowcard__tag">{tag}</span>
              </button>
            ))}
          </div>

          <span className="ob-label">Training experience</span>
          <div className="ob-list" style={{ marginTop: 0 }}>
            {EXPERIENCE.map(([k, label, tag]) => (
              <button
                key={k}
                type="button"
                className="ob-rowcard"
                aria-pressed={f.experience === k}
                onClick={() => set('experience', k)}
              >
                <span className="ob-rowcard__label">{label}</span>
                <span className="ob-rowcard__tag">{tag}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h1 className="ob-title">What equipment do you have?</h1>
          <p className="ob-lede">
            FORGE flags moves you can&apos;t do and suggests a swap. Change it anytime.
          </p>
          <div className="ob-list">
            {EQUIPMENT.map(([id, label]) => {
              const on = f.gear.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  className="ob-rowcard"
                  aria-pressed={on}
                  onClick={() => toggle('gear', id)}
                >
                  <span className="ob-rowcard__icon">
                    <Icon name="dumbbell" size={20} style={{ color: 'var(--accent)' }} />
                  </span>
                  <span className="ob-rowcard__label">{label}</span>
                  <span className="ob-rowcard__check">✓</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {step === 4 && (
        <section>
          <h1 className="ob-title">Any allergies?</h1>
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
            None apply? Just hit continue.
          </p>
        </section>
      )}

      {step === 5 && (
        <section>
          <h1 className="ob-title">Foods you hate?</h1>
          <p className="ob-lede">
            Life&apos;s too short to eat things you don&apos;t like. We&apos;ll filter these out.
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
        </section>
      )}

      <div className="ob-cta">
        <button type="button" className="ob-continue" onClick={next} disabled={!canContinue}>
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
