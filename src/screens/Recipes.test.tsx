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

  it('adds a recipe’s ingredients to the shopping list', async () => {
    const user = userEvent.setup();
    renderRecipes();
    await screen.findByText('Chicken Burrito Bowl');
    await user.click(screen.getByRole('button', { name: /add to list — chicken burrito bowl/i }));
    const shopping = useStore.getState().data.shopping;
    expect(shopping.length).toBeGreaterThan(0);
    expect(shopping.some((i) => i.name === 'chicken breast')).toBe(true);
    // Adding again de-duplicates rather than piling up.
    const len = shopping.length;
    await user.click(screen.getByRole('button', { name: /add to list — chicken burrito bowl/i }));
    expect(useStore.getState().data.shopping).toHaveLength(len);
  });

  it('ticks off and clears shopping list items', async () => {
    const user = userEvent.setup();
    seed({
      shopping: [
        { name: 'rice', have: false },
        { name: 'eggs', have: false },
      ],
    });
    renderRecipes();
    await user.click(screen.getByRole('button', { name: /shopping list/i }));
    // Tick "rice" off the list.
    await user.click(screen.getByRole('button', { name: /in the basket: rice/i }));
    expect(useStore.getState().data.shopping.find((i) => i.name === 'rice')?.have).toBe(true);
    // Clear what I have removes only the checked item.
    await user.click(screen.getByRole('button', { name: /clear what i have/i }));
    const names = useStore.getState().data.shopping.map((i) => i.name);
    expect(names).toEqual(['eggs']);
  });

  it('creates a custom recipe that appears in the library', async () => {
    const user = userEvent.setup();
    renderRecipes();
    await user.click(screen.getByRole('button', { name: /create recipe/i }));
    await user.type(screen.getByLabelText(/recipe name/i), 'My Power Bowl');
    await user.type(screen.getByLabelText(/add an ingredient/i), 'chicken breast');
    // The "Add" button next to the ingredient input.
    await user.click(screen.getAllByRole('button', { name: 'Add' })[0]!);
    await user.click(screen.getByRole('button', { name: /save recipe/i }));

    const recipes = useStore.getState().data.customRecipes;
    expect(recipes).toHaveLength(1);
    expect(recipes[0]?.name).toBe('My Power Bowl');
    expect(recipes[0]?.ing).toContain('chicken breast');
    expect(await screen.findByText('My Power Bowl')).toBeInTheDocument();
  });

  it('deletes a custom recipe', async () => {
    const user = userEvent.setup();
    seed({
      customRecipes: [
        { id: 'crec:zzz', name: 'Throwaway Bowl', kcal: 400, p: 30, c: 40, f: 10, ing: ['oats'] },
      ],
    });
    renderRecipes();
    await screen.findByText('Throwaway Bowl');
    await user.click(screen.getByRole('button', { name: /delete throwaway bowl/i }));
    expect(useStore.getState().data.customRecipes).toHaveLength(0);
  });
});
