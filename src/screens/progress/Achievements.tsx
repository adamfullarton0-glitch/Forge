import { Card } from '@/components/Card';
import { Icon, type IconName } from '@/components/Icon';
import { achievements, type AchievementData } from '@/lib/calc';

const ICONS: Record<string, IconName> = {
  check: 'check',
  flame: 'flame',
  trophy: 'trophy',
  dumbbell: 'dumbbell',
  chart: 'chart',
  target: 'target',
};

/** The achievements grid with unlocked state. */
export function Achievements({ data }: { data: AchievementData }): JSX.Element {
  const list = achievements(data);
  const got = list.filter((a) => a.got).length;
  return (
    <Card>
      <div className="state__msg" style={{ textAlign: 'left', marginBottom: 12 }}>
        {got} of {list.length} unlocked
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {list.map((a) => (
          <div
            key={a.id}
            style={{
              textAlign: 'center',
              padding: '13px 6px',
              borderRadius: 14,
              background: a.got ? 'var(--accent-soft)' : 'var(--panel-2)',
              border: `1px solid ${a.got ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'transparent'}`,
              opacity: a.got ? 1 : 0.6,
            }}
          >
            <Icon
              name={ICONS[a.icon] ?? 'trophy'}
              size={24}
              style={{ color: a.got ? 'var(--accent)' : 'var(--muted)' }}
            />
            <div style={{ fontSize: '0.72rem', fontWeight: 800, marginTop: 4 }}>{a.name}</div>
            <div
              className="state__msg"
              style={{ margin: '2px 0 0', fontSize: '0.6rem', lineHeight: 1.3 }}
            >
              {a.desc}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
