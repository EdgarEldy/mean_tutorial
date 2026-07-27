import { expect, test } from '@playwright/test';

test.describe('App shell', () => {
  test('loads the home page inside the Material sidenav shell', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('mat-sidenav-container')).toBeVisible();
    await expect(page.locator('app-sidebar')).toBeVisible();
    await expect(page.locator('app-topbar')).toBeVisible();
    await expect(page.locator('app-footer')).toBeVisible();
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('toggles the sidenav from the topbar menu button', async ({ page }) => {
    await page.goto('/');

    const sidenav = page.locator('mat-sidenav');
    await expect(sidenav).toHaveClass(/mat-drawer-opened/);

    await page.getByRole('button', { name: 'Toggle navigation' }).click();
  });
});
