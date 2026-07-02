import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { newCustomRecipeId } from '@/features/recipes/custom';
import { translator } from '@/lib/i18n';
import type { CustomRecipe } from '@/types/schemas';
import type { MealType } from '@/features/recipes/filter';

const MEALS: ReadonlyArray<MealType> = ['breakfast', 'lunch', 'dinner', 'snack'];
const toNum = (s: string): number => {
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

interface RecipeBuilderProps {
  lang: string;
  initial: CustomRecipe | null;
  onSave: (recipe: CustomRecipe) => void;
  onClose: () => void;
}

/** Create or edit a user recipe: name, meal, macros, ingredients, method. */
export function RecipeBuilder({ lang, initial, onSave, onClose }: RecipeBuilderProps): JSX.Element {
  const t = translator(lang);
  const [name, setName] = useState(initial?.name ?? '');
  const [meal, setMeal] = useState<MealType>(initial?.meal ?? 'lunch');
  const [kcal, setKcal] = useState(initial ? String(initial.kcal) : '');
  const [p, setP] = useState(initial ? String(initial.p) : '');
  const [c, setC] = useState(initial ? String(initial.c) : '');
  const [f, setF] = useState(initial ? String(initial.f) : '');
  const [ing, setIng] = useState<string[]>(initial?.ing ?? []);
  const [ingDraft, setIngDraft] = useState('');
  const [steps, setSteps] = useState<string[]>(initial?.steps ?? []);
  const [stepDraft, setStepDraft] = useState('');

  // Calories are required — a 0-kcal recipe would top every "fewest kcal"
  // sort and pass the low-calorie filter with nonsense data.
  const valid = name.trim().length > 0 && ing.length > 0 && toNum(kcal) > 0;

  const addIng = (): void => {
    const v = ingDraft.trim();
    if (!v) return;
    setIng((xs) => [...xs, v]);
    setIngDraft('');
  };
  const addStep = (): void => {
    const v = stepDraft.trim();
    if (!v) return;
    setSteps((xs) => [...xs, v]);
    setStepDraft('');
  };

  const save = (): void => {
    const recipe: CustomRecipe = {
      id: initial?.id ?? newCustomRecipeId(),
      name: name.trim(),
      kcal: toNum(kcal),
      p: toNum(p),
      c: toNum(c),
      f: toNum(f),
      ing,
      meal,
      ...(steps.length > 0 ? { steps } : {}),
    };
    onSave(recipe);
  };

  const macro = (
    label: string,
    value: string,
    setter: (v: string) => void,
    id: string,
  ): JSX.Element => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label className="ob-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder="0"
      />
    </div>
  );

  return (
    <Modal onClose={onClose} label={initial ? t('editRecipe') : t('createRecipe')}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
          {initial ? t('editRecipe') : t('createRecipe')}
        </div>
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>

      <label className="ob-label" htmlFor="recipe-name">
        {t('recipeNameL')}
      </label>
      <input
        id="recipe-name"
        className="input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. My Chicken Bowl"
      />

      <div className="stat-label" style={{ margin: '16px 0 6px' }}>
        {t('mealType')}
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {MEALS.map((m) => (
          <Chip
            key={m}
            label={t(m === 'snack' ? 'snacks' : m)}
            active={meal === m}
            onClick={() => setMeal(m)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '16px 0 4px' }}>
        {macro(t('calories'), kcal, setKcal, 'recipe-kcal')}
        {macro(`${t('protein')} g`, p, setP, 'recipe-p')}
        {macro(`${t('carbs')} g`, c, setC, 'recipe-c')}
        {macro(`${t('fat')} g`, f, setF, 'recipe-f')}
      </div>

      <div className="stat-label" style={{ margin: '16px 0 6px' }}>
        {t('ingredients')}
      </div>
      {ing.length > 0 ? (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
          {ing.map((x, i) => (
            <span
              key={`${x}-${i}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.78rem',
                fontWeight: 600,
                background: 'var(--panel-2)',
                border: '1px solid var(--glass-border)',
                borderRadius: 99,
                padding: '5px 6px 5px 12px',
                textTransform: 'capitalize',
              }}
            >
              {x}
              <button
                type="button"
                aria-label={`${t('deleteR')} ${x}`}
                onClick={() => setIng((xs) => xs.filter((_, j) => j !== i))}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          aria-label={t('addIngredient')}
          placeholder={t('addIngredient')}
          value={ingDraft}
          onChange={(e) => setIngDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addIng();
            }
          }}
        />
        <Button variant="ghost" onClick={addIng} disabled={!ingDraft.trim()}>
          {t('addBtn')}
        </Button>
      </div>

      <div className="stat-label" style={{ margin: '16px 0 6px' }}>
        {t('method')} <span style={{ fontWeight: 500 }}>({t('optional')})</span>
      </div>
      {steps.length > 0 ? (
        <div style={{ marginBottom: 10 }}>
          {steps.map((s, i) => (
            <div key={i} className="ex-step">
              <div className="ex-step__num">{i + 1}</div>
              <div style={{ flex: 1 }}>{s}</div>
              <button
                type="button"
                className="modal-close"
                style={{ width: 28, height: 28, flexShrink: 0 }}
                aria-label={`${t('deleteR')} ${t('step')} ${i + 1}`}
                onClick={() => setSteps((xs) => xs.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          aria-label={t('addStep')}
          placeholder={t('addStep')}
          value={stepDraft}
          onChange={(e) => setStepDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addStep();
            }
          }}
        />
        <Button variant="ghost" onClick={addStep} disabled={!stepDraft.trim()}>
          {t('addBtn')}
        </Button>
      </div>

      <Button onClick={save} disabled={!valid} style={{ width: '100%', marginTop: 18 }}>
        {t('saveRecipe')}
      </Button>
      {!valid ? (
        <div className="state__msg" style={{ marginTop: 8 }}>
          {t('emptyRecipe')}
        </div>
      ) : null}
    </Modal>
  );
}
