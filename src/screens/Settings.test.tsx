import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from './Settings';
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
const settings = () => useStore.getState().data.settings;

describe('Settings', () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });
  afterEach(() => localStorage.clear());

  it('renders the settings sections', () => {
    render(<Settings />);
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Backup & restore')).toBeInTheDocument();
  });

  it('switches the language', async () => {
    const user = userEvent.setup();
    render(<Settings />);
    await user.click(screen.getByRole('button', { name: 'Español' }));
    expect(settings().lang).toBe('es');
    // The UI re-renders in Spanish (Settings → Ajustes).
    expect(screen.getByRole('heading', { name: 'Ajustes' })).toBeInTheDocument();
  });

  it('toggles theme and accent', async () => {
    const user = userEvent.setup();
    render(<Settings />);
    await user.click(screen.getByRole('button', { name: 'Light' }));
    expect(settings().dark).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Violet' }));
    expect(settings().accent).toBe('violet');
  });

  it('edits profile units and goal', async () => {
    const user = userEvent.setup();
    render(<Settings />);
    await user.click(screen.getByRole('button', { name: 'lbs' }));
    expect(useStore.getState().data.profile?.weightUnit).toBe('lb');
    await user.click(screen.getByRole('button', { name: 'Build muscle' }));
    expect(useStore.getState().data.profile?.goal).toBe('gain');
  });

  it('imports a backup file', async () => {
    const user = userEvent.setup();
    render(<Settings />);
    const backup = JSON.stringify({ ...defaultState(), profile, pro: true, planId: 'ul' });
    const file = new File([backup], 'forge-backup.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Import a backup'), file);
    expect(await screen.findByText('Backup restored.')).toBeInTheDocument();
    expect(useStore.getState().data.pro).toBe(true);
    expect(useStore.getState().data.planId).toBe('ul');
  });

  it('resets all data', async () => {
    const user = userEvent.setup();
    render(<Settings />);
    await user.click(screen.getByRole('button', { name: /reset all data/i }));
    expect(useStore.getState().data.profile).toBeNull();
  });
});
