import { MUSCLE_GROUPS, type MuscleGroup } from '@/features/workouts/muscles';
import { GROUPS, type Side } from '@/features/workouts/musclemap';

interface BodyMapProps {
  selected: MuscleGroup | null;
  counts: Record<MuscleGroup, number>;
  onSelect: (group: MuscleGroup) => void;
}

/** A clean anatomical body map — tap a muscle to find exercises that train it. */
export function BodyMap({ selected, counts, onSelect }: BodyMapProps): JSX.Element {
  const base = import.meta.env.BASE_URL;

  const figure = (side: Side): JSX.Element => {
    const here = MUSCLE_GROUPS.filter((g) => GROUPS[g.id].side === side);
    return (
      <div style={{ flex: 1, maxWidth: 176 }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '200 / 369' }}>
          <img
            src={`${base}muscles/${side}.svg`}
            alt={`${side} view`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
          {selected && GROUPS[selected].side === side
            ? GROUPS[selected].overlays.map((id) => (
                <img
                  key={id}
                  src={`${base}muscles/main/${id}.svg`}
                  alt=""
                  aria-hidden="true"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                />
              ))
            : null}
          {here.map((g) => {
            const [x, y] = GROUPS[g.id].anchor;
            const on = selected === g.id;
            return (
              <button
                key={g.id}
                type="button"
                aria-label={`${g.label} — ${counts[g.id]} exercises`}
                aria-pressed={on}
                onClick={() => onSelect(g.id)}
                style={{
                  position: 'absolute',
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  border: on ? '2px solid #fff' : '1.5px solid rgba(255,255,255,.55)',
                  background: on ? 'var(--accent)' : 'rgba(0,0,0,.35)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            );
          })}
        </div>
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.6rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--muted)',
            marginTop: 4,
          }}
        >
          {side}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: 18, justifyContent: 'center' }}>
      {figure('front')}
      {figure('back')}
    </div>
  );
}
