import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseModal } from './ExerciseModal';
import { useStore } from '@/features/store';
import { defaultState, type Profile } from '@/types/schemas';

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

describe('ExerciseModal', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState({ data: { ...defaultState(), profile } });
  });
  afterEach(() => localStorage.clear());

  it('renders how-to steps and the coach tip', () => {
    render(<ExerciseModal name="Barbell Bench Press" onClose={() => undefined} />);
    expect(screen.getByText('How to do it')).toBeInTheDocument();
    expect(screen.getByText(/coach's tip/i)).toBeInTheDocument();
  });

  it('logs a working weight into the lift history', async () => {
    const user = userEvent.setup();
    render(<ExerciseModal name="Barbell Bench Press" onClose={() => undefined} />);
    await user.type(screen.getByLabelText(/working weight in kg/i), '60');
    await user.click(screen.getByRole('button', { name: /^log$/i }));
    expect(useStore.getState().data.lifts['Barbell Bench Press']?.[0]?.w).toBe(60);
  });

  it('shows the plate breakdown for a barbell lift', async () => {
    const user = userEvent.setup();
    render(<ExerciseModal name="Barbell Bench Press" onClose={() => undefined} />);
    await user.type(screen.getByLabelText(/working weight in kg/i), '60');
    // 60 kg on a 20 kg bar = one 20 kg plate per side.
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('calls onClose when the close button is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ExerciseModal name="Barbell Bench Press" onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing for an unknown exercise', () => {
    const { container } = render(<ExerciseModal name="Nope" onClose={() => undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});
