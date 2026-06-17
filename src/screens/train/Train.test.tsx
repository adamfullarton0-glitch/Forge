import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Train } from '../Train';
import { useStore } from '@/features/store';
import { defaultState, type Profile, type PersistedState } from '@/types/schemas';

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

function seed(patch: Partial<PersistedState> = {}): void {
  useStore.setState({ data: { ...defaultState(), profile, ...patch } });
}

const renderTrain = () =>
  render(
    <MemoryRouter>
      <Train />
    </MemoryRouter>,
  );

describe('Train', () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });
  afterEach(() => localStorage.clear());

  it('shows the session picker and the current plan', () => {
    renderTrain();
    expect(screen.getByRole('heading', { name: 'Train' })).toBeInTheDocument();
    expect(screen.getByLabelText(/choose session/i)).toBeInTheDocument();
    expect(screen.getByText('Bro Split')).toBeInTheDocument();
    expect(screen.getAllByText('Push / Pull / Legs').length).toBeGreaterThan(0);
  });

  it('switches the active plan when a plan card is tapped', async () => {
    const user = userEvent.setup();
    renderTrain();
    await user.click(screen.getByText('Upper / Lower'));
    expect(useStore.getState().data.planId).toBe('ul');
  });

  it('starts a session and shows the active workout', async () => {
    const user = userEvent.setup();
    renderTrain();
    // Pick session 0 explicitly so the test is independent of today's weekday.
    await user.selectOptions(screen.getByLabelText(/choose session/i), '0');
    await user.click(screen.getByRole('button', { name: /start workout/i }));
    expect(useStore.getState().data.active).not.toBeNull();
    // PPL day 0 is "Push".
    expect(screen.getByRole('heading', { name: 'Push' })).toBeInTheDocument();
  });
});

describe('Train · custom routines', () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });
  afterEach(() => localStorage.clear());

  it('builds, saves and selects a custom routine', async () => {
    const user = userEvent.setup();
    renderTrain();

    await user.click(screen.getByRole('button', { name: /create routine/i }));
    await user.type(screen.getByLabelText(/routine name/i), 'My Upper/Lower');
    await user.click(screen.getByRole('button', { name: /add exercise/i }));
    await user.click(screen.getByText('Barbell Bench Press')); // from the picker
    await user.click(screen.getByRole('button', { name: /save routine/i }));

    const plans = useStore.getState().data.customPlans;
    expect(plans).toHaveLength(1);
    expect(plans[0]?.name).toBe('My Upper/Lower');
    expect(plans[0]?.days[0]?.ex).toContain('Barbell Bench Press');
    // The new routine becomes the active plan and shows in "My routines"
    // (and in the active-plan summary line), so it appears more than once.
    expect(useStore.getState().data.planId).toBe(plans[0]?.id);
    expect(screen.getAllByText('My Upper/Lower').length).toBeGreaterThan(0);
  });

  it('deletes a custom routine and falls back to a built-in plan', async () => {
    const user = userEvent.setup();
    const routine = {
      id: 'custom:zzz',
      name: 'Bench Only',
      days: [{ name: 'Day 1', ex: ['Barbell Bench Press'] }],
    };
    seed({ customPlans: [routine], planId: 'custom:zzz' });
    renderTrain();

    await user.click(screen.getByRole('button', { name: /delete bench only/i }));
    expect(useStore.getState().data.customPlans).toHaveLength(0);
    expect(useStore.getState().data.planId).toBe('ppl');
  });

  it('starts a session from a custom routine', async () => {
    const user = userEvent.setup();
    seed({
      customPlans: [
        {
          id: 'custom:zzz',
          name: 'Bench Day',
          days: [{ name: 'Bench Day', ex: ['Barbell Bench Press'] }],
        },
      ],
      planId: 'custom:zzz',
    });
    renderTrain();
    await user.selectOptions(screen.getByLabelText(/choose session/i), '0');
    await user.click(screen.getByRole('button', { name: /start workout/i }));
    expect(screen.getByRole('heading', { name: 'Bench Day' })).toBeInTheDocument();
  });
});

describe('Train · body-map finder', () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });
  afterEach(() => localStorage.clear());

  it('finds exercises by muscle group and opens an exercise', async () => {
    const user = userEvent.setup();
    renderTrain();

    await user.click(screen.getByRole('button', { name: /find by muscle/i }));
    // Pick "Chest" from the accessible muscle chips.
    await user.click(screen.getByRole('button', { name: 'Chest' }));
    const benchBtn = await screen.findByRole('button', { name: /^Barbell Bench Press/ });
    await user.click(benchBtn);
    // The exercise detail modal opens.
    expect(screen.getByText('How to do it')).toBeInTheDocument();
  });
});
