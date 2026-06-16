import { RouterProvider } from 'react-router-dom';
import { GlobalErrorBoundary } from './GlobalErrorBoundary';
import { Providers } from './Providers';
import { router } from './router';

export function App(): JSX.Element {
  return (
    <GlobalErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </GlobalErrorBoundary>
  );
}
