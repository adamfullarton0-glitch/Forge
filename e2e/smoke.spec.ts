import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 402, height: 880 } });

/** Seeds a realistic onboarded state (guarded for cross-origin iframes). */
function seed() {
  try {
    void window.localStorage;
  } catch {
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  window.localStorage.setItem(
    'forge-data',
    JSON.stringify({
      schemaVersion: 1,
      profile: {
        name: 'Jordan',
        sex: 'm',
        age: 28,
        height: 180,
        weight: 80,
        targetWeight: 75,
        weightUnit: 'kg',
        heightUnit: 'cm',
        goal: 'lose',
        activity: 'moderate',
        experience: 'intermediate',
        allergies: [],
        dislikes: [],
      },
      settings: { dark: true, accent: 'pulse', lang: 'en' },
      planId: 'ppl',
      pro: true,
      devices: ['Garmin'],
      foodLog: { [today]: [{ meal: 'lunch', n: 'Rice', kcal: 260, p: 5, c: 56, f: 1 }] },
    }),
  );
}

/** Records any Content-Security-Policy violations into window.__csp. */
function cspWatcher() {
  const w = window as unknown as { __csp?: string[] };
  w.__csp = [];
  document.addEventListener('securitypolicyviolation', (e) => {
    w.__csp?.push(`${e.violatedDirective} ${e.blockedURI}`);
  });
}

test('every screen renders with a clean console and a working video embed', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  await page.addInitScript(cspWatcher);
  await page.addInitScript(seed);
  await page.goto('/');

  // A Content-Security-Policy must be present in the production build.
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /jordan/i })).toBeVisible();

  // Visit every nav destination.
  await page.getByRole('link', { name: /eat/i }).click();
  await expect(page.getByRole('heading', { name: 'Nutrition' })).toBeVisible();
  for (const tab of ['Plan', 'Recipes', 'Stats', 'More']) {
    await page.getByRole('link', { name: new RegExp(tab, 'i') }).click();
  }

  // Train → start a session → open the exercise modal.
  await page.getByRole('link', { name: /train/i }).click();
  await page.getByLabel(/choose session/i).selectOption('0');
  await page.getByRole('button', { name: /start workout/i }).click();
  await page.getByText('Chest · Triceps · Front delts').first().click();

  // The movement demo + a "watch the video" action; tapping it reveals the
  // in-app player with the referrer policy that avoids Error 153.
  await page.getByRole('button', { name: /watch the video tutorial/i }).click();
  await expect(page.getByTitle(/barbell bench press tutorial/i)).toHaveAttribute(
    'referrerpolicy',
    'strict-origin-when-cross-origin',
  );

  // No errors from our own code (external media load failures are ignored).
  const realErrors = errors.filter(
    (e) =>
      !/youtube|googlevideo|ytimg|ERR_|net::|Failed to load resource|status of 4|status of 5/i.test(
        e,
      ),
  );
  expect(realErrors).toEqual([]);

  // The CSP must not have blocked any of our own resources.
  const violations = await page.evaluate(
    () => (window as unknown as { __csp?: string[] }).__csp ?? [],
  );
  expect(violations).toEqual([]);
});
