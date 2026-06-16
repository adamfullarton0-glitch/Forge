import { test, expect } from '@playwright/test';

test.describe('offline-first PWA', () => {
  test('the app shell opens with no network once the service worker is ready', async ({
    page,
    context,
  }) => {
    // First visit: let the service worker install and precache the shell.
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /forge yourself/i })).toBeVisible();
    await page.waitForFunction(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.ready;
      return Boolean(reg.active);
    });

    // Kill the network and reload from cache.
    await context.setOffline(true);
    await page.reload();

    await expect(page.getByRole('heading', { name: /forge yourself/i })).toBeVisible();
    await expect(page.getByRole('navigation', { name: /primary/i })).toBeVisible();

    await context.setOffline(false);
  });
});
