import { type KeyboardEvent, type ReactNode } from 'react';
import { MUSCLE_GROUPS, type MuscleGroup } from '@/features/workouts/muscles';

interface BodyMapProps {
  selected: MuscleGroup | null;
  counts: Record<MuscleGroup, number>;
  onSelect: (group: MuscleGroup) => void;
}

/** SVG shapes per muscle region (front figure ~x66, back figure ~x194). */
const SHAPES: Record<MuscleGroup, ReactNode> = {
  shoulders: (
    <>
      <ellipse cx={46} cy={45} rx={10} ry={8} />
      <ellipse cx={86} cy={45} rx={10} ry={8} />
    </>
  ),
  chest: <rect x={50} y={40} width={32} height={20} rx={6} />,
  biceps: (
    <>
      <rect x={33} y={50} width={9} height={22} rx={4} />
      <rect x={90} y={50} width={9} height={22} rx={4} />
    </>
  ),
  core: <rect x={54} y={62} width={24} height={28} rx={6} />,
  quads: (
    <>
      <rect x={53} y={102} width={12} height={44} rx={6} />
      <rect x={67} y={102} width={12} height={44} rx={6} />
    </>
  ),
  calves: (
    <>
      <rect x={54} y={150} width={10} height={38} rx={5} />
      <rect x={68} y={150} width={10} height={38} rx={5} />
    </>
  ),
  back: <rect x={178} y={40} width={32} height={46} rx={8} />,
  triceps: (
    <>
      <rect x={161} y={50} width={9} height={22} rx={4} />
      <rect x={218} y={50} width={9} height={22} rx={4} />
    </>
  ),
  glutes: <rect x={180} y={88} width={28} height={18} rx={8} />,
  hamstrings: (
    <>
      <rect x={181} y={106} width={12} height={42} rx={6} />
      <rect x={195} y={106} width={12} height={42} rx={6} />
    </>
  ),
};

/** Non-interactive silhouette filler (head, neck, forearms, feet, hips). */
function Filler(): JSX.Element {
  const fill = 'var(--panel-2)';
  const stroke = 'var(--glass-border)';
  const p = { fill, stroke, strokeWidth: 1 };
  return (
    <g aria-hidden="true">
      {/* Front */}
      <circle cx={66} cy={20} r={11} {...p} />
      <rect x={62} y={29} width={8} height={7} {...p} />
      <rect x={33} y={72} width={8} height={20} rx={4} {...p} />
      <rect x={91} y={72} width={8} height={20} rx={4} {...p} />
      <rect x={52} y={90} width={28} height={13} rx={4} {...p} />
      <rect x={54} y={188} width={10} height={8} rx={2} {...p} />
      <rect x={68} y={188} width={10} height={8} rx={2} {...p} />
      {/* Back */}
      <circle cx={194} cy={20} r={11} {...p} />
      <rect x={190} y={29} width={8} height={7} {...p} />
      <rect x={161} y={72} width={9} height={20} rx={4} {...p} />
      <rect x={218} y={72} width={9} height={20} rx={4} {...p} />
      <rect x={181} y={148} width={12} height={40} rx={6} {...p} />
      <rect x={195} y={148} width={12} height={40} rx={6} {...p} />
      <rect x={181} y={188} width={12} height={8} rx={2} {...p} />
      <rect x={195} y={188} width={12} height={8} rx={2} {...p} />
    </g>
  );
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
        viewBox="0 0 260 215"
        width="100%"
        style={{ maxWidth: 360, display: 'block', margin: '0 auto' }}
        role="group"
        aria-label="Body map — choose a muscle group"
      >
        <Filler />
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
