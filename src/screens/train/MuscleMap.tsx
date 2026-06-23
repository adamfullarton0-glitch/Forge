import { exerciseMuscleMap, WGER_MUSCLES, type Side } from '@/features/workouts/musclemap';

/**
 * Anatomical "muscles worked" diagram: highlights an exercise's muscles in red
 * (primary) / orange (secondary) on the bundled wger front + back figures
 * (CC-BY-SA 3.0, see public/muscles/CREDITS.md), with numbered markers tied to a
 * named legend — a proper labelled anatomy chart.
 */

/** Approx anchor of each muscle on its figure, as a fraction of the 200×369 box. */
const ANCHOR: Record<number, readonly [number, number]> = {
  1: [0.2, 0.34], // Biceps brachii (front, L arm)
  2: [0.29, 0.21], // Anterior deltoid
  4: [0.42, 0.24], // Pectoralis major
  6: [0.5, 0.37], // Rectus abdominis
  10: [0.4, 0.6], // Quadriceps
  13: [0.74, 0.35], // Brachialis (R arm)
  14: [0.36, 0.41], // Obliquus externus
  5: [0.22, 0.32], // Triceps brachii (back, L arm)
  7: [0.42, 0.8], // Gastrocnemius
  8: [0.42, 0.5], // Gluteus maximus
  9: [0.5, 0.17], // Trapezius
  11: [0.4, 0.62], // Biceps femoris
  12: [0.34, 0.33], // Latissimus dorsi
  15: [0.45, 0.86], // Soleus
  16: [0.5, 0.4], // Erector spinae
};

export function MuscleMap({ name }: { name: string }): JSX.Element | null {
  const { primary, secondary } = exerciseMuscleMap(name);
  if (primary.length === 0 && secondary.length === 0) return null;
  const base = import.meta.env.BASE_URL;

  // Stable numbering: primary first, then secondary.
  const order = [
    ...primary.map((id) => ({ id, primary: true })),
    ...secondary.map((id) => ({ id, primary: false })),
  ];
  const numOf = new Map(order.map((m, i) => [m.id, i + 1]));

  const figure = (side: Side): JSX.Element => {
    const here = order.filter((m) => WGER_MUSCLES[m.id]?.[1] === side);
    const overlay = (id: number, kind: 'main' | 'secondary'): JSX.Element => (
      <img
        key={`${kind}-${id}`}
        src={`${base}muscles/${kind}/${id}.svg`}
        alt=""
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
    );
    return (
      <div style={{ flex: 1, maxWidth: 168 }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '200 / 369' }}>
          <img
            src={`${base}muscles/${side}.svg`}
            alt={`${side} view`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
          {here.filter((m) => !m.primary).map((m) => overlay(m.id, 'secondary'))}
          {here.filter((m) => m.primary).map((m) => overlay(m.id, 'main'))}
          {here.map((m) => {
            const a = ANCHOR[m.id];
            if (!a) return null;
            return (
              <span
                key={`mk-${m.id}`}
                style={{
                  position: 'absolute',
                  left: `${a[0] * 100}%`,
                  top: `${a[1] * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 17,
                  height: 17,
                  borderRadius: '50%',
                  background: m.primary ? '#e23232' : '#f57900',
                  color: '#fff',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 2px rgba(0,0,0,.55)',
                }}
              >
                {numOf.get(m.id)}
              </span>
            );
          })}
        </div>
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.62rem',
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
    <div>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
        {figure('front')}
        {figure('back')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 12 }}>
        {order.map((m) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 17,
                height: 17,
                borderRadius: '50%',
                flexShrink: 0,
                background: m.primary ? '#e23232' : '#f57900',
                color: '#fff',
                fontSize: '0.6rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {numOf.get(m.id)}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{WGER_MUSCLES[m.id]?.[0]}</span>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: m.primary ? '#e23232' : '#f57900',
                marginLeft: 'auto',
              }}
            >
              {m.primary ? 'Primary' : 'Secondary'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
