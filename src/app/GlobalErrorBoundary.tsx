import { type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/states';

/**
 * Last line of defence. If something outside any screen boundary throws (the
 * router, providers, the shell), this catches it and offers a hard reload so
 * the user never sees a white screen.
 */
export function GlobalErrorBoundary({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ErrorBoundary
      area="app"
      fallback={(reset) => (
        <div className="screen">
          <Card>
            <ErrorState
              title="FORGE hit an unexpected error"
              message="Something went wrong at the app level. Reloading usually fixes it."
              onRetry={() => {
                reset();
                window.location.reload();
              }}
            />
          </Card>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
