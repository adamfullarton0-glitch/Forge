import { type HTMLAttributes, type KeyboardEvent } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement>;

/**
 * A glass panel. When given an `onClick` it becomes a real button to the
 * keyboard + screen readers: focusable, with role="button" and Enter/Space
 * activation.
 */
export function Card({ className = '', children, onClick, ...rest }: CardProps): JSX.Element {
  const interactive = typeof onClick === 'function';

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.currentTarget.click();
    }
  };

  return (
    <div
      className={`card ${interactive ? 'card--interactive' : ''} ${className}`.trim()}
      onClick={onClick}
      {...(interactive ? { role: 'button', tabIndex: 0, onKeyDown } : {})}
      {...rest}
    >
      {children}
    </div>
  );
}
