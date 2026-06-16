import { test, expect } from '@playwright/test';

test.describe('FORGE shell', () => {
  test('loads, shows the nav, and navigates between screens', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /forge yourself/i })).toBeVisible();

    const nav = page.getByRole('navigation', { name: /primary/i });
    await expect(nav).toBeVisible();

    await page.getByRole('link', { name: /train/i }).click();
    await expect(page.getByRole('heading', { name: /your training/i })).toBeVisible();
  });

  test('a deliberate screen crash is contained; the nav and other screens survive', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /trigger screen error/i }).click();

    await expect(page.getByText(/this home screen hit an error/i)).toBeVisible();

    // The app is not blank — nav is still there and usable.
    await expect(page.getByRole('navigation', { name: /primary/i })).toBeVisible();
    await page.getByRole('link', { name: /train/i }).click();
    await expect(page.getByRole('heading', { name: /your training/i })).toBeVisible();
  });
});
