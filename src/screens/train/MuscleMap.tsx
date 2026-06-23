import { exerciseMuscleMap, WGER_MUSCLES, type Side } from '@/features/workouts/musclemap';

/**
 * Anatomical "muscles worked" diagram: highlights an exercise's muscles in red
 * (primary) / orange (secondary) on the bundled wger front + back figures
 * (CC-BY-SA 3.0, see public/muscles/CREDITS.md), with named labels.
 */
export function MuscleMap({ name }: { name: string }): JSX.Element | null {
  const { primary, secondary } = exerciseMuscleMap(name);
  if (primary.length === 0 && secondary.length === 0) return null;
  const base = import.meta.env.BASE_URL;

  const figure = (side: Side): JSX.Element | null => {
    const prim = primary.filter((id) => WGER_MUSCLES[id]?.[1] === side);
    const sec = secondary.filter((id) => WGER_MUSCLES[id]?.[1] === side);
    if (prim.length === 0 && sec.length === 0) {
      // Still show the figure (greyed) so front+back stay visually paired.
    }
    const layer = (id: number, kind: 'main' | 'secondary'): JSX.Element => (
      <img
        key={`${kind}-${id}`}
        src={`${base}muscles/${kind}/${id}.svg`}
        alt=""
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
    );
    return (
      <div style={{ flex: 1, maxWidth: 150 }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '200 / 369' }}>
          <img
            src={`${base}muscles/${side}.svg`}
            alt={`${side} view`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
          {sec.map((id) => layer(id, 'secondary'))}
          {prim.map((id) => layer(id, 'main'))}
        </div>
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.62rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--muted)',
            marginTop: 2,
          }}
        >
          {side}
        </div>
      </div>
    );
  };

  const nameOf = (id: number): string => WGER_MUSCLES[id]?.[0] ?? '';
  const chip = (id: number, isPrimary: boolean): JSX.Element => (
    <span
      key={id}
      style={{
        fontSize: '0.72rem',
        fontWeight: 700,
        borderRadius: 99,
        padding: '3px 10px',
        color: isPrimary ? '#fff' : 'var(--text)',
        background: isPrimary ? '#e23232' : 'color-mix(in srgb, #f57900 30%, var(--panel-2))',
        border: '1px solid var(--glass-border)',
      }}
    >
      {nameOf(id)}
    </span>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {figure('front')}
        {figure('back')}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          justifyContent: 'center',
          marginTop: 10,
        }}
      >
        {primary.map((id) => chip(id, true))}
        {secondary.map((id) => chip(id, false))}
      </div>
    </div>
  );
}
