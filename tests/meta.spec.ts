import { test, expect } from '@playwright/test';

test.describe('Meta Tags and External Links', () => {
  test('OG/Twitter + external link rel', async ({ page }) => {
    await page.goto('/');
    const head = await page.locator('head');
    await expect(head.locator('meta[property="og:image"]')).toHaveCount(1);
    for (const a of await page.locator('a[target="_blank"]').all())
      await expect(a).toHaveAttribute('rel', /noopener/);
  });
});
