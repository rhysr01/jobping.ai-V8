import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('Homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Run axe accessibility tests
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Preview section should not have accessibility violations', async ({ page }) => {
    await page.goto('/#preview');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Run axe accessibility tests
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Pricing section should not have accessibility violations', async ({ page }) => {
    await page.goto('/#pricing');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Run axe accessibility tests
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Legal pages should not have accessibility violations', async ({ page }) => {
    const legalPages = [
      '/legal/privacy-policy',
      '/legal/terms-of-service',
      '/legal/unsubscribe'
    ];

    for (const legalPage of legalPages) {
      await page.goto(legalPage);
      await page.waitForLoadState('networkidle');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('Keyboard navigation should work', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test skip link
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.locator('#pricing')).toBeInViewport();
  });

  test('Focus management should work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Test focus-visible on buttons
    const buttons = page.locator('button, a[role="button"]');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      await buttons.nth(i).focus();
      await expect(buttons.nth(i)).toBeFocused();
    }
  });
});