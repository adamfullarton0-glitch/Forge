import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Eat } from './Eat';
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
const todayLog = () => useStore.getState().data.foodLog[todayKey()] ?? [];

describe('Eat', () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('renders the macro tracker and calorie guide', () => {
    render(<Eat />);
    expect(screen.getByText('Calories')).toBeInTheDocument();
    expect(screen.getByText('Your calorie guide')).toBeInTheDocument();
  });

  it('quick-adds a food to the log', async () => {
    const user = userEvent.setup();
    render(<Eat />);
    await user.click(screen.getByRole('button', { name: '+ Banana' }));
    expect(todayLog().some((x) => x.n === 'Banana')).toBe(true);
  });

  it('adds a custom food', async () => {
    const user = userEvent.setup();
    render(<Eat />);
    await user.type(screen.getByLabelText('Food name'), 'Protein bar');
    await user.type(screen.getByLabelText('kcal'), '200');
    await user.click(screen.getByRole('button', { name: 'Add to log' }));
    const entry = todayLog().find((x) => x.n === 'Protein bar');
    expect(entry?.kcal).toBe(200);
  });

  it('removes a logged food', async () => {
    const user = userEvent.setup();
    seed({
      foodLog: { [todayKey()]: [{ meal: 'lunch', n: 'Rice', kcal: 260, p: 5, c: 56, f: 1 }] },
    });
    render(<Eat />);
    await user.click(screen.getByRole('button', { name: /remove rice/i }));
    expect(todayLog()).toHaveLength(0);
  });

  it('searches Open Food Facts and logs a result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              products: [
                {
                  product_name: 'Oats',
                  brands: 'Quaker',
                  nutriments: { 'energy-kcal_100g': 389, proteins_100g: 13 },
                },
              ],
            }),
        }),
      ),
    );
    const user = userEvent.setup();
    render(<Eat />);
    await user.type(screen.getByLabelText('Search foods & brands'), 'oats');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    const addBtn = await screen.findByRole('button', { name: /add quaker · oats/i });
    await user.click(addBtn);
    expect(todayLog().some((x) => x.n === 'Quaker · Oats')).toBe(true);
  });

  it('shows an error state when the food database is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    const user = userEvent.setup();
    render(<Eat />);
    await user.type(screen.getByLabelText('Search foods & brands'), 'chicken');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText(/couldn't reach the food database/i)).toBeInTheDocument();
  });
});
