import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { photoFor, recipeMeta } from '@/features/recipes/filter';
import { cookSteps } from '@/features/recipes/cooking';
import { gradOf, type Recipe } from '@/features/recipes/data';
import { translator, type TKey } from '@/lib/i18n';

interface RecipeModalProps {
  r: Recipe;
  photos: Record<string, string[]> | null;
  mealLabel: TKey;
  lang: string;
  onClose: () => void;
  onLog: () => void;
  onAddToList: () => void;
}

export function RecipeModal({
  r,
  photos,
  mealLabel,
  lang,
  onClose,
  onLog,
  onAddToList,
}: RecipeModalProps): JSX.Element {
  const t = translator(lang);
  const [imgErr, setImgErr] = useState(false);
  const url = photoFor(r, photos);
  const g = gradOf(r.grad ?? 0);
  const meta = recipeMeta(r);
  const method = cookSteps(r);
  const tiles: ReadonlyArray<[string, number, string]> = [
    ['kcal', r.kcal, 'var(--accent)'],
    ['P', r.p, '#3D8BFF'],
    ['C', r.c, '#F5A623'],
    ['F', r.f, '#F0479C'],
  ];

  return (
    <Modal onClose={onClose} label={r.name}>
      <div
        style={{
          height: 168,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 14,
          marginBottom: 16,
          background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`,
        }}
      >
        {url && !imgErr ? (
          <img
            src={url}
            alt={r.name}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 72,
              fontWeight: 800,
              color: 'rgba(255,255,255,.9)',
            }}
          >
            {(r.name || '?').trim().charAt(0).toUpperCase()}
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,.7), transparent 55%)',
          }}
        />
        <button
          type="button"
          className="modal-close"
          aria-label="Close"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(0,0,0,.5)',
            color: '#fff',
          }}
        >
          ✕
        </button>
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 12 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{r.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,.85)' }}>{r.time}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tiles.map(([l, v, c]) => (
          <div key={l} className="mini-stat">
            <div className="pulse-stat" style={{ fontSize: '1.05rem', color: c }}>
              {v}
            </div>
            <div className="stat-label">
              {l}
              {l !== 'kcal' ? 'g' : ''}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px 14px',
          marginBottom: 16,
          fontSize: '0.8rem',
          color: 'var(--muted)',
          fontWeight: 600,
        }}
      >
        <span>
          <b style={{ color: 'var(--text)' }}>{meta.total} min</b> total
        </span>
        <span>{meta.prep} min prep</span>
        <span>{meta.cook} min cook</span>
        <span>Serves 1</span>
        <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{meta.diff}</span>
      </div>

      <p className="state__msg" style={{ textAlign: 'left', marginBottom: 18 }}>
        {r.desc}
      </p>

      {method ? (
        <div style={{ marginBottom: 20 }}>
          <div
            className="ex-modal__label"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="recipes" size={13} style={{ color: 'var(--accent)' }} /> {t('method')}
          </div>
          {method.steps.map((s, i) => (
            <div key={i} className="ex-step">
              <div className="ex-step__num">{i + 1}</div>
              <div>{s}</div>
            </div>
          ))}
          {method.tip ? (
            <div
              className="warn-box"
              style={{
                background: 'var(--panel-2)',
                borderColor: 'var(--glass-border)',
                marginTop: 4,
              }}
            >
              <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{t('chefTip')}: </span>
              {method.tip}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="ex-modal__label">{t('ingredients')}</div>
      <div
        style={{
          display: 'flex',
          gap: 7,
          flexWrap: 'wrap',
          marginBottom: r.allergens.length ? 16 : 20,
        }}
      >
        {r.ing.map((i) => (
          <span
            key={i}
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              background: 'var(--panel-2)',
              border: '1px solid var(--glass-border)',
              borderRadius: 99,
              padding: '6px 12px',
              textTransform: 'capitalize',
            }}
          >
            {i}
          </span>
        ))}
      </div>
      {r.allergens.length > 0 ? (
        <div className="state__msg" style={{ textAlign: 'left', marginBottom: 20 }}>
          Contains: {r.allergens.join(', ')}
        </div>
      ) : null}

      <Button
        onClick={() => {
          onLog();
          onClose();
        }}
        style={{ width: '100%' }}
      >
        {t('logTo')} {t(mealLabel)}
      </Button>
      <Button variant="ghost" onClick={onAddToList} style={{ width: '100%', marginTop: 8 }}>
        {t('addToList')}
      </Button>
    </Modal>
  );
}
