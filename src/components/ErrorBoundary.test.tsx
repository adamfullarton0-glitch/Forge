import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

function Bomb({ explode }: { explode: boolean }): JSX.Element {
  if (explode) throw new Error('boom');
  return <div>safe content</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React logs caught errors to console.error; silence the noise.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary area="Test">
        <Bomb explode={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('safe content')).toBeInTheDocument();
  });

  it('shows the friendly fallback when a child throws', () => {
    render(
      <ErrorBoundary area="Home">
        <Bomb explode />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/this home screen hit an error/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('uses a custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={() => <div>custom fallback</div>}>
        <Bomb explode />
      </ErrorBoundary>,
    );
    expect(screen.getByText('custom fallback')).toBeInTheDocument();
  });

  it('recovers when the underlying problem is fixed and retry is pressed', async () => {
    const user = userEvent.setup();

    function Harness(): JSX.Element {
      const [explode, setExplode] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setExplode(false)}>
            fix it
          </button>
          <ErrorBoundary area="Home">
            <Bomb explode={explode} />
          </ErrorBoundary>
        </>
      );
    }

    render(<Harness />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Fix the underlying cause, then ask the boundary to retry.
    await user.click(screen.getByText('fix it'));
    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('safe content')).toBeInTheDocument();
  });
});
