# FORGE

A dark, premium fitness + nutrition + sleep PWA. Built to be **unbreakable**:
TypeScript strict, validated storage, error boundaries everywhere, and a real
test gate.

> **Status: feature-complete.**
> Onboarding, Home, Train + Active Workout, Eat, Recipes, Sleep, Progress,
> Settings and the More hub are all built and tested, plus the full set of
> advanced features below. Plan (schedule) is the only remaining typed
> placeholder. See [SECURITY.md](./SECURITY.md) for the security posture.

## Features

Core: onboarding & profile, dashboard, workout plans + live session tracking
(rest timer, plate maths, e1RM/PR detection), nutrition logging with an Open
Food Facts search, a 580+ recipe library with TheMealDB photos, body-weight &
measurement trends, a workout-consistency heatmap, achievements, and 14
translated UI languages.

Advanced (all device-local, all tested):

- **Custom workout routines** — build/edit your own split with per-exercise
  sets×reps; it slots in beside the built-in plans.
- **Body-map exercise finder** — tap a muscle to see the lifts that train it.
- **Custom recipes** — add your own meals (macros, ingredients, method); they
  join the searchable library.
- **Shopping list** — push a recipe's ingredients to a de-duplicated list.
- **Expanded micronutrients** — track fiber, sugar, sodium, saturated fat,
  potassium, calcium, iron and vitamin C against daily targets.
- **HRV recovery** — wearable-style recovery from heart-rate variability vs
  your own rolling baseline (simulated behind a swap-in adapter).
- **Progress photos** — a private, on-device photo timeline (compressed,
  quota-safe, never uploaded — see [SECURITY.md](./SECURITY.md)).

Backend/native capabilities (accounts, cross-device sync, push, store/IAP,
ads) exist as typed, inert **local stubs** behind clean adapter interfaces
(`src/features/platform/`), ready to swap for real implementations.

## Stack

- **Vite + React 18 + TypeScript** (strict, `noUncheckedIndexedAccess`, no `any`)
- **react-router-dom** — routing with a per-route error boundary
- **Zustand + Zod** — state + validation (wired up in Phase 2)
- **Vitest + Testing Library** — unit/component tests
- **Playwright** — e2e, including an **offline** run
- **vite-plugin-pwa (Workbox)** — installable, offline-first app shell
- **ESLint + Prettier + Husky** — pre-commit gate
- **GitHub Actions** — CI gate (typecheck · lint · format · coverage · e2e)
- **Strict CSP + security headers** — see [SECURITY.md](./SECURITY.md)
- **Accessibility** — automated axe (WCAG 2 A/AA) scan of every screen,
  keyboard-operable cards, 320px-safe layout
- **Code-split routes** — initial JS ~110KB gzip; screens + data load on demand

## Commands

| Command                 | What it does                                          |
| ----------------------- | ----------------------------------------------------- |
| `npm run dev`           | Start the dev server                                  |
| `npm run build`         | Type-check then production build                      |
| `npm run typecheck`     | `tsc` strict, no emit                                 |
| `npm run lint`          | ESLint (bans `any`, non-null `!`, floating promises)  |
| `npm run test`          | Vitest unit/component suite                           |
| `npm run test:coverage` | Vitest with the `lib/` ≥90% coverage gate             |
| `npm run e2e`           | Playwright e2e (builds + previews, runs offline test) |
| `npm run verify`        | typecheck + lint + test                               |

## The UNBREAKABLE bar (enforced from Phase 1)

- **Error boundaries** — a global boundary plus one per route. A screen crash
  shows a friendly "reload this section" card; the nav and every other screen
  keep working. **Proven** by `src/app/Layout.test.tsx`, `e2e/app.spec.ts`,
  and a live "Trigger screen error" button on Home.
- **Offline-first** — the app shell opens with no network
  (`e2e/offline.spec.ts`).
- **Strict types** — no `any`, no non-null `!` on external data, no floating
  promises (lint-enforced).
- **State primitives** — every list gets empty / loading / error states
  (`src/components/states.tsx`).

## Structure

```
src/
  app/        shell, router (code-split), providers, global error boundary
  components/ Card, Button, Chip, Icon, NavBar, Modal, ErrorBoundary, states
  screens/    every screen + per-area subfolders (train/, recipes/, eat/,
              progress/, sleep/) for the feature modals/widgets
  features/   pure domain logic + state — store, workouts, recipes,
              nutrition, sleep (adapter + recovery), progress, platform stubs
  lib/        calc/ (pure, ≥90% covered), api/ (Zod-validated clients),
              storage (validated, isolated photo key), i18n, image
  types/      Zod schemas — the single source of persisted shape
  theme/      Pulse design tokens + global CSS
  test/       Vitest setup + security source-scan
e2e/          Playwright specs (onboarding, offline, error isolation, a11y, smoke)
```
