import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { More } from './More';
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
      <More />
    </MemoryRouter>,
  );

describe('More hub', () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });
  afterEach(() => localStorage.clear());

  it('lists the Sleep and Settings destinations', () => {
    render2();
    expect(screen.getByText('Sleep')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('activates PRO via the upgrade modal and reveals device pairing', async () => {
    const user = userEvent.setup();
    render2();
    expect(screen.queryByText('Smart devices')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /upgrade to pro/i }));
    await user.click(screen.getByRole('button', { name: /activate pro/i }));

    expect(useStore.getState().data.pro).toBe(true);
    expect(screen.getByText('Smart devices')).toBeInTheDocument();
  });

  it('connects and disconnects a device', async () => {
    const user = userEvent.setup();
    seed({ pro: true });
    render2();
    const garminRow = screen.getByText('Garmin').closest('div')!;
    await user.click(within(garminRow).getByRole('button', { name: /connect/i }));
    expect(useStore.getState().data.devices).toContain('Garmin');
  });
});
