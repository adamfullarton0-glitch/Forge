import { test, expect } from '@playwright/test';

test.describe('FORGE first run', () => {
  test('completes onboarding and lands on the dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('WELCOME TO')).toBeVisible();

    await page.getByRole('button', { name: /let's go/i }).click();

    await page.getByLabel('Name').fill('Sam');
    await page.getByLabel('Age').fill('30');
    await page.getByLabel(/height in centimetres/i).fill('180');
    await page.getByLabel(/current weight in kg/i).fill('80');
    await page.getByLabel(/goal weight in kg/i).fill('75');

    // Continue through goal → equipment → allergies → dislikes, then finish.
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: /^continue$/i }).click();
    }
    await page.getByRole('button', { name: /build my plan/i }).click();

    await expect(page.getByRole('heading', { name: /sam/i })).toBeVisible();
    await expect(page.getByRole('navigation', { name: /primary/i })).toBeVisible();

    await page.getByRole('link', { name: /train/i }).click();
    await expect(page.getByRole('heading', { name: 'Train' })).toBeVisible();
  });
});

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
};

test.describe('error isolation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((data) => {
      window.localStorage.setItem('forge-data', JSON.stringify(data));
    }, SEED);
  });

  test('a thrown screen is contained; the nav and other screens survive', async ({ page }) => {
    await page.goto('/__diag/boom');
    await expect(page.getByRole('alert')).toBeVisible();

    const nav = page.getByRole('navigation', { name: /primary/i });
    await expect(nav).toBeVisible();

    await page.getByRole('link', { name: /home/i }).click();
    await expect(page.getByRole('heading', { name: /alex/i })).toBeVisible();
  });
});
