import { type KeyboardEvent } from 'react';
import { MUSCLE_GROUPS, type MuscleGroup } from '@/features/workouts/muscles';
import { SHAPES, FILLER, BODY_VIEWBOX } from './bodyShapes';

interface BodyMapProps {
  selected: MuscleGroup | null;
  counts: Record<MuscleGroup, number>;
  onSelect: (group: MuscleGroup) => void;
}

/** A visual, tappable body map for finding exercises by muscle group. */
export function BodyMap({ selected, counts, onSelect }: BodyMapProps): JSX.Element {
  const onKey = (e: KeyboardEvent, group: MuscleGroup): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(group);
    }
  };

  return (
    <div>
      <svg
        viewBox={BODY_VIEWBOX}
        width="100%"
        style={{ maxWidth: 360, display: 'block', margin: '0 auto' }}
        role="group"
        aria-label="Body map — choose a muscle group"
      >
        {FILLER}
        {MUSCLE_GROUPS.map((g) => {
          const on = selected === g.id;
          return (
            <g
              key={g.id}
              role="button"
              tabIndex={0}
              aria-pressed={on}
              aria-label={`${g.label} — ${counts[g.id]} exercises`}
              onClick={() => onSelect(g.id)}
              onKeyDown={(e) => onKey(e, g.id)}
              style={{ cursor: 'pointer' }}
              fill={on ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 22%, var(--panel-2))'}
              stroke={on ? 'var(--accent)' : 'var(--glass-border)'}
              strokeWidth={1.5}
            >
              <title>{g.label}</title>
              {SHAPES[g.id]}
            </g>
          );
        })}
      </svg>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          maxWidth: 360,
          margin: '2px auto 0',
          color: 'var(--muted)',
          fontSize: '0.72rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        <span>Front</span>
        <span>Back</span>
      </div>
    </div>
  );
}
