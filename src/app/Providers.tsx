import { useEffect, type ReactNode } from 'react';
import { applyTheme } from '@/theme/pulse';
import { useData } from '@/features/store';

/**
 * Applies the persisted theme (dark/light + accent) and text direction
 * reactively from the store, so changing them in Settings updates instantly.
 */
export function Providers({ children }: { children: ReactNode }): JSX.Element {
  const { dark, accent, lang } = useData().settings;

  useEffect(() => {
    applyTheme(dark ? 'dark' : 'light', accent);
  }, [dark, accent]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  return <>{children}</>;
}
