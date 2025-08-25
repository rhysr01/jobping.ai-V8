import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should have no critical or serious violations', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical'
    );
    const seriousViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
    expect(seriousViolations).toHaveLength(0);
  });

  test('should have exactly one h1 element', async ({ page }) => {
    await page.goto('/');
    const h1Elements = await page.locator('h1').count();
    expect(h1Elements).toBe(1);
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.locator(':focus');
    const computedStyle = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).outline
    );
    
    expect(computedStyle).not.toBe('none');
  });

  test('should have valid alt text for images', async ({ page }) => {
    await page.goto('/');
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper form labels
    const inputs = await page.locator('input, select, textarea').all();
    for (const input of inputs) {
      const hasLabel = await input.evaluate(el => {
        const id = el.getAttribute('id');
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledby = el.getAttribute('aria-labelledby');
        return id || ariaLabel || ariaLabelledby;
      });
      expect(hasLabel).toBeTruthy();
    }
  });
});
