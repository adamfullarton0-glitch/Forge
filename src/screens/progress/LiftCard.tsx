import { Card } from '@/components/Card';
import { getExercise } from '@/features/workouts/exercises';
import { kg2lb } from '@/lib/calc';
import type { LiftEntry } from '@/types/schemas';

interface LiftCardProps {
  name: string;
  lifts: LiftEntry[];
  wu: 'kg' | 'lb';
  onOpen: () => void;
}

/** A per-exercise working-weight card with a sparkline + progression nudge. */
export function LiftCard({ name, lifts, wu, onOpen }: LiftCardProps): JSX.Element {
  const showW = (kg: number): number =>
    wu === 'lb' ? Math.round(kg2lb(kg) * 2) / 2 : Math.round(kg * 2) / 2;
  const ex = getExercise(name);
  const last = lifts[lifts.length - 1];
  const first = lifts[0];
  const delta = last && first ? last.w - first.w : 0;
  const due = last?.hit ?? false;
  const inc = ex?.lower ? 5 : 2.5;

  const weights = lifts.map((x) => x.w);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = Math.max(0.1, max - min);
  const X = (i: number): number => 4 + (i / Math.max(1, lifts.length - 1)) * 92;
  const Y = (v: number): number => 4 + (1 - (v - min) / span) * 30;

  return (
    <Card onClick={onOpen} style={{ marginBottom: 10, cursor: 'pointer' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{name}</div>
          <div className="state__msg" style={{ textAlign: 'left', margin: '2px 0 0' }}>
            {lifts.length} log{lifts.length === 1 ? '' : 's'} · {ex?.sr}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="pulse-stat" style={{ fontSize: '1.2rem' }}>
            {last ? showW(last.w) : 0}
            <span className="stat-label" style={{ marginLeft: 2 }}>
              {wu}
            </span>
          </div>
          {delta !== 0 ? (
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: delta > 0 ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {delta > 0 ? '▲' : '▼'} {showW(Math.abs(delta))} {wu}
            </div>
          ) : null}
        </div>
      </div>
      {lifts.length > 1 ? (
        <svg
          viewBox="0 0 100 38"
          preserveAspectRatio="none"
          style={{ width: '100%', height: 38, marginTop: 8 }}
          aria-hidden="true"
        >
          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={lifts.map((x, i) => `${X(i)},${Y(x.w)}`).join(' ')}
            vectorEffect="non-scaling-stroke"
          />
          {lifts.map((x, i) => (
            <circle key={i} cx={X(i)} cy={Y(x.w)} r="1.6" fill="var(--accent)" />
          ))}
        </svg>
      ) : null}
      {due && last ? (
        <div style={{ marginTop: 8, fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent)' }}>
          Add weight next session — try {showW(last.w + inc)} {wu}
        </div>
      ) : null}
    </Card>
  );
}
