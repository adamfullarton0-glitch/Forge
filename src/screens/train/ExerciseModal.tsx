import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { useData, useUpdate } from '@/features/store';
import { getExercise, ytSearch } from '@/features/workouts/exercises';
import { exerciseFrames, hasExerciseImage } from '@/features/workouts/media';
import { MuscleMap } from './MuscleMap';
import { EQUIPMENT, DEFAULT_GEAR } from '@/features/workouts/plans';
import { getUnits, kg2lb, lb2kg, platesFor, todayKey } from '@/lib/calc';

interface ExerciseModalProps {
  name: string;
  onClose: () => void;
  /** Swap to an alternative exercise (keeps the modal open on the new one). */
  onOpen?: (name: string) => void;
}

const equipLabel = (id: string): string =>
  (EQUIPMENT.find((e) => e[0] === id)?.[1] ?? id).toLowerCase();

export function ExerciseModal({ name, onClose, onOpen }: ExerciseModalProps): JSX.Element | null {
  const data = useData();
  const update = useUpdate();
  const ex = getExercise(name);

  const [play, setPlay] = useState(false);
  const [demoFailed, setDemoFailed] = useState(false);
  const [w, setW] = useState('');
  const [hit, setHit] = useState(false);

  if (!ex) return null;

  const { wu } = getUnits(data.profile ?? {});
  const lifts = data.lifts[name] ?? [];
  const last = lifts[lifts.length - 1];
  const showW = (kg: number): number =>
    wu === 'lb' ? Math.round(kg2lb(kg) * 2) / 2 : Math.round(kg * 2) / 2;
  const inc = ex.lower ? 5 : 2.5;
  const due = last?.hit ?? false;
  const gear = data.gear.length ? data.gear : DEFAULT_GEAR;
  const missing = ex.eq.filter((e) => !gear.includes(e));

  const saveLift = (): void => {
    const val = parseFloat(w);
    if (!Number.isFinite(val) || val <= 0) return;
    const kg = wu === 'lb' ? lb2kg(val) : val;
    const arr = [...lifts, { d: todayKey(), w: Math.round(kg * 100) / 100, hit }].slice(-20);
    update({ lifts: { ...data.lifts, [name]: arr } });
    setW('');
    setHit(false);
  };

  const plateTarget = w
    ? wu === 'lb'
      ? lb2kg(parseFloat(w) || 0)
      : parseFloat(w) || 0
    : (last?.w ?? 0);
  const plates = platesFor(plateTarget);

  return (
    <Modal onClose={onClose} label={`${name} details`}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{name}</div>
          <div className="state__msg" style={{ textAlign: 'left', margin: '3px 0 0' }}>
            {ex.m} · <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{ex.sr}</span>
          </div>
        </div>
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Movement demo: a two-frame (start → finish) "how to perform it" diagram
          from bundled, license-clean photos (offline); the YouTube thumbnail as
          a fallback; and the real video one tap away. */}
      <div style={{ margin: '14px 0 16px' }}>
        {play && ex.vid ? (
          <>
            <div className="ex-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${ex.vid}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
                title={`${name} tutorial`}
                loading="lazy"
                // Without a referrer YouTube's player throws "Error 153"; this
                // guarantees a valid origin even under a strict page policy.
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <button type="button" className="ex-inline-toggle" onClick={() => setPlay(false)}>
              ← Back to demo
            </button>
          </>
        ) : (
          <>
            {hasExerciseImage(name) && !demoFailed ? (
              <div className="ex-frames">
                {(['start', 'finish'] as const).map((phase) => (
                  <div key={phase} className="ex-frame">
                    <img
                      src={exerciseFrames(name)[phase]}
                      alt={`${name} — ${phase} position`}
                      loading="lazy"
                      onError={() => setDemoFailed(true)}
                    />
                    <span className="ex-frame__tag">{phase === 'start' ? 'Start' : 'Finish'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ex-demo">
                {ex.vid && !demoFailed ? (
                  <img
                    className="ex-demo__img"
                    src={`https://i.ytimg.com/vi/${ex.vid}/hqdefault.jpg`}
                    alt=""
                    loading="lazy"
                    onError={() => setDemoFailed(true)}
                  />
                ) : (
                  <div className="ex-demo__ph">
                    <Icon name="dumbbell" size={40} style={{ color: 'var(--accent)' }} />
                  </div>
                )}
              </div>
            )}
            {ex.vid ? (
              <button type="button" className="ex-inline-toggle" onClick={() => setPlay(true)}>
                ▶ Watch the video tutorial
              </button>
            ) : (
              <a
                className="ex-inline-toggle"
                href={ytSearch(name)}
                target="_blank"
                rel="noreferrer"
              >
                Watch a video on YouTube ↗
              </a>
            )}
          </>
        )}
      </div>

      {/* Muscles worked — a highlighted body diagram (primary in accent). */}
      <div className="ex-muscles">
        <div className="ex-modal__label" style={{ marginTop: 0 }}>
          Muscles worked
        </div>
        <MuscleMap name={name} />
      </div>

      {missing.length > 0 ? (
        <div className="warn-box" style={{ marginBottom: 14 }}>
          Needs <b>{missing.map(equipLabel).join(', ')}</b> — not in your equipment list.
          {ex.alt.length > 0 ? ' Use a swap below.' : ''}
        </div>
      ) : null}

      {due && last ? (
        <div
          className="warn-box"
          style={{
            marginBottom: 14,
            background: 'var(--accent-soft)',
            borderColor: 'var(--accent)',
          }}
        >
          Time to add weight — you hit the top of the rep range last time. Load{' '}
          <b style={{ color: 'var(--accent)' }}>
            {showW(last.w + inc)} {wu}
          </b>{' '}
          today.
        </div>
      ) : null}

      {ex.att ? (
        <div style={{ marginBottom: 16 }}>
          <div className="ex-modal__label">Attachment</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ex.att.map((a, i) => {
              const chosen = (data.attachments[name] ?? ex.att?.[0]) === a;
              return (
                <button
                  key={a}
                  type="button"
                  className="ob-opt"
                  aria-pressed={chosen}
                  onClick={() => update({ attachments: { ...data.attachments, [name]: a } })}
                  style={{
                    fontSize: '0.8rem',
                    padding: '9px 13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ flex: 1 }}>{a}</span>
                  {i === 0 ? (
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--accent)',
                        background: 'var(--accent-soft)',
                        borderRadius: 6,
                        padding: '2px 7px',
                        flexShrink: 0,
                      }}
                    >
                      Suggested
                    </span>
                  ) : null}
                  {chosen ? (
                    <span style={{ color: 'var(--accent)', fontWeight: 900, flexShrink: 0 }}>
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="ex-modal__label">How to do it</div>
      {ex.steps.map((s, i) => (
        <div key={i} className="ex-step">
          <div className="ex-step__num">{i + 1}</div>
          <div>{s}</div>
        </div>
      ))}
      <div
        className="warn-box"
        style={{
          background: 'var(--panel-2)',
          borderColor: 'var(--glass-border)',
          margin: '12px 0 18px',
        }}
      >
        <span style={{ color: 'var(--accent)', fontWeight: 800 }}>Coach&apos;s tip: </span>
        {ex.tip}
      </div>

      {/* Log working weight */}
      <div className="ex-modal__label">Log today&apos;s working weight</div>
      {last ? (
        <div className="state__msg" style={{ textAlign: 'left', marginBottom: 8 }}>
          Last:{' '}
          <b style={{ color: 'var(--text)' }}>
            {showW(last.w)} {wu}
          </b>{' '}
          · {last.d}
          {last.hit ? ' · hit top reps ✓' : ''}
        </div>
      ) : null}
      <div
        style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}
      >
        <input
          className="input"
          style={{ width: 110 }}
          type="number"
          inputMode="decimal"
          aria-label={`Working weight in ${wu}`}
          placeholder={wu}
          value={w}
          onChange={(e) => setW(e.target.value)}
        />
        <span style={{ color: 'var(--muted)', fontWeight: 700 }}>{wu}</span>
        <Button onClick={saveLift}>Log</Button>
      </div>
      <label
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: 8,
        }}
      >
        <input
          type="checkbox"
          checked={hit}
          onChange={(e) => setHit(e.target.checked)}
          style={{ width: 16, height: 16 }}
        />
        I hit the top of the rep range on every set
      </label>
      <div
        className="state__msg"
        style={{ textAlign: 'left', fontSize: '0.72rem', marginBottom: 18 }}
      >
        Tick that and FORGE will tell you to add {ex.lower ? '5 kg / 10 lb' : '2.5 kg / 5 lb'} next
        session — double progression, the way coaches program it.
      </div>

      {ex.eq.includes('barbell') ? (
        <div style={{ marginBottom: 18 }}>
          <div className="ex-modal__label">
            Plates per side{' '}
            <span
              style={{
                color: 'var(--muted)',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              · {plateTarget > 0 ? `${showW(plateTarget)} ${wu}` : 'enter a weight'}
            </span>
          </div>
          {plateTarget <= 0 ? (
            <div className="state__msg" style={{ textAlign: 'left' }}>
              —
            </div>
          ) : plates.length === 0 ? (
            <div className="state__msg" style={{ textAlign: 'left' }}>
              Just the bar
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {plates.map((pl, i) => (
                <div key={i} className="plate">
                  {wu === 'lb' ? Math.round(kg2lb(pl) * 2) / 2 : pl}
                </div>
              ))}
              <span className="state__msg" style={{ margin: 0 }}>
                × per side
              </span>
            </div>
          )}
        </div>
      ) : null}

      {ex.alt.length > 0 ? (
        <div>
          <div className="ex-modal__label">Swap / alternatives</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ex.alt.map((a) => (
              <Chip key={a} label={`${a} →`} onClick={() => onOpen?.(a)} />
            ))}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
