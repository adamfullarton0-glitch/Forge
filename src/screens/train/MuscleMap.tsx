import { GROUPS, exerciseGroups, type Side, type WorkedGroup } from '@/features/workouts/musclemap';

/**
 * Anatomical "muscles worked" diagram: highlights an exercise's muscles in red
 * (primary) / orange (secondary) on the bundled wger front + back figures
 * (CC-BY-SA 3.0, see public/muscles/CREDITS.md), with a numbered arrow pointing
 * to each muscle and a plain-English legend.
 */
export function MuscleMap({ name }: { name: string }): JSX.Element | null {
  const worked = exerciseGroups(name);
  if (worked.length === 0) return null;
  const base = import.meta.env.BASE_URL;
  const numOf = new Map(worked.map((w, i) => [w.id, i + 1]));
  const RED = '#e23232';
  const ORANGE = '#f57900';

  const figure = (side: Side): JSX.Element => {
    const here = worked.filter((w) => GROUPS[w.id].side === side);
    const overlay = (id: number, kind: 'main' | 'secondary'): JSX.Element => (
      <img
        key={`${kind}-${id}`}
        src={`${base}muscles/${kind}/${id}.svg`}
        alt=""
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
    );

    // Lay the numbered labels down each side, spaced so they never overlap.
    const place = (
      items: WorkedGroup[],
      labelX: number,
    ): Array<{ w: WorkedGroup; y: number; labelX: number }> => {
      let last = -100;
      return [...items]
        .sort((a, b) => GROUPS[a.id].anchor[1] - GROUPS[b.id].anchor[1])
        .map((w) => {
          const y = Math.min(94, Math.max(8, Math.max(GROUPS[w.id].anchor[1] * 100, last + 15)));
          last = y;
          return { w, y, labelX };
        });
    };
    const left = place(
      here.filter((w) => GROUPS[w.id].anchor[0] < 0.5),
      5,
    );
    const right = place(
      here.filter((w) => GROUPS[w.id].anchor[0] >= 0.5),
      95,
    );
    const labels = [...left, ...right];

    return (
      <div style={{ flex: 1, maxWidth: 176 }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '200 / 369' }}>
          <img
            src={`${base}muscles/${side}.svg`}
            alt={`${side} view`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
          {here
            .filter((w) => !w.primary)
            .flatMap((w) => GROUPS[w.id].overlays.map((id) => overlay(id, 'secondary')))}
          {here
            .filter((w) => w.primary)
            .flatMap((w) => GROUPS[w.id].overlays.map((id) => overlay(id, 'main')))}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              overflow: 'visible',
            }}
            aria-hidden="true"
          >
            {labels.map(({ w, y, labelX }) => {
              const [ax, ay] = GROUPS[w.id].anchor;
              const color = w.primary ? RED : ORANGE;
              const tx = labelX < 50 ? labelX + 3 : labelX - 3;
              return (
                <g key={w.id}>
                  <line
                    x1={tx}
                    y1={y}
                    x2={ax * 100}
                    y2={ay * 100}
                    stroke={color}
                    strokeWidth={0.9}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx={ax * 100} cy={ay * 100} r={1.4} fill={color} />
                  <circle cx={labelX} cy={y} r={4.2} fill={color} />
                  <text
                    x={labelX}
                    y={y}
                    fill="#fff"
                    fontSize={5}
                    fontWeight={800}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {numOf.get(w.id)}
                  </text>
                </g>
              );
            })}
          </svg>
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
    <div>
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center' }}>
        {figure('front')}
        {figure('back')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
        {worked.map((w) => (
          <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                flexShrink: 0,
                background: w.primary ? RED : ORANGE,
                color: '#fff',
                fontSize: '0.62rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {numOf.get(w.id)}
            </span>
            <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>{GROUPS[w.id].label}</span>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: w.primary ? RED : ORANGE,
                marginLeft: 'auto',
              }}
            >
              {w.primary ? 'Primary' : 'Secondary'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
