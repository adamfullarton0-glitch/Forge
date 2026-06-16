import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Recipes } from './Recipes';
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

const renderRecipes = () =>
  render(
    <MemoryRouter>
      <Recipes />
    </MemoryRouter>,
  );

describe('Recipes', () => {
  beforeEach(() => {
    localStorage.clear();
    // No network in tests: photo + dish fetches fail gracefully.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    seed();
  });
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('renders the library with featured recipes', async () => {
    renderRecipes();
    expect(screen.getByRole('heading', { name: 'Recipes' })).toBeInTheDocument();
    expect(await screen.findByText('Chicken Burrito Bowl')).toBeInTheDocument();
  });

  it('logs a recipe to the food log', async () => {
    const user = userEvent.setup();
    renderRecipes();
    await user.click(await screen.findByRole('button', { name: /log chicken burrito bowl/i }));
    expect(todayLog().some((x) => x.n === 'Chicken Burrito Bowl')).toBe(true);
  });

  it('shows the PRO upsell with locked recipes for free users', async () => {
    renderRecipes();
    expect(await screen.findByText(/pro recipes locked/i)).toBeInTheDocument();
  });

  it('unlocks the full library for PRO users (no upsell)', async () => {
    seed({ pro: true });
    renderRecipes();
    await screen.findByText('Chicken Burrito Bowl');
    expect(screen.queryByText(/pro recipes locked/i)).not.toBeInTheDocument();
  });

  it('opens the recipe modal with its method', async () => {
    const user = userEvent.setup();
    renderRecipes();
    await user.click(await screen.findByText('Chicken Burrito Bowl'));
    expect(screen.getByText('Method')).toBeInTheDocument();
    expect(screen.getByText('Ingredients')).toBeInTheDocument();
  });

  it('narrows results when a filter is applied', async () => {
    const user = userEvent.setup();
    renderRecipes();
    const countBefore = (await screen.findByText(/recipes match ·/i)).textContent;
    await user.click(screen.getByRole('button', { name: '≤ 15 min' }));
    const countAfter = screen.getByText(/recipes match ·/i).textContent;
    expect(countAfter).not.toBe(countBefore);
  });
});
