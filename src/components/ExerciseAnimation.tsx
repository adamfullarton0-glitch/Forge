import { MOVE_LABEL, type MoveType } from '@/features/workouts/animation';

/**
 * A looping, ad-free SVG demo of a lift. The figure is side-on, so every
 * movement is a single in-plane rotation animated with SMIL `animateTransform`
 * (no JS, CSP-safe). Joints: shoulder, elbow, hip, knee, plus a torso lean and
 * a whole-figure rise/drop. Keyframes are [rest, work, rest].
 */

// Joint pivots (viewBox 0 0 100 132), profile facing right.
const HIP: [number, number] = [50, 72];
const KNEE: [number, number] = [50, 96];
const SHOULDER: [number, number] = [52, 40];
const ELBOW: [number, number] = [52, 60];

interface Rig {
  dur: number;
  lift?: number[]; // figure translateY
  body?: number[]; // torso+head+arm rotate about hip
  arm?: number[]; // upper arm rotate about shoulder
  fore?: number[]; // forearm rotate about elbow
  thigh?: number[]; // leg rotate about hip
  shin?: number[]; // shin rotate about knee
}

const RIGS: Record<MoveType, Rig> = {
  squat: {
    dur: 2.6,
    lift: [0, 12, 0],
    thigh: [0, -42, 0],
    shin: [0, 42, 0],
    body: [0, 12, 0],
    arm: [0, 6, 0],
  },
  hinge: {
    dur: 2.8,
    body: [0, 70, 0],
    thigh: [0, -10, 0],
    shin: [0, 10, 0],
    arm: [0, 8, 0],
    lift: [0, 4, 0],
  },
  pressUp: { dur: 2.4, arm: [0, -162, 0], fore: [0, -8, 0] },
  pressFwd: { dur: 2.2, arm: [-80, -80, -80], fore: [85, 0, 85] },
  pullDown: { dur: 2.4, arm: [-160, -96, -160], fore: [0, 42, 0] },
  row: { dur: 2.2, arm: [4, 26, 4], fore: [6, 84, 6] },
  curl: { dur: 2.2, arm: [0, 6, 0], fore: [0, -125, 0] },
  raise: { dur: 2.4, arm: [0, -86, 0] },
  pushdown: { dur: 2.0, arm: [10, 10, 10], fore: [-110, -6, -110] },
  calf: { dur: 1.8, lift: [0, -9, 0] },
  core: {
    dur: 4,
    body: [80, 82, 80],
    arm: [-70, -72, -70],
    thigh: [-80, -82, -80],
    lift: [8, 10, 8],
  },
};

const EASE = '0.42 0 0.58 1;0.42 0 0.58 1';
const TIMES = '0;0.5;1';

const rotVals = (angles: number[], [cx, cy]: [number, number]): string =>
  angles.map((a) => `${a} ${cx} ${cy}`).join(';');

function Rotate({ vals, dur }: { vals: string; dur: number }): JSX.Element {
  return (
    <animateTransform
      attributeName="transform"
      attributeType="XML"
      type="rotate"
      values={vals}
      keyTimes={TIMES}
      calcMode="spline"
      keySplines={EASE}
      dur={`${dur}s`}
      repeatCount="indefinite"
    />
  );
}

interface ExerciseAnimationProps {
  type: MoveType;
}

/** Renders the looping movement demo for an exercise archetype. */
export function ExerciseAnimation({ type }: ExerciseAnimationProps): JSX.Element {
  const rig = RIGS[type];
  const stroke = 'var(--accent)';
  const common = {
    stroke,
    strokeWidth: 4,
    strokeLinecap: 'round' as const,
    fill: 'none',
  };

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 14,
        border: '1px solid var(--glass-border)',
        background: 'radial-gradient(120% 120% at 50% 20%, var(--accent-soft), var(--panel-2) 70%)',
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox="0 0 100 132"
        width="100%"
        style={{ display: 'block', maxHeight: 230, margin: '0 auto' }}
        role="img"
        aria-label={`${MOVE_LABEL[type]} movement animation`}
      >
        <title>{`${MOVE_LABEL[type]} movement animation`}</title>
        {/* Ground */}
        <line x1="22" y1="119" x2="78" y2="119" stroke="var(--glass-border)" strokeWidth={2} />

        <g>
          {rig.lift ? (
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="translate"
              values={rig.lift.map((d) => `0 ${d}`).join(';')}
              keyTimes={TIMES}
              calcMode="spline"
              keySplines={EASE}
              dur={`${rig.dur}s`}
              repeatCount="indefinite"
            />
          ) : null}

          {/* Leg (thigh → shin → foot), pivots at hip + knee */}
          <g>
            {rig.thigh ? <Rotate vals={rotVals(rig.thigh, HIP)} dur={rig.dur} /> : null}
            <line x1={HIP[0]} y1={HIP[1]} x2={KNEE[0]} y2={KNEE[1]} {...common} />
            <g>
              {rig.shin ? <Rotate vals={rotVals(rig.shin, KNEE)} dur={rig.dur} /> : null}
              <line x1={KNEE[0]} y1={KNEE[1]} x2="50" y2="118" {...common} />
              <line x1="50" y1="118" x2="59" y2="118" {...common} />
            </g>
          </g>

          {/* Body (torso + head + arm), pivot at hip */}
          <g>
            {rig.body ? <Rotate vals={rotVals(rig.body, HIP)} dur={rig.dur} /> : null}
            <line x1={HIP[0]} y1={HIP[1]} x2="52" y2="32" {...common} />
            <circle cx="54" cy="24" r="6.5" {...common} />
            <g>
              {rig.arm ? <Rotate vals={rotVals(rig.arm, SHOULDER)} dur={rig.dur} /> : null}
              <line x1={SHOULDER[0]} y1={SHOULDER[1]} x2={ELBOW[0]} y2={ELBOW[1]} {...common} />
              <g>
                {rig.fore ? <Rotate vals={rotVals(rig.fore, ELBOW)} dur={rig.dur} /> : null}
                <line x1={ELBOW[0]} y1={ELBOW[1]} x2="52" y2="78" {...common} />
                <circle cx="52" cy="78" r="4" fill={stroke} stroke="none" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
