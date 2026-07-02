interface RingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  /** Progress colour. Defaults to the current accent. */
  color?: string;
  /** Small uppercase label under the number. */
  sub?: string;
  /** Font size for the centre number. */
  numberSize?: number;
}

/**
 * A circular progress ring with a mono numeral in the centre. Going over `max`
 * turns the ring red. Pure presentational; safe against zero/negative `max`.
 */
export function Ring({
  value,
  max,
  size = 132,
  stroke = 13,
  color = 'var(--accent)',
  sub,
  numberSize,
}: RingProps): JSX.Element {
  const safeValue = Number.isFinite(value) ? value : 0;
  const safeMax = Number.isFinite(max) && max > 0 ? max : 1;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, safeValue / safeMax));
  const danger = safeValue > safeMax;
  const ringColor = danger ? '#FF5C5C' : color;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--panel-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          className="pulse-stat"
          style={{ fontSize: numberSize ?? size * 0.26, fontWeight: 800, lineHeight: 1 }}
        >
          {Math.round(safeValue)}
        </span>
        {sub ? (
          <span
            style={{
              fontSize: size * 0.1,
              fontWeight: 700,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: 2,
            }}
          >
            {sub}
          </span>
        ) : null}
      </div>
    </div>
  );
}
