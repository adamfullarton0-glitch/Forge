import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Ring } from '@/components/Ring';
import { Icon, type IconName } from '@/components/Icon';
import { useData, useUpdate } from '@/features/store';
import { getPlan } from '@/features/workouts/plans';
import { translator } from '@/lib/i18n';
import {
  calcTargets,
  coachInsights,
  computeStreak,
  getUnits,
  kg2lb,
  todayKey,
  dayIdx,
  DAYS,
  seedNum,
} from '@/lib/calc';

const MACROS: ReadonlyArray<{ key: 'p' | 'c' | 'f'; label: string; color: string }> = [
  { key: 'p', label: 'P', color: '#3D8BFF' },
  { key: 'c', label: 'C', color: '#F5A623' },
  { key: 'f', label: 'F', color: '#F0479C' },
];

export function Home(): JSX.Element | null {
  const data = useData();
  const update = useUpdate();
  const navigate = useNavigate();
  const t = translator(data.settings.lang);

  const p = data.profile;
  if (!p) return null; // Layout only renders Home once a profile exists.

  const tg = calcTargets(p);
  const tk = todayKey();
  const plan = getPlan(data.planId);
  const todaySched = data.schedule[String(dayIdx())];
  const todayFoods = data.foodLog[tk] ?? [];
  const eaten = todayFoods.reduce((s, x) => s + (x.kcal || 0), 0);
  const eatenP = todayFoods.reduce((s, x) => s + (x.p || 0), 0);
  const eatenC = todayFoods.reduce((s, x) => s + (x.c || 0), 0);
  const eatenF = todayFoods.reduce((s, x) => s + (x.f || 0), 0);
  const macroValues = { p: eatenP, c: eatenC, f: eatenF };
  const macroTargets = { p: tg.protein, c: tg.carbs, f: tg.fat };

  const { wu } = getUnits(p);
  const curW = data.weights.length
    ? (data.weights[data.weights.length - 1]?.w ?? p.weight)
    : p.weight;
  const diffKg = Math.abs(curW - p.targetWeight);
  const diffShow = wu === 'lb' ? kg2lb(diffKg) : Math.round(diffKg * 10) / 10;
  const streak = computeStreak(data.done);
  const insights = coachInsights(data);
  const doneToday = data.done.some((x) => x.d === tk);
  const water = data.water[tk] ?? 0;

  const startSession = (): void => {
    if (!todaySched) return;
    const day = Math.min(Number(todaySched.day) || 0, plan.days.length - 1);
    update({ active: { day, checked: [], swaps: {} } });
    navigate('/train');
  };

  const setWater = (next: number): void => {
    update({ water: { ...data.water, [tk]: Math.max(0, next) } });
  };

  const upcoming: Array<{ label: string; time: string; name: string }> = [];
  if (data.remind.on) {
    for (let off = 0; off < 7 && upcoming.length < 3; off++) {
      const idx = (dayIdx() + off) % 7;
      const s = data.schedule[String(idx)];
      if (s) {
        const dayLabel = off === 0 ? t('today') : off === 1 ? t('tomorrow') : (DAYS[idx] ?? '');
        upcoming.push({
          label: dayLabel,
          time: s.time,
          name: plan.days[Math.min(Number(s.day) || 0, plan.days.length - 1)]?.name ?? '',
        });
      }
    }
  }

  const tracker = data.pro ? data.devices.filter((d) => d !== 'Withings Smart Scale') : [];
  const syncedStats: ReadonlyArray<[string, string]> = [
    [seedNum(tk + 'steps', 6200, 13400).toLocaleString(), t('steps')],
    [String(seedNum(tk + 'hr', 52, 66)), t('restHR')],
    [String(seedNum(tk + 'burn', 380, 720)), t('burned')],
    [`${Math.round(seedNum(tk + 'slh', 54, 92)) / 10}h`, t('sleep').toLowerCase()],
  ];

  return (
    <div className="screen">
      <header style={{ marginBottom: 16 }}>
        <div style={{ color: 'var(--muted)', fontWeight: 600 }}>{t('greet')}</div>
        <h1 className="screen__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {p.name || 'Athlete'}
          {data.pro ? <span className="pro-badge">PRO</span> : null}
        </h1>
      </header>

      <div className="stack">
        {/* Today's session */}
        <Card
          style={
            data.active || todaySched
              ? { borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)' }
              : undefined
          }
        >
          <span className="pulse-header">{t('todaysSession')}</span>
          {data.active ? (
            (() => {
              const ad = plan.days[Math.min(data.active.day, plan.days.length - 1)];
              return (
                <>
                  <div className="session-name">{ad?.name}</div>
                  <div className="state__msg" style={{ textAlign: 'left' }}>
                    {t('inProgress')}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <Button onClick={() => navigate('/train')}>{t('continueW')}</Button>
                  </div>
                </>
              );
            })()
          ) : todaySched ? (
            (() => {
              const session =
                plan.days[Math.min(Number(todaySched.day) || 0, plan.days.length - 1)];
              return (
                <>
                  <div className="session-name">{session?.name}</div>
                  <div className="state__msg" style={{ textAlign: 'left' }}>
                    {session?.focus} · {session?.ex.length} exercises · {todaySched.time}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    {doneToday ? (
                      <div style={{ color: 'var(--accent)', fontWeight: 700 }}>{t('done')}</div>
                    ) : (
                      <Button onClick={startSession}>{t('start')}</Button>
                    )}
                  </div>
                </>
              );
            })()
          ) : (
            <>
              <div className="session-name">{t('restDay')}</div>
              <div className="state__msg" style={{ textAlign: 'left' }}>
                {t('restMsg')}
              </div>
            </>
          )}
        </Card>

        {/* Streak + to-goal */}
        <div style={{ display: 'flex', gap: 12 }}>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div className="pulse-stat" style={{ fontSize: '1.5rem' }}>
              {streak}
            </div>
            <div className="stat-label">{t('streak')}</div>
          </Card>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div className="pulse-stat" style={{ fontSize: '1.5rem' }}>
              {diffShow}
              {wu}
            </div>
            <div className="stat-label">{t('toGoal')}</div>
          </Card>
        </div>

        {/* Coach insights */}
        {insights.length > 0 ? (
          <Card>
            <span className="pulse-header">{t('coach')}</span>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 13 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                  <Icon
                    name={ins.icon as IconName}
                    size={20}
                    style={{ color: 'var(--accent)', flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontWeight: 700 }}>{ins.title}</div>
                    <div className="state__msg" style={{ textAlign: 'left', maxWidth: 'none' }}>
                      {ins.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {/* Calorie + macro rings */}
        <Card onClick={() => navigate('/eat')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Ring
              value={eaten}
              max={tg.kcal}
              size={106}
              stroke={11}
              sub={t('calories')}
              numberSize={25}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>
                {Math.max(0, tg.kcal - Math.round(eaten))} {t('kcalLeft')}
              </div>
              <div className="state__msg" style={{ textAlign: 'left', marginBottom: 12 }}>
                {Math.round(eaten)} / {tg.kcal} kcal
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                {MACROS.map((m) => (
                  <div key={m.key} style={{ textAlign: 'center' }}>
                    <Ring
                      value={macroValues[m.key]}
                      max={macroTargets[m.key]}
                      size={46}
                      stroke={5}
                      color={m.color}
                      numberSize={12.5}
                    />
                    <div className="stat-label" style={{ marginTop: 3 }}>
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Synced device stats (PRO + a connected tracker) */}
        {data.pro && tracker.length > 0 ? (
          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <span className="pulse-header">{t('synced')}</span>
              <span className="state__msg" style={{ margin: 0 }}>
                {tracker.join(' · ')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {syncedStats.map(([v, l]) => (
                <div key={l} className="mini-stat">
                  <div className="pulse-stat" style={{ fontSize: '1.05rem' }}>
                    {v}
                  </div>
                  <div className="stat-label">{l}</div>
                </div>
              ))}
            </div>
            <div
              className="state__msg"
              style={{ textAlign: 'left', marginTop: 8, fontSize: '0.72rem' }}
            >
              {t('devNote')}
            </div>
          </Card>
        ) : null}

        {/* Water */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{t('water')}</div>
              <div className="state__msg" style={{ textAlign: 'left' }}>
                {water} / 8 {t('glasses')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="ghost"
                aria-label="Remove a glass of water"
                onClick={() => setWater(water - 1)}
              >
                −
              </Button>
              <Button aria-label="Add a glass of water" onClick={() => setWater(water + 1)}>
                +
              </Button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  background: i < water ? 'var(--accent)' : 'var(--panel-2)',
                }}
              />
            ))}
          </div>
        </Card>

        {/* Upcoming reminders */}
        {upcoming.length > 0 ? (
          <>
            <span className="pulse-header">{t('upcoming')}</span>
            {upcoming.map((u, i) => (
              <Card
                key={i}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ fontWeight: 700 }}>{u.name}</div>
                <div className="state__msg" style={{ margin: 0 }}>
                  {u.label} · {u.time || t('anytime')}
                </div>
              </Card>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
