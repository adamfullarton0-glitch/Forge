import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from './router';

function renderApp(initialPath = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  return render(<RouterProvider router={router} />);
}

describe('app shell + per-screen error isolation', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the Home screen and the 7-item nav', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { name: /forge yourself/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    for (const label of ['Home', 'Train', 'Plan', 'Eat', 'Recipes', 'Stats', 'More']) {
      expect(screen.getByRole('link', { name: new RegExp(label, 'i') })).toBeInTheDocument();
    }
  });

  it('navigates between screens', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(screen.getByRole('link', { name: /train/i }));
    expect(screen.getByRole('heading', { name: /your training/i })).toBeInTheDocument();
  });

  it('contains a thrown screen error and keeps the nav + other screens alive', async () => {
    const user = userEvent.setup();
    renderApp('/');

    // Crash the Home screen on purpose.
    await user.click(screen.getByRole('button', { name: /trigger screen error/i }));
    expect(screen.getByText(/this home screen hit an error/i)).toBeInTheDocument();

    // Nav survives the crash...
    const trainLink = screen.getByRole('link', { name: /train/i });
    expect(trainLink).toBeInTheDocument();

    // ...and other screens still work.
    await user.click(trainLink);
    expect(screen.getByRole('heading', { name: /your training/i })).toBeInTheDocument();
  });
});
