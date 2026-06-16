import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from './router';
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
  useStore.setState({ data: { ...defaultState(), ...patch } });
}

function renderApp(initialPath = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  return render(<RouterProvider router={router} />);
}

describe('app shell', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    localStorage.clear();
    seed();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('shows onboarding (no nav) until a profile exists', () => {
    seed({ profile: null });
    renderApp('/');
    expect(screen.getByText('FORGE')).toBeInTheDocument();
    expect(screen.getByText(/welcome to/i)).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /primary/i })).not.toBeInTheDocument();
  });

  it('renders the Home dashboard and the 7-item nav once onboarded', () => {
    seed({ profile });
    renderApp('/');
    expect(screen.getByRole('heading', { name: /alex/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    for (const label of ['Home', 'Train', 'Plan', 'Eat', 'Recipes', 'Stats', 'More']) {
      expect(screen.getByRole('link', { name: new RegExp(label, 'i') })).toBeInTheDocument();
    }
  });

  it('navigates between screens', async () => {
    const user = userEvent.setup();
    seed({ profile });
    renderApp('/');
    await user.click(screen.getByRole('link', { name: /train/i }));
    expect(screen.getByRole('heading', { name: /your training/i })).toBeInTheDocument();
  });

  it('contains a thrown screen error and keeps the nav + other screens alive', async () => {
    const user = userEvent.setup();
    seed({ profile });
    renderApp('/__diag/boom');

    expect(screen.getByRole('alert')).toBeInTheDocument();
    const trainLink = screen.getByRole('link', { name: /train/i });
    expect(trainLink).toBeInTheDocument();

    await user.click(trainLink);
    expect(screen.getByRole('heading', { name: /your training/i })).toBeInTheDocument();
  });
});
