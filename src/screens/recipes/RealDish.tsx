import { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Icon } from '@/components/Icon';
import { Loading, ErrorState, EmptyState } from '@/components/states';
import { searchMeals, type Dish } from '@/lib/api/themealdb';
import { translator } from '@/lib/i18n';

function RealDishModal({
  dish,
  lang,
  onClose,
}: {
  dish: Dish;
  lang: string;
  onClose: () => void;
}): JSX.Element {
  const t = translator(lang);
  return (
    <Modal onClose={onClose} label={dish.name}>
      <div
        style={{
          height: 200,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 14,
          marginBottom: 16,
        }}
      >
        <img
          src={dish.thumb}
          alt={dish.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,.78), transparent 55%)',
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
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{dish.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,.85)' }}>
            {[dish.category, dish.area].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>

      <div
        className="warn-box"
        style={{
          background: 'var(--panel-2)',
          borderColor: 'var(--glass-border)',
          marginBottom: 16,
        }}
      >
        A real dish with a real photo and method. Macros aren&apos;t provided for these — log it as
        a custom food on the Eat tab if you make it.
      </div>

      <div className="ex-modal__label">{t('ingredients')}</div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 }}>
        {dish.ingredients.map((i, x) => (
          <span
            key={x}
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              background: 'var(--panel-2)',
              border: '1px solid var(--glass-border)',
              borderRadius: 99,
              padding: '6px 12px',
            }}
          >
            {i}
          </span>
        ))}
      </div>

      <div className="ex-modal__label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="recipes" size={13} style={{ color: 'var(--accent)' }} /> {t('method')}
      </div>
      {dish.steps.map((s, i) => (
        <div key={i} className="ex-step">
          <div className="ex-step__num">{i + 1}</div>
          <div>{s}</div>
        </div>
      ))}
      {dish.youtube ? (
        <a
          href={dish.youtube}
          target="_blank"
          rel="noreferrer"
          style={{ display: 'inline-block', marginTop: 8, fontWeight: 700 }}
        >
          Watch it on YouTube ↗
        </a>
      ) : null}
    </Modal>
  );
}

export function RealDishSearch({ lang }: { lang: string }): JSX.Element {
  const t = translator(lang);
  const [q, setQ] = useState('');
  const [res, setRes] = useState<Dish[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const [sel, setSel] = useState<Dish | null>(null);

  const run = (): void => {
    const term = q.trim();
    if (!term) return;
    setLoading(true);
    setErr(false);
    setRes(null);
    void searchMeals(term).then((r) => {
      setLoading(false);
      if (r.ok) setRes(r.dishes);
      else {
        setErr(true);
        setRes([]);
      }
    });
  };

  return (
    <Card style={{ marginBottom: 14 }}>
      <div className="ex-modal__label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="recipes" size={13} style={{ color: 'var(--accent)' }} /> {t('discover')}
      </div>
      <div className="state__msg" style={{ textAlign: 'left', margin: '0 0 10px' }}>
        {t('discoverNote')}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          aria-label={t('discover')}
          placeholder={t('discoverHint')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') run();
          }}
        />
        <Button onClick={run} aria-label="Search dishes">
          →
        </Button>
      </div>

      {loading ? <Loading label={t('searching')} /> : null}
      {err ? (
        <ErrorState
          title="Couldn't reach the recipe database"
          message="Check your connection and try again in a moment."
          onRetry={run}
        />
      ) : null}
      {res && !loading && res.length === 0 && !err ? (
        <EmptyState title="No dishes found" message="Try chicken, pasta, curry…" icon="recipes" />
      ) : null}
      {res && res.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          {res.slice(0, 8).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSel(m)}
              style={{
                cursor: 'pointer',
                borderRadius: 14,
                overflow: 'hidden',
                background: 'var(--panel-2)',
                border: '1px solid var(--glass-border)',
                padding: 0,
                textAlign: 'left',
                color: 'var(--text)',
              }}
            >
              <img
                src={m.thumb}
                alt={m.name}
                style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '8px 10px', fontSize: '0.8rem', fontWeight: 700 }}>
                {m.name}
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {sel ? <RealDishModal dish={sel} lang={lang} onClose={() => setSel(null)} /> : null}
    </Card>
  );
}
