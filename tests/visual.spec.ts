import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  const viewports = [
    { width: 360, height: 640, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1440, height: 900, name: 'desktop' }
  ];

  for (const viewport of viewports) {
    test(`Homepage should match baseline at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of full page
      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test(`Pricing section should match baseline at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/#pricing');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of pricing section
      const pricingSection = page.locator('#pricing');
      await expect(pricingSection).toHaveScreenshot(`pricing-${viewport.name}.png`, {
        animations: 'disabled'
      });
    });

    test(`Preview section should match baseline at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/#preview');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of preview section
      const previewSection = page.locator('#preview');
      await expect(previewSection).toHaveScreenshot(`preview-${viewport.name}.png`, {
        animations: 'disabled'
      });
    });
  }

  test('Sample email should match baseline', async ({ page }) => {
    await page.goto('/sample-email.html');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('sample-email.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Legal pages should match baseline', async ({ page }) => {
    const legalPages = [
      { url: '/legal/privacy-policy', name: 'privacy-policy' },
      { url: '/legal/terms-of-service', name: 'terms-of-service' },
      { url: '/legal/unsubscribe', name: 'unsubscribe' }
    ];

    for (const legalPage of legalPages) {
      await page.goto(legalPage);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot(`${legalPage.name}.png`, {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });
});
