import { useEffect, type ReactNode } from 'react';
import { applyTheme } from '@/theme/pulse';

/**
 * App-wide providers. For Phase 1 this just locks in the Pulse dark theme +
 * cyan accent; persisted theme preferences arrive with the storage core
 * (Phase 2) and Settings (Phase 9).
 */
export function Providers({ children }: { children: ReactNode }): JSX.Element {
  useEffect(() => {
    applyTheme('dark', 'cyan');
  }, []);

  return <>{children}</>;
}
