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

test('every screen renders with a clean console and a working video embed', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  await page.addInitScript(seed);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /jordan/i })).toBeVisible();

  // Visit every nav destination.
  await page.getByRole('link', { name: /eat/i }).click();
  await expect(page.getByRole('heading', { name: 'Nutrition' })).toBeVisible();
  for (const tab of ['Plan', 'Recipes', 'Stats', 'More']) {
    await page.getByRole('link', { name: new RegExp(tab, 'i') }).click();
  }

  // Train → start a session → open the exercise modal → play the tutorial.
  await page.getByRole('link', { name: /train/i }).click();
  await page.getByLabel(/choose session/i).selectOption('0');
  await page.getByRole('button', { name: /start workout/i }).click();
  await page.getByText('Chest · Triceps · Front delts').first().click();
  await page.getByRole('button', { name: /play form tutorial/i }).click();

  // The referrer-policy attribute is what prevents YouTube "Error 153".
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
});
