import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Train } from '../Train';
import { useStore } from '@/features/store';
import { defaultState, type Profile, type PersistedState } from '@/types/schemas';
import { todayKey } from '@/lib/calc';

const profile: Profile = {
  name: 'Alex',
  sex: 'm',
  age: 30,
  height: 180,
  weight: 80,
  targetWeight: 75,
  weightUnit: 'kg',
  heightUnit: 'cm',
  goal: 'lose',
  activity: 'moderate',
  experience: 'beginner',
  allergies: [],
  dislikes: [],
};

function seedActive(patch: Partial<PersistedState> = {}): void {
  useStore.setState({
    data: {
      ...defaultState(),
      profile,
      planId: 'ppl',
      active: { day: 0, checked: [], swaps: {} },
      ...patch,
    },
  });
}

const renderWorkout = () =>
  render(
    <MemoryRouter>
      <Train />
    </MemoryRouter>,
  );

describe('ActiveWorkout', () => {
  beforeEach(() => {
    localStorage.clear();
    seedActive();
  });
  afterEach(() => localStorage.clear());

  it('renders the active session with its exercises', () => {
    renderWorkout();
    expect(screen.getByRole('heading', { name: 'Push' })).toBeInTheDocument();
    expect(screen.getByLabelText(/barbell bench press set 1 weight/i)).toBeInTheDocument();
  });

  it('starts a rest timer when a set is completed', async () => {
    const user = userEvent.setup();
    renderWorkout();
    await user.click(screen.getByRole('button', { name: /complete barbell bench press set 1/i }));
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('logs a completed workout into done + lifts and clears the active session', async () => {
    const user = userEvent.setup();
    renderWorkout();

    const weight = screen.getByLabelText(/barbell bench press set 1 weight/i);
    const reps = screen.getByLabelText(/barbell bench press set 1 reps/i);
    await user.clear(weight);
    await user.type(weight, '60');
    await user.clear(reps);
    await user.type(reps, '8');
    await user.click(screen.getByRole('button', { name: /complete barbell bench press set 1/i }));

    await user.click(screen.getByRole('button', { name: /finish workout/i }));

    const data = useStore.getState().data;
    expect(data.active).toBeNull();
    expect(data.done).toHaveLength(1);
    expect(data.done[0]?.day).toBe('Push');
    const liftLog = data.lifts['Barbell Bench Press'];
    expect(liftLog).toBeDefined();
    expect(liftLog?.[0]?.d).toBe(todayKey());
    expect(liftLog?.[0]?.e1rm).toBe(76); // e1rm(60, 8)
  });

  it('discards immediately when nothing has been logged', async () => {
    const user = userEvent.setup();
    renderWorkout();
    await user.click(screen.getByRole('button', { name: /discard workout/i }));
    expect(useStore.getState().data.active).toBeNull();
    expect(useStore.getState().data.done).toHaveLength(0);
  });

  it('asks for confirmation before discarding once a set is touched', async () => {
    const user = userEvent.setup();
    renderWorkout();
    const weight = screen.getByLabelText(/barbell bench press set 1 weight/i);
    await user.clear(weight);
    await user.type(weight, '60');
    // First press only arms the confirmation — the session survives.
    await user.click(screen.getByRole('button', { name: /discard workout/i }));
    expect(useStore.getState().data.active).not.toBeNull();
    // Second press actually discards.
    await user.click(screen.getByRole('button', { name: /tap again to discard/i }));
    expect(useStore.getState().data.active).toBeNull();
  });

  it('logs duplicate exercises in a day independently (keyed by slot)', async () => {
    const user = userEvent.setup();
    seedActive({
      customPlans: [
        {
          id: 'custom:dup',
          name: 'Dup',
          days: [{ name: 'D', ex: ['Barbell Bench Press', 'Barbell Bench Press'] }],
        },
      ],
      planId: 'custom:dup',
      active: { day: 0, checked: [], swaps: {} },
    });
    renderWorkout();
    const weights = screen.getAllByLabelText(/barbell bench press set 1 weight/i);
    expect(weights).toHaveLength(2);
    await user.clear(weights[0]!);
    await user.type(weights[0]!, '60');
    // Editing the first slot must not bleed into the second (shared-state bug).
    expect((weights[1] as HTMLInputElement).value).toBe('');
  });

  it('renders a graceful, loggable card for a movement with no demo', () => {
    seedActive({
      customPlans: [{ id: 'custom:u', name: 'U', days: [{ name: 'D', ex: ['Imaginary Lift'] }] }],
      planId: 'custom:u',
      active: { day: 0, checked: [], swaps: {} },
    });
    renderWorkout();
    expect(screen.getByText(/logged movement/i)).toBeInTheDocument();
    // The title isn't a dead tap target — its detail button is disabled.
    expect(screen.getByRole('button', { name: /^imaginary lift/i })).toBeDisabled();
  });
});
