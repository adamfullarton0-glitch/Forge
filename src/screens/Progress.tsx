import { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Heatmap } from './progress/Heatmap';
import { LiftCard } from './progress/LiftCard';
import { Achievements } from './progress/Achievements';
import { ExercisePicker } from './progress/ExercisePicker';
import { ProgressPhotos } from './progress/ProgressPhotos';
import { ExerciseModal } from './train/ExerciseModal';
import { useData, useUpdate } from '@/features/store';
import { getUnits, kg2lb, lb2kg, todayKey, weekStartKey } from '@/lib/calc';
import { translator } from '@/lib/i18n';

const MEASURE_FIELDS = ['waist', 'chest', 'arms', 'thighs'] as const;
type MeasureField = (typeof MEASURE_FIELDS)[number];

export function Progress(): JSX.Element | null {
  const data = useData();
  const update = useUpdate();
  const t = translator(data.settings.lang);
  const p = data.profile;

  const [w, setW] = useState('');
  const [meas, setMeas] = useState<Record<MeasureField, string>>({
    waist: '',
    chest: '',
    arms: '',
    thighs: '',
  });
  const [modal, setModal] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);

  if (!p) return null;

  const { wu, hu } = getUnits(p);
  const lu = hu === 'cm' ? 'cm' : 'in';
  const fromCm = (cm: number): number => (lu === 'in' ? Math.round((cm / 2.54) * 10) / 10 : cm);
  const toCm = (v: number): number => (lu === 'in' ? Math.round(v * 2.54 * 10) / 10 : v);
  const showW = (kg: number): number => (wu === 'lb' ? kg2lb(kg) : Math.round(kg * 10) / 10);
  const tk = todayKey();

  const curW = data.weights.length
    ? (data.weights[data.weights.length - 1]?.w ?? p.weight)
    : p.weight;
  const weekStart = weekStartKey();
  const weekCount = data.done.filter((x) => x.d >= weekStart).length;

  // Body-weight chart points (include a synthetic start point if empty).
  const pts = data.weights.length ? [...data.weights] : [{ d: tk, w: p.weight }];
  const allW = [...pts.map((x) => x.w), p.targetWeight];
  const min = Math.min(...allW) - 1;
  const max = Math.max(...allW) + 1;
  const X = (i: number): number => 10 + (i / Math.max(1, pts.length - 1)) * 280;
  const Y = (v: number): number => 8 + (1 - (v - min) / Math.max(0.1, max - min)) * 84;

  const lifts = data.lifts;
  const trackedNames = Object.keys(lifts).filter((n) => (lifts[n] ?? []).length > 0);

  const logWeight = (): void => {
    const val = parseFloat(w);
    if (!Number.isFinite(val) || val <= 0) return;
    const kg = wu === 'lb' ? lb2kg(val) : val;
    update({ weights: [...data.weights.filter((x) => x.d !== tk), { d: tk, w: kg }] });
    setW('');
  };

  const saveMeasure = (): void => {
    const prev = data.measure[tk] ?? {};
    const rec: Record<string, number> = { ...prev };
    for (const f of MEASURE_FIELDS) {
      const v = parseFloat(meas[f]);
      if (Number.isFinite(v) && v > 0) rec[f] = toCm(v);
    }
    update({ measure: { ...data.measure, [tk]: rec } });
    setMeas({ waist: '', chest: '', arms: '', thighs: '' });
  };

  const measureDates = Object.keys(data.measure).sort();
  const latest = measureDates.length
    ? data.measure[measureDates[measureDates.length - 1] ?? '']
    : undefined;
  const firstM = measureDates.length ? data.measure[measureDates[0] ?? ''] : undefined;

  const wk = data.done.filter((x) => x.d >= weekStart);
  const wkVol = wk.reduce((s, x) => s + (x.vol ?? 0), 0);
  const wkSets = wk.reduce((s, x) => s + (x.sets ?? 0), 0);
  const muscles: Record<string, number> = {};
  wk.forEach((x) =>
    Object.entries(x.muscles ?? {}).forEach(([k, v]) => (muscles[k] = (muscles[k] ?? 0) + v)),
  );
  const muscleRows = Object.entries(muscles).sort((a, b) => b[1] - a[1]);
  const maxM = muscleRows.length ? (muscleRows[0]?.[1] ?? 1) : 1;
  const volShow =
    wu === 'lb' ? Math.round(kg2lb(wkVol)).toLocaleString() : Math.round(wkVol).toLocaleString();

  return (
    <div className="screen">
      <h1 className="screen__title">{t('progress')}</h1>

      {/* Body weight */}
      <span className="pulse-header">{t('bodyW')}</span>
      <Card style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div className="stat-label">{t('current')}</div>
            <div className="pulse-stat" style={{ fontSize: '1.4rem' }}>
              {showW(curW)} {wu}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="stat-label">{t('target')}</div>
            <div className="pulse-stat" style={{ fontSize: '1.4rem', color: 'var(--accent)' }}>
              {showW(p.targetWeight)} {wu}
            </div>
          </div>
        </div>
        <svg viewBox="0 0 300 100" style={{ width: '100%', height: 100 }} aria-hidden="true">
          <line
            x1="10"
            x2="290"
            y1={Y(p.targetWeight)}
            y2={Y(p.targetWeight)}
            stroke="var(--accent)"
            strokeDasharray="5 4"
            strokeWidth="1.5"
            opacity="0.7"
          />
          <polyline
            fill="none"
            stroke="var(--text)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={pts.map((x, i) => `${X(i)},${Y(x.w)}`).join(' ')}
          />
          {pts.map((x, i) => (
            <circle key={i} cx={X(i)} cy={Y(x.w)} r="3.5" fill="var(--accent)" />
          ))}
        </svg>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            aria-label={`${t('weightL')} (${wu})`}
            placeholder={`${t('weightL')} (${wu})`}
            value={w}
            onChange={(e) => setW(e.target.value)}
          />
          <Button onClick={logWeight} disabled={!w}>
            {t('logW')}
          </Button>
        </div>
      </Card>

      {/* Measurements */}
      <span className="pulse-header" style={{ display: 'block', marginTop: 22 }}>
        {t('measurements')}
      </span>
      <Card style={{ marginTop: 12 }}>
        {latest ? (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {MEASURE_FIELDS.filter((f) => latest[f] != null).map((f) => {
              const lv = latest[f] ?? 0;
              const fv = firstM?.[f];
              const d = fv != null ? lv - fv : 0;
              return (
                <div
                  key={f}
                  style={{
                    flex: '1 0 40%',
                    background: 'var(--panel-2)',
                    borderRadius: 10,
                    padding: '8px 10px',
                  }}
                >
                  <div className="stat-label">{t(f)}</div>
                  <div className="pulse-stat" style={{ fontSize: '1rem' }}>
                    {fromCm(lv)}
                    <span className="stat-label"> {lu}</span>
                    {d !== 0 ? (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          color: d < 0 ? 'var(--accent)' : 'var(--muted)',
                        }}
                      >
                        {' '}
                        {d < 0 ? '▼' : '▲'}
                        {fromCm(Math.abs(d))}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {MEASURE_FIELDS.map((f) => (
            <input
              key={f}
              className="input"
              style={{ flex: '1 0 40%', padding: '10px' }}
              type="number"
              inputMode="decimal"
              aria-label={`${t(f)} (${lu})`}
              placeholder={`${t(f)} (${lu})`}
              value={meas[f]}
              onChange={(e) => setMeas({ ...meas, [f]: e.target.value })}
            />
          ))}
        </div>
        <Button
          onClick={saveMeasure}
          disabled={MEASURE_FIELDS.every((f) => !meas[f])}
          style={{ width: '100%' }}
        >
          {t('saveM')}
        </Button>
      </Card>

      {/* Progress photos */}
      <ProgressPhotos curWeightKg={curW} />

      {/* Lift progress */}
      <span className="pulse-header" style={{ display: 'block', marginTop: 22 }}>
        {t('liftProgress')}
      </span>
      <p className="state__msg" style={{ textAlign: 'left', margin: '6px 0 12px' }}>
        {t('liftSub')}
      </p>
      {trackedNames.length === 0 ? (
        <Card style={{ textAlign: 'center' }}>
          <div className="state__msg" style={{ marginBottom: 14 }}>
            {t('noLifts')}
          </div>
          <Button onClick={() => setPicker(true)}>{t('trackLift')}</Button>
        </Card>
      ) : (
        <>
          {trackedNames.map((n) => (
            <LiftCard key={n} name={n} lifts={lifts[n] ?? []} wu={wu} onOpen={() => setModal(n)} />
          ))}
          <Button variant="ghost" onClick={() => setPicker(true)} style={{ width: '100%' }}>
            {t('trackLift')}
          </Button>
        </>
      )}

      {/* Consistency */}
      <span className="pulse-header" style={{ display: 'block', marginTop: 22 }}>
        {t('consistency')}
      </span>
      <p className="state__msg" style={{ textAlign: 'left', margin: '6px 0 12px' }}>
        {t('last12')}
      </p>
      <Heatmap done={data.done} />

      {/* Session log */}
      <span className="pulse-header" style={{ display: 'block', marginTop: 22 }}>
        {t('sessionLog')}
      </span>
      <p className="state__msg" style={{ textAlign: 'left', margin: '6px 0 12px' }}>
        {t('sessionSub')}
      </p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <Card style={{ flex: 1, textAlign: 'center' }}>
          <div className="pulse-stat" style={{ fontSize: '1.4rem' }}>
            {weekCount}
          </div>
          <div className="stat-label">{t('week')}</div>
        </Card>
        <Card style={{ flex: 1, textAlign: 'center' }}>
          <div className="pulse-stat" style={{ fontSize: '1.4rem' }}>
            {data.done.length}
          </div>
          <div className="stat-label">{t('total')}</div>
        </Card>
      </div>
      {wkVol > 0 || muscleRows.length > 0 ? (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: muscleRows.length ? 14 : 0 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div className="pulse-stat" style={{ fontSize: '1.25rem' }}>
                {volShow}
              </div>
              <div className="stat-label">
                {t('weeklyVol')} ({wu})
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div className="pulse-stat" style={{ fontSize: '1.25rem' }}>
                {wkSets}
              </div>
              <div className="stat-label">sets</div>
            </div>
          </div>
          {muscleRows.length > 0 ? (
            <>
              <div className="stat-label" style={{ marginBottom: 8 }}>
                {t('muscleSplit')}
              </div>
              {muscleRows.map(([k, v]) => (
                <div
                  key={k}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}
                >
                  <div
                    style={{
                      width: 90,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {k}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      background: 'var(--panel-2)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${(v / maxM) * 100}%`,
                        height: '100%',
                        background: 'var(--accent)',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 22,
                      textAlign: 'right',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--muted)',
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </>
          ) : null}
        </Card>
      ) : null}
      {data.done.length === 0 ? (
        <div className="state__msg" style={{ textAlign: 'left' }}>
          {t('noHistYet')}
        </div>
      ) : (
        [...data.done]
          .reverse()
          .slice(0, 12)
          .map((x, i) => (
            <Card
              key={i}
              style={{
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontWeight: 700 }}>{x.day}</div>
              <div className="state__msg" style={{ margin: 0 }}>
                {x.d}
              </div>
            </Card>
          ))
      )}

      {/* Achievements */}
      <span className="pulse-header" style={{ display: 'block', marginTop: 22 }}>
        {t('achievements')}
      </span>
      <div style={{ marginTop: 12 }}>
        <Achievements data={data} />
      </div>
      <div style={{ height: 8 }} />

      {modal ? (
        <ExerciseModal key={modal} name={modal} onClose={() => setModal(null)} onOpen={setModal} />
      ) : null}
      {picker ? (
        <ExercisePicker
          lang={data.settings.lang}
          tracked={trackedNames}
          onClose={() => setPicker(false)}
          onPick={(n) => {
            setPicker(false);
            setModal(n);
          }}
        />
      ) : null}
    </div>
  );
}
