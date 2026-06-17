import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { RealDishSearch } from './recipes/RealDish';
import { RecipeTile } from './recipes/RecipeTile';
import { RecipeModal } from './recipes/RecipeModal';
import { ShoppingList } from './recipes/ShoppingList';
import { useData, useUpdate } from '@/features/store';
import { ALL_RECIPES, type Recipe } from '@/features/recipes/data';
import {
  addIngredients,
  toggleHave,
  removeItem,
  clearHave,
  counts,
} from '@/features/recipes/shopping';
import {
  filterRecipes,
  canSee,
  mealOf,
  recipeMins,
  PHOTO_CATS,
  PHOTO_INGS,
} from '@/features/recipes/filter';
import { fetchPhotos } from '@/lib/api/themealdb';
import { translator, type TKey } from '@/lib/i18n';
import { todayKey } from '@/lib/calc';

const PAGE = 16;

function hourMeal(): 'breakfast' | 'lunch' | 'dinner' | 'snacks' {
  const h = new Date().getHours();
  return h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 21 ? 'dinner' : 'snacks';
}

export function Recipes(): JSX.Element | null {
  const data = useData();
  const update = useUpdate();
  const navigate = useNavigate();
  const t = translator(data.settings.lang);
  const p = data.profile;

  const [q, setQ] = useState('');
  const [mf, setMf] = useState('all');
  const [cat, setCat] = useState('all');
  const [tf, setTf] = useState('any');
  const [gf, setGf] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [show, setShow] = useState(PAGE);
  const [photos, setPhotos] = useState<Record<string, string[]> | null>(null);
  const [modal, setModal] = useState<Recipe | null>(null);
  const [showList, setShowList] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void fetchPhotos(PHOTO_CATS, PHOTO_INGS).then((ph) => {
      if (live) setPhotos(ph);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!p) return null;

  const meal = hourMeal();
  const tk = todayKey();
  const list = filterRecipes(ALL_RECIPES, {
    allergies: p.allergies,
    dislikes: p.dislikes,
    goal: p.goal,
    q,
    meal: mf,
    cat,
    diet: gf,
    time: tf,
    sort: sortBy,
  });
  const openR = list.filter((r) => canSee(r, data.pro));
  const lockedCount = list.length - openR.length;
  const visible = openR.slice(0, show);

  const addRecipe = (r: Recipe): void => {
    const log = data.foodLog[tk] ?? [];
    update({
      foodLog: {
        ...data.foodLog,
        [tk]: [...log, { meal, n: r.name, kcal: r.kcal, p: r.p, c: r.c, f: r.f }],
      },
    });
  };

  const addToList = (r: Recipe): void => {
    const { list } = addIngredients(data.shopping, r.ing);
    update({ shopping: list });
    setAdded(r.name);
    window.setTimeout(() => setAdded((cur) => (cur === r.name ? null : cur)), 2200);
  };

  const cart = counts(data.shopping);

  const fRow = (
    label: string,
    items: ReadonlyArray<readonly [string, string]>,
    value: string,
    setter: (v: string) => void,
  ): JSX.Element => (
    <div style={{ marginBottom: 9 }}>
      <div className="stat-label" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {items.map(([k, l]) => (
          <Chip
            key={k}
            label={l}
            active={value === k}
            onClick={() => {
              setter(k);
              setShow(PAGE);
            }}
          />
        ))}
      </div>
    </div>
  );

  const mealTagKey = (r: Recipe): TKey => {
    const m = mealOf(r);
    return m === 'snack' ? 'snacks' : m;
  };

  return (
    <div className="screen">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <h1 className="screen__title" style={{ margin: 0 }}>
          {t('recipes')}
        </h1>
        <Button variant="ghost" onClick={() => setShowList(true)}>
          {t('shoppingList')}
          {cart.left > 0 ? ` (${cart.left})` : ''}
        </Button>
      </div>

      <div style={{ height: 14 }} />

      <RealDishSearch lang={data.settings.lang} />

      <div
        className="state__msg"
        style={{ textAlign: 'left', color: 'var(--accent)', fontWeight: 700, margin: '0 0 10px' }}
      >
        {openR.length} recipes match · tap one for the method or to log it
      </div>

      <input
        className="input"
        style={{ marginBottom: 12 }}
        aria-label={t('searchRecipes')}
        placeholder={t('searchRecipes')}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setShow(PAGE);
        }}
      />

      <div style={{ marginBottom: 14 }}>
        {fRow(
          t('mealType'),
          [
            ['all', t('all')],
            ['breakfast', t('breakfast')],
            ['lunch', t('lunch')],
            ['dinner', t('dinner')],
            ['snack', t('snacks')],
          ],
          mf,
          setMf,
        )}
        {fRow(
          t('type'),
          [
            ['all', t('all')],
            ['Chicken', 'Chicken'],
            ['Beef', 'Beef'],
            ['Seafood', 'Fish'],
            ['Pork', 'Pork'],
            ['Vegetarian', 'Veggie'],
          ],
          cat,
          setCat,
        )}
        {fRow(
          t('timeF'),
          [
            ['any', t('anyTime')],
            ['15', '≤ 15 min'],
            ['30', '≤ 30 min'],
          ],
          tf,
          setTf,
        )}
        {fRow(
          t('diet'),
          [
            ['all', t('all')],
            ['goal', t('matched')],
            ['hp', '40g+ protein'],
            ['low', '< 500 kcal'],
          ],
          gf,
          setGf,
        )}
        {fRow(
          t('sortBy'),
          [
            ['default', t('default')],
            ['time', 'Quickest'],
            ['protein', 'Most protein'],
            ['kcal', 'Fewest kcal'],
          ],
          sortBy,
          setSortBy,
        )}
      </div>

      {visible.length === 0 ? (
        <Card>
          <div className="state__msg">No recipes match these filters. Try clearing one.</div>
        </Card>
      ) : null}

      {visible.map((r) => (
        <Card key={r.name + (r.gi ?? 'f')} style={{ marginBottom: 10 }}>
          <button
            type="button"
            onClick={() => setModal(r)}
            aria-label={`View ${r.name}`}
            style={{
              display: 'flex',
              gap: 12,
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            <RecipeTile r={r} photos={photos} size={70} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontWeight: 700, lineHeight: 1.25 }}>{r.name}</div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: 'var(--accent)',
                    background: 'var(--accent-soft)',
                    borderRadius: 99,
                    padding: '3px 9px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    height: 'fit-content',
                  }}
                >
                  <Icon name="plan" size={11} style={{ color: 'var(--accent)' }} />
                  {recipeMins(r)}m
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '5px 0 3px' }}>
                <span
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--accent)',
                    background: 'var(--accent-soft)',
                    borderRadius: 6,
                    padding: '2px 7px',
                  }}
                >
                  {t(mealTagKey(r))}
                </span>
                <span className="state__msg" style={{ margin: 0 }}>
                  <b style={{ color: '#3D8BFF' }}>{r.p}g</b> protein · {r.kcal} kcal
                </span>
              </div>
              <div
                className="state__msg"
                style={{
                  textAlign: 'left',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {r.desc}
              </div>
            </div>
          </button>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <Button variant="ghost" aria-label={`Log ${r.name}`} onClick={() => addRecipe(r)}>
              {t('logMeal')}
            </Button>
            <Button
              variant="ghost"
              aria-label={`${t('addToList')} — ${r.name}`}
              onClick={() => addToList(r)}
            >
              {added === r.name ? t('addedToList') : t('addToList')}
            </Button>
          </div>
        </Card>
      ))}

      {visible.length < openR.length ? (
        <Button variant="ghost" onClick={() => setShow((s) => s + PAGE)} style={{ width: '100%' }}>
          {t('moreEat')} ({openR.length - visible.length})
        </Button>
      ) : null}

      {!data.pro && lockedCount > 0 ? (
        <Card
          style={{
            marginTop: 12,
            textAlign: 'center',
            borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)',
            background: 'linear-gradient(135deg, var(--glass), var(--accent-soft))',
          }}
        >
          <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t('unlockRecipes')}
          </div>
          <div className="state__msg" style={{ margin: '6px 0 12px' }}>
            {lockedCount}+ {t('proRecipesT').toLowerCase()} match your filters.
          </div>
          <Button onClick={() => navigate('/more')}>{t('upgrade')}</Button>
        </Card>
      ) : null}

      {modal ? (
        <RecipeModal
          r={modal}
          photos={photos}
          lang={data.settings.lang}
          mealLabel={meal}
          onClose={() => setModal(null)}
          onLog={() => addRecipe(modal)}
          onAddToList={() => addToList(modal)}
        />
      ) : null}

      {showList ? (
        <ShoppingList
          lang={data.settings.lang}
          items={data.shopping}
          onToggle={(name) => update({ shopping: toggleHave(data.shopping, name) })}
          onRemove={(name) => update({ shopping: removeItem(data.shopping, name) })}
          onClearGot={() => update({ shopping: clearHave(data.shopping) })}
          onClearAll={() => update({ shopping: [] })}
          onClose={() => setShowList(false)}
        />
      ) : null}
    </div>
  );
}
