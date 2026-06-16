import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Onboarding } from './Onboarding';
import { useStore } from '@/features/store';
import { defaultState } from '@/types/schemas';

describe('Onboarding', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState({ data: defaultState() });
  });
  afterEach(() => localStorage.clear());

  it('captures a profile and unblocks the app', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);

    await user.click(screen.getByRole('button', { name: /let's go/i }));

    await user.type(screen.getByLabelText('Name'), 'Sam');
    await user.type(screen.getByLabelText('Age'), '30');
    await user.type(screen.getByLabelText(/height in centimetres/i), '180');
    await user.type(screen.getByLabelText(/current weight in kg/i), '80');
    await user.type(screen.getByLabelText(/goal weight in kg/i), '75');
    await user.click(screen.getByRole('button', { name: /female/i }));

    // Step through goal, equipment, allergies, dislikes.
    await user.click(screen.getByRole('button', { name: /next/i })); // -> goal
    await user.click(screen.getByRole('button', { name: /^build muscle/i }));
    await user.click(screen.getByRole('button', { name: /next/i })); // -> equipment
    await user.click(screen.getByRole('button', { name: /next/i })); // -> allergies
    await user.click(screen.getByRole('button', { name: /next/i })); // -> dislikes
    await user.click(screen.getByRole('button', { name: /build my plan/i }));

    const profile = useStore.getState().data.profile;
    expect(profile).not.toBeNull();
    expect(profile?.name).toBe('Sam');
    expect(profile?.sex).toBe('f');
    expect(profile?.age).toBe(30);
    expect(profile?.height).toBe(180);
    expect(profile?.weight).toBe(80);
    expect(profile?.targetWeight).toBe(75);
    expect(profile?.goal).toBe('gain');
  });

  it('keeps the Next button disabled until required fields are filled', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);
    await user.click(screen.getByRole('button', { name: /let's go/i }));
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('converts imperial input to metric on the stored profile', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);
    await user.click(screen.getByRole('button', { name: /let's go/i }));

    await user.type(screen.getByLabelText('Name'), 'Lee');
    await user.type(screen.getByLabelText('Age'), '28');
    await user.click(screen.getByRole('button', { name: /ft \+ in/i }));
    await user.type(screen.getByLabelText(/height feet/i), '5');
    await user.type(screen.getByLabelText(/height inches/i), '11');
    await user.click(screen.getByRole('button', { name: /^lbs$/i }));
    await user.type(screen.getByLabelText(/current weight in lb/i), '176');
    await user.type(screen.getByLabelText(/goal weight in lb/i), '165');

    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /build my plan/i }));

    const profile = useStore.getState().data.profile;
    expect(profile?.height).toBe(180); // 5'11" ≈ 180 cm
    expect(profile?.weight).toBeCloseTo(79.8, 0); // 176 lb ≈ 80 kg
    expect(profile?.weightUnit).toBe('lb');
  });
});
