import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { Layout } from './Layout';
import { Home } from '@/screens/Home';
import { Train } from '@/screens/Train';
import { Eat } from '@/screens/Eat';
import { Recipes } from '@/screens/Recipes';
import { More } from '@/screens/More';
import { Sleep } from '@/screens/Sleep';
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
      { path: 'recipes', element: <Recipes /> },
      {
        path: 'stats',
        element: <Placeholder title="Stats" icon="stats" note="Progress charts come in Phase 9." />,
      },
      { path: 'more', element: <More /> },
      { path: 'sleep', element: <Sleep /> },
      {
        path: 'settings',
        element: (
          <Placeholder title="Settings" icon="settings" note="Settings arrives in Phase 9." />
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
