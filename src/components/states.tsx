import { Icon, type IconName } from './Icon';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: IconName;
  action?: { label: string; onClick: () => void };
}

/** Shown when a list has loaded successfully but has nothing in it. */
export function EmptyState({
  title,
  message,
  icon = 'more',
  action,
}: EmptyStateProps): JSX.Element {
  return (
    <div className="state" role="status">
      <Icon name={icon} size={32} className="state__icon" />
      <div className="state__title">{title}</div>
      {message ? <p className="state__msg">{message}</p> : null}
      {action ? (
        <Button variant="ghost" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

interface LoadingProps {
  label?: string;
}

/** Shown while data is in flight. Always paired with a finite fallback. */
export function Loading({ label = 'Loading…' }: LoadingProps): JSX.Element {
  return (
    <div className="state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <div className="state__msg">{label}</div>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/** Shown when a fetch/parse fails. Never a dead end — offers retry when possible. */
export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this right now. Check your connection and try again.',
  onRetry,
}: ErrorStateProps): JSX.Element {
  return (
    <div className="state" role="alert">
      <Icon name="alert" size={32} className="state__icon" />
      <div className="state__title">{title}</div>
      <p className="state__msg">{message}</p>
      {onRetry ? (
        <Button variant="ghost" onClick={onRetry}>
          <Icon name="refresh" size={18} /> Try again
        </Button>
      ) : null}
    </div>
  );
}
