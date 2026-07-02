import { Modal } from './Modal';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { translator } from '@/lib/i18n';

interface ProModalProps {
  lang: string;
  onClose: () => void;
  onActivate: () => void;
}

/**
 * Recipes PRO unlocks. Kept as a literal so this modal doesn't pull the whole
 * recipe library into its bundle — ProModal.test.ts asserts it stays honest.
 */
export const PRO_RECIPE_COUNT = 175;

const PERKS: ReadonlyArray<[IconName, string, string]> = [
  ['moon', 'Sleep', 'Auto-synced sleep tracking & a recovery score'],
  ['stats', 'Smart devices', 'Connect your watch, band or scale'],
  ['recipes', `${PRO_RECIPE_COUNT}+ PRO recipes`, 'The full recipe library, unlocked'],
  ['chart', 'Progress +', 'Deeper trends and history'],
];

export function ProModal({ lang, onClose, onActivate }: ProModalProps): JSX.Element {
  const t = translator(lang);
  return (
    <Modal onClose={onClose} label="Upgrade to FORGE PRO">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="ob-eyebrow">UPGRADE</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            FORGE <span style={{ color: 'var(--accent)' }}>PRO</span>
          </div>
        </div>
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>
      <p className="state__msg" style={{ textAlign: 'left', margin: '6px 0 18px' }}>
        {t('proPitch')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {PERKS.map(([icon, title, desc]) => (
          <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Icon name={icon} size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700 }}>{title}</div>
              <div className="state__msg" style={{ textAlign: 'left', margin: 0 }}>
                {desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', margin: '4px 0 12px' }}>
        <span className="pulse-stat" style={{ fontSize: '2rem' }}>
          £4.99
        </span>
        <span className="state__msg" style={{ margin: 0 }}>
          {t('perMonth')}
        </span>
      </div>

      <Button onClick={onActivate} style={{ width: '100%' }}>
        {t('startPro')}
      </Button>
      <div className="state__msg" style={{ marginTop: 10 }}>
        {t('demoNote')}
      </div>
    </Modal>
  );
}
