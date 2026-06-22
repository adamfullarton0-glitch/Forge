import { musclesWorked, type MuscleGroup } from '@/features/workouts/muscles';
import { SHAPES, FILLER, BODY_VIEWBOX } from './bodyShapes';

/** A non-interactive body diagram highlighting the muscles an exercise works. */
export function ExerciseMuscles({ name }: { name: string }): JSX.Element | null {
  const { primary, secondary } = musclesWorked(name);
  if (primary.length === 0 && secondary.length === 0) return null;

  const fillFor = (g: MuscleGroup): string =>
    primary.includes(g)
      ? 'var(--accent)'
      : secondary.includes(g)
        ? 'color-mix(in srgb, var(--accent) 38%, var(--panel-2))'
        : 'var(--panel-2)';
  const worked = (g: MuscleGroup): boolean => primary.includes(g) || secondary.includes(g);

  return (
    <div>
      <svg
        viewBox={BODY_VIEWBOX}
        width="100%"
        style={{ maxWidth: 320, display: 'block', margin: '0 auto' }}
        role="img"
        aria-label={`Muscles worked by ${name}`}
      >
        {FILLER}
        {Object.entries(SHAPES).map(([id, shape]) => {
          const g = id as MuscleGroup;
          return (
            <g
              key={id}
              fill={fillFor(g)}
              stroke={worked(g) ? 'var(--accent)' : 'var(--glass-border)'}
              strokeWidth={worked(g) ? 1.5 : 1}
            >
              {shape}
            </g>
          );
        })}
      </svg>
      <div
        style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          margin: '4px auto 0',
          color: 'var(--muted)',
          fontSize: '0.72rem',
          fontWeight: 700,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i
            style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)' }}
            aria-hidden="true"
          />
          Primary
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: 'color-mix(in srgb, var(--accent) 38%, var(--panel-2))',
            }}
            aria-hidden="true"
          />
          Secondary
        </span>
      </div>
    </div>
  );
}
