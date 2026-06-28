interface RestTimerProps {
  seconds: number;
  label: string;
  skipLabel: string;
  onAdjust: (delta: number) => void;
  onSkip: () => void;
}

/** A fixed bottom rest-timer pill with quick ±15s adjust and skip. */
export function RestTimer({
  seconds,
  label,
  skipLabel,
  onAdjust,
  onSkip,
}: RestTimerProps): JSX.Element {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <div className="rest-timer" role="timer" aria-live="off">
      <span className="rest-timer__label">{label}</span>
      <span
        className="rest-timer__clock"
        aria-label={`${label}: ${m > 0 ? `${m} min ` : ''}${s} sec remaining`}
      >
        {m}:{String(s).padStart(2, '0')}
      </span>
      <div className="rest-timer__actions">
        <button type="button" onClick={() => onAdjust(-15)} aria-label="Subtract 15 seconds">
          −15
        </button>
        <button type="button" onClick={() => onAdjust(15)} aria-label="Add 15 seconds">
          +15
        </button>
        <button type="button" className="rest-timer__skip" onClick={onSkip}>
          {skipLabel}
        </button>
      </div>
    </div>
  );
}
