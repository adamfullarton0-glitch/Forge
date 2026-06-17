import { lazy } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { Layout } from './Layout';
import { Placeholder } from '@/screens/Placeholder';
import { Boom } from '@/screens/Boom';

// Screens are code-split per route: the initial load is only the shell + Home;
// other screens (and their data, e.g. the recipe library) load on navigation.
// The service worker precaches every chunk, so this stays fully offline-capable.
const Home = lazy(() => import('@/screens/Home').then((m) => ({ default: m.Home })));
const Train = lazy(() => import('@/screens/Train').then((m) => ({ default: m.Train })));
const Eat = lazy(() => import('@/screens/Eat').then((m) => ({ default: m.Eat })));
const Recipes = lazy(() => import('@/screens/Recipes').then((m) => ({ default: m.Recipes })));
const More = lazy(() => import('@/screens/More').then((m) => ({ default: m.More })));
const Sleep = lazy(() => import('@/screens/Sleep').then((m) => ({ default: m.Sleep })));
const Progress = lazy(() => import('@/screens/Progress').then((m) => ({ default: m.Progress })));
const Settings = lazy(() => import('@/screens/Settings').then((m) => ({ default: m.Settings })));

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
          <Placeholder title="Plan" icon="plan" note="Your weekly training schedule lives here." />
        ),
      },
      { path: 'eat', element: <Eat /> },
      { path: 'recipes', element: <Recipes /> },
      { path: 'stats', element: <Progress /> },
      { path: 'more', element: <More /> },
      { path: 'sleep', element: <Sleep /> },
      { path: 'settings', element: <Settings /> },
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
