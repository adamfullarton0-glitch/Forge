import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState, ErrorState, Loading } from './states';

describe('state primitives', () => {
  it('EmptyState renders title, message and optional action', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <EmptyState
        title="No workouts"
        message="Add one to begin"
        action={{ label: 'Add', onClick }}
      />,
    );
    expect(screen.getByText('No workouts')).toBeInTheDocument();
    expect(screen.getByText('Add one to begin')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('Loading exposes a polite live status', () => {
    render(<Loading label="Fetching…" />);
    expect(screen.getByText('Fetching…')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('ErrorState surfaces an alert and a retry affordance', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('ErrorState without a retry handler shows no button', () => {
    render(<ErrorState />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
