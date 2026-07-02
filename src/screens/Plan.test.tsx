import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plan } from './Plan';
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
const schedule = () => useStore.getState().data.schedule;

describe('Plan', () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });
  afterEach(() => localStorage.clear());

  it('renders the schedule with the active plan and training-day count', () => {
    render(<Plan />);
    expect(screen.getByRole('heading', { name: 'Plan' })).toBeInTheDocument();
    // Default seed trains Mon/Wed/Fri.
    expect(screen.getByText('Push / Pull / Legs')).toBeInTheDocument();
    expect(screen.getByText('days / week')).toBeInTheDocument();
  });

  it('turns a rest day into a training day', async () => {
    const user = userEvent.setup();
    render(<Plan />);
    // Tuesday (index 1) is a rest day by default.
    expect(schedule()['1']).toBeUndefined();
    await user.click(screen.getByRole('button', { name: /tuesday: rest day/i }));
    expect(schedule()['1']).toEqual({ day: '0', time: '18:00' });
  });

  it('turns a training day into a rest day', async () => {
    const user = userEvent.setup();
    render(<Plan />);
    // Monday (index 0) trains by default.
    expect(schedule()['0']).toBeDefined();
    await user.click(screen.getByRole('button', { name: /monday: training day/i }));
    expect(schedule()['0']).toBeUndefined();
  });

  it('changes a training day’s session time', () => {
    render(<Plan />);
    // Native <input type="time"> is set directly (typing into it is unreliable).
    fireEvent.change(screen.getByLabelText(/monday time/i), { target: { value: '07:30' } });
    expect(schedule()['0']?.time).toBe('07:30');
  });

  it('toggles session reminders off', async () => {
    const user = userEvent.setup();
    render(<Plan />);
    await user.click(screen.getByRole('checkbox'));
    expect(useStore.getState().data.remind.on).toBe(false);
  });
});
