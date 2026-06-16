import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from './states';
import { Card } from './Card';

interface ErrorBoundaryProps {
  /** Human label for the area this boundary protects, e.g. "Home". */
  area?: string;
  /** Optional override for the fallback UI. */
  fallback?: (reset: () => void, error: Error) => ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render/runtime errors in its subtree so a single broken screen can
 * never blank the whole app. The navigation and every other screen keep
 * working; this region shows a friendly "reload" card instead.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // In a real build this would go to a logging sink; keep it dev-visible.
    console.error(`[FORGE] error boundary (${this.props.area ?? 'app'}) caught:`, error, info);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) {
        return this.props.fallback(this.reset, error);
      }
      const where = this.props.area ? ` ${this.props.area}` : '';
      return (
        <div className="screen">
          <Card>
            <ErrorState
              title={`This${where} screen hit an error`}
              message="The rest of the app is still working. You can reload this section and keep going."
              onRetry={this.reset}
            />
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
