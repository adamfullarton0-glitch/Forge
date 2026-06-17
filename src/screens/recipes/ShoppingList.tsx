import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { counts, sortShopping } from '@/features/recipes/shopping';
import { translator } from '@/lib/i18n';
import type { ShoppingItem } from '@/types/schemas';

interface ShoppingListProps {
  lang: string;
  items: readonly ShoppingItem[];
  onToggle: (name: string) => void;
  onRemove: (name: string) => void;
  onClearGot: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

/** The shopping list: tick off what you've got, remove items, clear the list. */
export function ShoppingList({
  lang,
  items,
  onToggle,
  onRemove,
  onClearGot,
  onClearAll,
  onClose,
}: ShoppingListProps): JSX.Element {
  const t = translator(lang);
  const sorted = sortShopping(items);
  const c = counts(items);

  return (
    <Modal onClose={onClose} label={t('shoppingList')}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t('shoppingList')}</div>
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>

      {c.total === 0 ? (
        <p className="state__msg" style={{ textAlign: 'left', margin: '4px 0 8px' }}>
          {t('emptyShopping')}
        </p>
      ) : (
        <>
          <div className="state__msg" style={{ textAlign: 'left', margin: '0 0 14px' }}>
            {c.left} {t('toBuy').toLowerCase()} · {c.have} {t('gotIt').toLowerCase()}
          </div>

          <div className="stack" style={{ marginBottom: 16 }}>
            {sorted.map((it) => (
              <div key={it.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => onToggle(it.name)}
                  aria-pressed={it.have}
                  aria-label={`${it.have ? t('toBuy') : t('gotIt')}: ${it.name}`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '6px 0',
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 22,
                      height: 22,
                      flexShrink: 0,
                      borderRadius: 7,
                      border: `2px solid ${it.have ? 'var(--accent)' : 'var(--glass-border)'}`,
                      background: it.have ? 'var(--accent)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {it.have ? <Icon name="check" size={13} style={{ color: '#fff' }} /> : null}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: it.have ? 'var(--muted)' : 'var(--text)',
                      textDecoration: it.have ? 'line-through' : 'none',
                    }}
                  >
                    {it.name}
                  </span>
                </button>
                <button
                  type="button"
                  className="modal-close"
                  style={{ width: 32, height: 32, flexShrink: 0 }}
                  aria-label={`${t('deleteR')} ${it.name}`}
                  onClick={() => onRemove(it.name)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {c.left === 0 ? (
            <div className="state__msg" style={{ marginBottom: 12 }}>
              {t('allGot')}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="ghost"
              onClick={onClearGot}
              disabled={c.have === 0}
              style={{ flex: 1 }}
            >
              {t('clearGot')}
            </Button>
            <Button variant="ghost" onClick={onClearAll} style={{ flex: 1 }}>
              {t('clearAll')}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
