import { test, expect } from '@playwright/test';

test.describe('offline-first PWA', () => {
  test('the app shell opens with no network once the service worker is ready', async ({
    page,
    context,
  }) => {
    // First visit: onboarding is the shell on a fresh device.
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'FORGE' })).toBeVisible();
    await page.waitForFunction(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.ready;
      return Boolean(reg.active);
    });

    // Kill the network and reload from cache.
    await context.setOffline(true);
    await page.reload();

    await expect(page.getByRole('heading', { name: 'FORGE' })).toBeVisible();
    await expect(page.getByText('WELCOME TO')).toBeVisible();

    await context.setOffline(false);
  });
});
