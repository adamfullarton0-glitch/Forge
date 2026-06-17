import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sleep } from './Sleep';
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
const render2 = () =>
  render(
    <MemoryRouter>
      <Sleep />
    </MemoryRouter>,
  );

describe('Sleep', () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });
  afterEach(() => localStorage.clear());

  it('shows a PRO upsell for free users', () => {
    render2();
    expect(screen.getByText('PRO feature')).toBeInTheDocument();
    expect(screen.queryByText(/session readiness/i)).not.toBeInTheDocument();
  });

  it('prompts to connect a tracker for PRO users without one', () => {
    seed({ pro: true, devices: ['Withings Smart Scale'] });
    render2();
    expect(screen.getByText(/connect a sleep tracker/i)).toBeInTheDocument();
  });

  it('renders the full dashboard with a connected tracker', () => {
    seed({ pro: true, devices: ['Garmin'] });
    render2();
    expect(screen.getByText(/auto-synced from garmin/i)).toBeInTheDocument();
    expect(screen.getByText("Today's session readiness")).toBeInTheDocument();
    expect(screen.getByText('Last night · sleep stages')).toBeInTheDocument();
    expect(screen.getByText('How to improve')).toBeInTheDocument();
    // The "device sync is simulated" honesty note is present.
    expect(screen.getByText(/simulated in this demo build/i)).toBeInTheDocument();
  });

  it('switches the trend range', async () => {
    const user = userEvent.setup();
    seed({ pro: true, devices: ['Garmin'] });
    render2();
    await user.click(screen.getByRole('button', { name: '1Y' }));
    expect(screen.getByText('Avg over 1Y')).toBeInTheDocument();
  });
});
