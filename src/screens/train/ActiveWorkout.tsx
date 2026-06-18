import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { RestTimer } from './RestTimer';
import { ExerciseModal } from './ExerciseModal';
import { useData, useUpdate } from '@/features/store';
import { getPlan, planSr, resolvePlanId, EQUIPMENT, DEFAULT_GEAR } from '@/features/workouts/plans';
import { getExercise } from '@/features/workouts/exercises';
import { translator } from '@/lib/i18n';
import { e1rm, getUnits, kg2lb, lb2kg, todayKey, topRepOf } from '@/lib/calc';
import type { ActiveWorkout as ActiveState } from '@/types/schemas';

type SetEntry = { w: string | number; reps: string | number; done: boolean };

const REST_SECONDS = 120;
const equipLabel = (id: string): string => EQUIPMENT.find((e) => e[0] === id)?.[1] ?? id;

function beep(): void {
  try {
    const Ctor =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.32);
    setTimeout(() => void ctx.close(), 500);
  } catch {
    // No audio available (tests, locked-down browsers) — silently skip.
  }
}

export function ActiveWorkout({ active }: { active: ActiveState }): JSX.Element {
  const data = useData();
  const update = useUpdate();
  const navigate = useNavigate();
  const t = translator(data.settings.lang);

  const [modal, setModal] = useState<string | null>(null);
  const [rest, setRest] = useState(0);

  // One ticking interval for the component's life; only counts down when armed.
  useEffect(() => {
    const id = setInterval(() => {
      setRest((r) => {
        if (r <= 0) return 0;
        if (r <= 1) {
          beep();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const plan = getPlan(data.planId, data.customPlans);
  const day = plan.days[Math.min(active.day, plan.days.length - 1)];
  const swaps = active.swaps;
  const sets = active.sets ?? {};
  const { wu } = getUnits(data.profile ?? {});
  const gear = data.gear.length ? data.gear : DEFAULT_GEAR;

  const showW = (kg: number): number =>
    wu === 'lb' ? Math.round(kg2lb(kg) * 2) / 2 : Math.round(kg * 2) / 2;
  const kgOf = (v: string | number): number => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return wu === 'lb' ? lb2kg(n) : n;
  };

  // Defensive: an empty/corrupt plan can't produce a day. Never dead-end —
  // always offer a way to clear the broken session.
  if (!day) {
    return (
      <div className="screen">
        <h1 className="screen__title">Workout</h1>
        <Card>
          <div className="state__msg" style={{ marginBottom: 14 }}>
            This session can&apos;t be opened — its plan has no exercises.
          </div>
          <Button onClick={() => update({ active: null })} style={{ width: '100%' }}>
            {t('discard')}
          </Button>
        </Card>
      </div>
    );
  }

  const setSets = (orig: string, arr: SetEntry[]): void => {
    update({ active: { ...active, sets: { ...sets, [orig]: arr } } });
  };

  const seedSets = (nm: string): SetEntry[] => {
    const history = data.lifts[nm] ?? [];
    const last = history[history.length - 1];
    const w = last ? showW(last.w) : '';
    const reps = topRepOf(planSr(plan, nm));
    return [0, 1, 2].map(() => ({ w, reps, done: false }));
  };

  const doneCount = day.ex.filter((o) => (sets[o] ?? []).some((x) => x.done)).length;

  const finish = (): void => {
    const lifts = { ...data.lifts };
    let totalVol = 0;
    let totalSets = 0;
    const muscles: Record<string, number> = {};
    for (const orig of day.ex) {
      const nm = swaps[orig] ?? orig;
      const ex = getExercise(nm);
      const done = (sets[orig] ?? []).filter((x) => x.done && Number(x.reps) > 0);
      if (done.length === 0) continue;
      const mg = (ex?.m ?? '').split('·')[0]?.trim() || 'Other';
      muscles[mg] = (muscles[mg] ?? 0) + done.length;
      totalSets += done.length;
      for (const x of done) {
        if (Number(x.w) > 0) totalVol += kgOf(x.w) * Number(x.reps);
      }
      const weighted = done.filter((x) => Number(x.w) > 0);
      if (weighted.length > 0) {
        const top = weighted.reduce((a, b) =>
          e1rm(kgOf(a.w), Number(a.reps)) >= e1rm(kgOf(b.w), Number(b.reps)) ? a : b,
        );
        const topKg = kgOf(top.w);
        const hit = Number(top.reps) >= topRepOf(planSr(plan, nm));
        lifts[nm] = [
          ...(lifts[nm] ?? []),
          {
            d: todayKey(),
            w: Math.round(topKg * 100) / 100,
            reps: Number(top.reps),
            e1rm: e1rm(topKg, Number(top.reps)),
            hit,
          },
        ].slice(-30);
      }
    }
    update({
      lifts,
      active: null,
      done: [
        ...data.done,
        {
          d: todayKey(),
          // Record the plan actually used (the active id may have been deleted
          // and resolved to the default), so the session log stays accurate.
          plan: resolvePlanId(data.planId, data.customPlans),
          day: day.name,
          vol: Math.round(totalVol),
          sets: totalSets,
          muscles,
        },
      ],
    });
    navigate('/');
  };

  return (
    <div className="screen">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {t('saveExit')}
        </button>
        <button
          type="button"
          onClick={() => update({ active: null })}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('discard')}
        </button>
      </div>
      <h1 className="screen__title">{day.name}</h1>
      <p className="screen__lede">
        {day.focus} ·{' '}
        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{t('inProgress')}</span>
      </p>

      {day.ex.map((orig) => {
        const nm = swaps[orig] ?? orig;
        const ex = getExercise(nm);
        const missing = (ex?.eq ?? []).filter((e) => !gear.includes(e));
        const swapTo = missing.length
          ? (ex?.alt ?? []).find((al) => (getExercise(al)?.eq ?? []).every((e) => gear.includes(e)))
          : undefined;
        const exSets = sets[orig] ?? seedSets(nm);
        const history = data.lifts[nm] ?? [];
        const lastEntry = history[history.length - 1];
        const prevBestE = history.reduce(
          (mx, x) => Math.max(mx, x.e1rm ?? e1rm(x.w, x.reps ?? 1)),
          0,
        );
        const doneSets = exSets.filter((x) => x.done && Number(x.w) > 0 && Number(x.reps) > 0);
        const curBestE = doneSets.reduce(
          (mx, x) => Math.max(mx, e1rm(kgOf(x.w), Number(x.reps))),
          0,
        );
        const isPR = curBestE > 0 && curBestE > prevBestE;

        const updateSet = (i: number, key: 'w' | 'reps', v: string): void =>
          setSets(
            orig,
            exSets.map((x, j) => (j === i ? { ...x, [key]: v } : x)),
          );
        const toggleSet = (i: number): void => {
          const wasDone = exSets[i]?.done ?? false;
          setSets(
            orig,
            exSets.map((x, j) => (j === i ? { ...x, done: !x.done } : x)),
          );
          if (!wasDone) setRest(REST_SECONDS);
        };

        return (
          <Card key={orig} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => setModal(nm)}
                style={{
                  flex: 1,
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <div style={{ fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}>
                  {nm} {isPR ? <span className="pr-badge">{t('newPR')}</span> : null}
                </div>
                <div className="state__msg" style={{ textAlign: 'left', margin: '2px 0 0' }}>
                  {ex?.m} ·{' '}
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                    {planSr(plan, nm)}
                  </span>
                  {curBestE > 0 ? (
                    <>
                      {' '}
                      · {t('e1rmL')} {showW(curBestE)}
                      {wu}
                    </>
                  ) : null}
                </div>
              </button>
            </div>

            {missing.length > 0 ? (
              <div
                style={{
                  marginBottom: 10,
                  fontSize: '0.75rem',
                  color: '#F5A623',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                No {missing.map(equipLabel).join(' / ').toLowerCase()}
                {swapTo ? (
                  <Chip
                    label={`Swap → ${swapTo}`}
                    onClick={() =>
                      update({ active: { ...active, swaps: { ...swaps, [orig]: swapTo } } })
                    }
                  />
                ) : null}
              </div>
            ) : null}

            <div className="set-grid set-grid__head">
              <div className="set-num">{t('set')}</div>
              <div className="set-prev">{t('prev')}</div>
              <div style={{ width: 70, textAlign: 'center' }}>{wu}</div>
              <div style={{ width: 60, textAlign: 'center' }}>{t('reps')}</div>
              <div style={{ width: 36 }} />
            </div>

            {exSets.map((st, i) => {
              const prev = history[history.length - 1];
              const prevTxt = prev ? `${showW(prev.w)}${wu}×${prev.reps ?? '–'}` : '—';
              return (
                <div key={i} className="set-grid">
                  <div className="set-num">{i + 1}</div>
                  <div className="set-prev">{prevTxt}</div>
                  <input
                    className="set-input"
                    type="number"
                    inputMode="decimal"
                    aria-label={`${nm} set ${i + 1} weight`}
                    value={String(st.w)}
                    onChange={(e) => updateSet(i, 'w', e.target.value)}
                  />
                  <input
                    className="set-input set-input--reps"
                    type="number"
                    inputMode="numeric"
                    aria-label={`${nm} set ${i + 1} reps`}
                    value={String(st.reps)}
                    onChange={(e) => updateSet(i, 'reps', e.target.value)}
                  />
                  <button
                    type="button"
                    className="set-check"
                    aria-pressed={st.done}
                    aria-label={`Complete ${nm} set ${i + 1}`}
                    onClick={() => toggleSet(i)}
                  >
                    {st.done ? '✓' : ''}
                  </button>
                </div>
              );
            })}

            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 6,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="add-set"
                onClick={() =>
                  setSets(orig, [
                    ...exSets,
                    {
                      w: exSets[exSets.length - 1]?.w ?? '',
                      reps: topRepOf(planSr(plan, nm)),
                      done: false,
                    },
                  ])
                }
              >
                {t('addSet')}
              </button>
              {exSets.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setSets(orig, exSets.slice(0, -1))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  − remove
                </button>
              ) : null}
              {lastEntry?.hit ? (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: 'var(--accent)',
                  }}
                >
                  try {showW(lastEntry.w + (ex?.lower ? 5 : 2.5))}
                  {wu}
                </span>
              ) : null}
            </div>
          </Card>
        );
      })}

      <div style={{ marginTop: 8, marginBottom: rest > 0 ? 80 : 0 }}>
        <Button onClick={finish} disabled={doneCount === 0} style={{ width: '100%' }}>
          {t('finish')} ({doneCount}/{day.ex.length})
        </Button>
      </div>

      {rest > 0 ? (
        <RestTimer
          seconds={rest}
          label={t('restTimer')}
          skipLabel={t('skip')}
          onAdjust={(d) => setRest((r) => Math.max(0, r + d))}
          onSkip={() => setRest(0)}
        />
      ) : null}

      {modal ? (
        <ExerciseModal name={modal} onClose={() => setModal(null)} onOpen={setModal} />
      ) : null}
    </div>
  );
}
