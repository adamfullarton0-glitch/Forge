import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ viewport: { width: 390, height: 844 } });

const SEED = {
  schemaVersion: 1,
  profile: {
    name: 'Alex',
    sex: 'm',
    age: 30,
    height: 180,
    weight: 80,
    targetWeight: 75,
    weightUnit: 'kg',
    heightUnit: 'cm',
    goal: 'lose',
    activity: 'moderate',
    experience: 'beginner',
    allergies: [],
    dislikes: [],
  },
  settings: { dark: true, accent: 'pulse', lang: 'en' },
  planId: 'ppl',
  pro: true,
  devices: ['Garmin'],
};

async function scan(page: import('@playwright/test').Page, path: string): Promise<void> {
  await page.goto(path);
  // Let the lazily-loaded screen render.
  await page.waitForLoadState('networkidle');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    serious,
    JSON.stringify(
      serious.map((v) => ({ id: v.id, nodes: v.nodes.length })),
      null,
      2,
    ),
  ).toEqual([]);
}

test.describe('accessibility (axe, WCAG 2 A/AA)', () => {
  test('onboarding has no serious violations', async ({ page }) => {
    await scan(page, '/');
  });

  test.describe('with a seeded profile', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((data) => {
        try {
          void window.localStorage;
        } catch {
          return;
        }
        window.localStorage.setItem('forge-data', JSON.stringify(data));
      }, SEED);
    });

    for (const path of [
      '/',
      '/train',
      '/eat',
      '/recipes',
      '/stats',
      '/more',
      '/sleep',
      '/settings',
    ]) {
      test(`${path} has no serious violations`, async ({ page }) => {
        await scan(page, path);
      });
    }

    test('no horizontal overflow on a 320px screen', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      for (const path of ['/', '/eat', '/recipes', '/stats', '/settings']) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        const overflows = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        );
        expect(overflows, `${path} overflows at 320px`).toBe(false);
      }
    });
  });
});
