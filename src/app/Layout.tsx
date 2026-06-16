import { Outlet, useLocation } from 'react-router-dom';
import { NavBar } from '@/components/NavBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * App shell: a per-route error boundary wraps the active screen, and the
 * bottom nav sits outside it so navigation always survives a screen crash.
 * Keying the boundary by pathname auto-resets it when you navigate away.
 */
export function Layout(): JSX.Element {
  const location = useLocation();
  const area = location.pathname === '/' ? 'Home' : location.pathname.replace('/', '');

  return (
    <>
      <main>
        <ErrorBoundary key={location.pathname} area={area}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <NavBar />
    </>
  );
}
