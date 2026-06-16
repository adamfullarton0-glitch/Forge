interface BarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
}

/** A labelled macro progress bar. Going over target turns red. */
export function Bar({ label, value, max, color, unit = '' }: BarProps): JSX.Element {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 1;
  const safeValue = Number.isFinite(value) ? value : 0;
  const pct = Math.min(100, (safeValue / safeMax) * 100);
  const over = safeValue > safeMax;
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          marginBottom: 4,
        }}
      >
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span style={{ color: over ? '#FF5C5C' : 'var(--muted)', fontWeight: 600 }}>
          {Math.round(safeValue)} / {Math.round(safeMax)}
          {unit}
        </span>
      </div>
      <div
        style={{ height: 9, borderRadius: 99, background: 'var(--panel-2)', overflow: 'hidden' }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: over ? '#FF5C5C' : color,
            borderRadius: 99,
            transition: 'width .3s ease',
          }}
        />
      </div>
    </div>
  );
}
