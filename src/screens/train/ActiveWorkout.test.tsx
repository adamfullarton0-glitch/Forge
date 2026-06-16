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

  it('discards the workout without logging anything', async () => {
    const user = userEvent.setup();
    renderWorkout();
    await user.click(screen.getByRole('button', { name: /discard workout/i }));
    expect(useStore.getState().data.active).toBeNull();
    expect(useStore.getState().data.done).toHaveLength(0);
  });
});
