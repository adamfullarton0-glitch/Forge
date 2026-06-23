import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { NavBar } from '@/components/NavBar';
import { QuickAdd } from '@/components/QuickAdd';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loading } from '@/components/states';
import { Onboarding } from '@/screens/Onboarding';
import { useData } from '@/features/store';

/**
 * App shell. Until a profile exists, onboarding takes over the whole screen
 * (no nav). Once it does, a per-route error boundary wraps the active screen
 * while the bottom nav sits outside it, so navigation always survives a screen
 * crash. Keying the boundary by pathname auto-resets it on navigation.
 */
export function Layout(): JSX.Element {
  const location = useLocation();
  const profile = useData().profile;

  if (!profile) {
    return (
      <ErrorBoundary area="onboarding">
        <Onboarding />
      </ErrorBoundary>
    );
  }

  const area = location.pathname === '/' ? 'Home' : location.pathname.replace('/', '');

  return (
    <>
      <main>
        <ErrorBoundary key={location.pathname} area={area}>
          <Suspense
            fallback={
              <div className="screen">
                <Loading />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <QuickAdd />
      <NavBar />
    </>
  );
}
