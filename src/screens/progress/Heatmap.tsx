import { Card } from '@/components/Card';
import type { DoneEntry } from '@/types/schemas';

const WEEKS = 12;

/** A 12-week training-consistency heatmap (sets per day). */
export function Heatmap({ done }: { done: readonly DoneEntry[] }): JSX.Element {
  const today = new Date();
  const map = new Map<string, number>();
  for (const x of done) map.set(x.d, (map.get(x.d) ?? 0) + (x.sets ?? 1));

  const dow = (today.getDay() + 6) % 7;
  const start = new Date(today);
  start.setDate(start.getDate() - dow - (WEEKS - 1) * 7);
  const max = Math.max(6, ...[...map.values()]);

  const cols: Array<Array<{ key: string; sets: number; future: boolean }>> = [];
  for (let w = 0; w < WEEKS; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + w * 7 + d);
      const key = dt.toISOString().slice(0, 10);
      col.push({ key, sets: map.get(key) ?? 0, future: dt > today });
    }
    cols.push(col);
  }

  const cell = (c: { sets: number; future: boolean }): string => {
    if (c.future) return 'transparent';
    if (!c.sets) return 'var(--panel-2)';
    const pct = Math.round(40 + 60 * Math.min(1, c.sets / max));
    return `color-mix(in srgb, var(--accent) ${pct}%, transparent)`;
  };

  return (
    <Card>
      <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 2 }}>
        {cols.map((col, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {col.map((c, di) => (
              <div
                key={di}
                title={c.future ? '' : `${c.key}: ${c.sets} sets`}
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 3,
                  background: cell(c),
                  border: c.future ? '1px solid transparent' : '1px solid var(--glass-border)',
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 11,
          fontSize: '0.62rem',
          color: 'var(--muted)',
          fontWeight: 600,
        }}
      >
        <span>Less</span>
        {[20, 55, 80, 100].map((pct) => (
          <div
            key={pct}
            style={{
              width: 11,
              height: 11,
              borderRadius: 3,
              background: `color-mix(in srgb, var(--accent) ${pct}%, transparent)`,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </Card>
  );
}
