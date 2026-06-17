import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Progress } from './Progress';
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

describe('Progress', () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });
  afterEach(() => localStorage.clear());

  it('renders the progress sections', () => {
    render(<Progress />);
    expect(screen.getByRole('heading', { name: 'Progress' })).toBeInTheDocument();
    expect(screen.getByText('Body weight')).toBeInTheDocument();
    expect(screen.getByText(/of 9 unlocked/)).toBeInTheDocument();
  });

  it('logs a body weight', async () => {
    const user = userEvent.setup();
    render(<Progress />);
    await user.type(screen.getByLabelText(/weight \(kg\)/i), '79');
    await user.click(screen.getByRole('button', { name: 'Log' }));
    const weights = useStore.getState().data.weights;
    expect(weights.some((x) => x.d === todayKey() && x.w === 79)).toBe(true);
  });

  it('logs a measurement', async () => {
    const user = userEvent.setup();
    render(<Progress />);
    await user.type(screen.getByLabelText(/waist \(cm\)/i), '82');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(useStore.getState().data.measure[todayKey()]?.waist).toBe(82);
  });

  it('opens the exercise picker and then the exercise modal to track a lift', async () => {
    const user = userEvent.setup();
    render(<Progress />);
    await user.click(screen.getByRole('button', { name: '+ Track a lift' }));
    await user.click(screen.getByText('Barbell Bench Press'));
    expect(screen.getByText('How to do it')).toBeInTheDocument();
  });

  it('shows tracked lifts with their working weight', () => {
    seed({
      lifts: { 'Barbell Bench Press': [{ d: '2026-06-01', w: 80, reps: 6, e1rm: 96, hit: true }] },
    });
    render(<Progress />);
    expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
  });
});
