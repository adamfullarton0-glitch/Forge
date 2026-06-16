import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { Layout } from './Layout';
import { Home } from '@/screens/Home';
import { Train } from '@/screens/Train';
import { Eat } from '@/screens/Eat';
import { Placeholder } from '@/screens/Placeholder';
import { Boom } from '@/screens/Boom';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'train', element: <Train /> },
      {
        path: 'plan',
        element: (
          <Placeholder title="Plan" icon="plan" note="Weekly training schedule comes in Phase 5." />
        ),
      },
      { path: 'eat', element: <Eat /> },
      {
        path: 'recipes',
        element: (
          <Placeholder title="Recipes" icon="recipes" note="The recipe library comes in Phase 7." />
        ),
      },
      {
        path: 'stats',
        element: <Placeholder title="Stats" icon="stats" note="Progress charts come in Phase 9." />,
      },
      {
        path: 'more',
        element: (
          <Placeholder
            title="More"
            icon="more"
            note="Sleep, Settings and Upgrade live here from Phase 8 onward."
          />
        ),
      },
      // Hidden diagnostics route — proves the per-route error boundary works.
      { path: '__diag/boom', element: <Boom /> },
      {
        path: '*',
        element: (
          <Placeholder title="Not found" icon="alert" note="That route does not exist yet." />
        ),
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
