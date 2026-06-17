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
