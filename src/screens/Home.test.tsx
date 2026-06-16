import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Home } from './Home';
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

function seed(patch: Partial<PersistedState> = {}): void {
  useStore.setState({ data: { ...defaultState(), profile, ...patch } });
}

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );

describe('Home dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });
  afterEach(() => localStorage.clear());

  it('greets the user by name and shows the calorie ring', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: /alex/i })).toBeInTheDocument();
    expect(screen.getByText('Calories')).toBeInTheDocument();
    expect(screen.getByText(/day streak/i)).toBeInTheDocument();
  });

  it('reflects logged food in the calorie remaining count', () => {
    seed({
      foodLog: { [todayKey()]: [{ meal: 'lunch', name: 'Rice', kcal: 500, p: 10, c: 100, f: 5 }] },
    });
    renderHome();
    // 500 of the day's kcal are eaten, shown in the "x / target kcal" line.
    expect(screen.getByText(/500 \//)).toBeInTheDocument();
  });

  it('increments the water count and persists it', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: /add a glass of water/i }));
    expect(useStore.getState().data.water[todayKey()]).toBe(1);
  });

  it('shows the PRO synced-stats card only with PRO and a connected tracker', () => {
    seed({ pro: true, devices: ['Garmin'] });
    renderHome();
    expect(screen.getByText(/synced from your devices/i)).toBeInTheDocument();
    expect(screen.getByText(/resting hr/i)).toBeInTheDocument();
  });

  it('hides the synced-stats card for free users', () => {
    seed({ pro: false, devices: ['Garmin'] });
    renderHome();
    expect(screen.queryByText(/synced from your devices/i)).not.toBeInTheDocument();
  });
});
