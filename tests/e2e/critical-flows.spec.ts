import { test, expect } from '@playwright/test';

/**
 * Critical E2E Tests for JobPing
 * 
 * Tests the most important user flows to identify bugs and regressions
 */

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/');
  });

  test('Homepage loads correctly and displays all sections', async ({ page }) => {
    // Check if all main sections are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="how-it-works"]')).toBeVisible();
    await expect(page.locator('[data-testid="pricing"]')).toBeVisible();
    
    // Check for key messaging
    await expect(page.locator('h1:has-text("Land your first job faster")')).toBeVisible();
    await expect(page.locator('text=Weekly job matches')).toBeVisible();
  });

  test('Pricing section displays correctly with both tiers', async ({ page }) => {
    // Navigate to pricing section
    await page.locator('text=Pricing').click();
    
    // Check free tier
    await expect(page.locator('h3:has-text("Free")')).toBeVisible();
    await expect(page.locator('text=5 roles/week')).toBeVisible();
    await expect(page.locator('text=10 roles on signup')).toBeVisible();
    
    // Check premium tier
    await expect(page.locator('text=Premium')).toBeVisible();
    await expect(page.locator('text=15 roles/week')).toBeVisible();
    await expect(page.locator('text=€7/month')).toBeVisible();
    
    // Check CTA buttons
    await expect(page.locator('text=Start Free')).toBeVisible();
    await expect(page.locator('text=Get Premium Now')).toBeVisible();
  });

  test('Signup flow works for free tier', async ({ page }) => {
    // Click free tier CTA
    await page.locator('text=Start Free').click();
    
    // Should navigate to signup page
    await expect(page).toHaveURL(/.*signup.*tier=free/);
    
    // Check if signup form elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Continue to Preferences")')).toBeVisible();
  });

  test('Signup flow works for premium tier', async ({ page }) => {
    // Click premium tier CTA
    await page.locator('text=Get Premium Now').click();
    
    // Should navigate to upgrade page
    await expect(page).toHaveURL(/.*upgrade/);
    
    // Check if upgrade form elements are present
    await expect(page.locator('text=Premium')).toBeVisible();
  });

  test('Navigation works correctly', async ({ page }) => {
    // Test logo click
    await page.locator('[data-testid="logo"]').click();
    await expect(page).toHaveURL('/');
    
    // Test navigation links
    const navLinks = [
      { text: 'How it works', href: '#how-it-works' },
      { text: 'Pricing', href: '#pricing' }
    ];
    
    for (const link of navLinks) {
      await page.locator(`text=${link.text}`).click();
      await expect(page).toHaveURL(new RegExp(link.href));
    }
  });

  test('Mobile responsiveness works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile navigation works
    await expect(page.locator('h1:has-text("No logins. Zero scrolling. Jobs in your inbox.")')).toBeVisible();
    
    // Check if pricing cards stack properly
    await page.locator('text=Pricing').click();
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Premium')).toBeVisible();
  });

  test('Error pages handle gracefully', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    await expect(page.locator('text=404')).toBeVisible();
    
    // Test that we can navigate back
    await page.goBack();
    await expect(page).toHaveURL('/');
  });
});

test.describe('API Endpoints', () => {
  test('Health check endpoint works', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(['healthy', 'degraded']).toContain(data.status);
  });

  test('Match users endpoint requires authentication', async ({ request }) => {
    const response = await request.post('/api/match-users');
    expect(response.status()).toBe(401);
  });

  test('Webhook endpoints handle invalid data gracefully', async ({ request }) => {
    const response = await request.post('/api/webhook-tally', {
      data: { invalid: 'data' }
    });
    // Should return 400, 422, or 404 for invalid data
    expect([400, 422, 404]).toContain(response.status());
  });
});

test.describe('Performance Tests', () => {
  test('Homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('Images load correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check for broken images
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      await expect(img).toHaveAttribute('src');
      
      // Check if image loads without errors
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });
});

test.describe('Accessibility Tests', () => {
  test('Page has proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for proper heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('Form elements have proper labels', async ({ page }) => {
    await page.goto('/signup?tier=free');
    
    // Check email input has label
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Check if input is properly labeled
    const labels = page.locator('label[for]');
    await expect(labels.first()).toBeVisible();
  });
});

test.describe('Cross-browser Compatibility', () => {
  test('Works in Chrome', async ({ page, browserName }) => {
    await page.goto('/');
    await expect(page.locator('h1:has-text("No logins. Zero scrolling. Jobs in your inbox.")')).toBeVisible();
  });

  test('Works in Firefox', async ({ page, browserName }) => {
    await page.goto('/');
    await expect(page.locator('h1:has-text("No logins. Zero scrolling. Jobs in your inbox.")')).toBeVisible();
  });

  test('Works in Safari', async ({ page, browserName }) => {
    await page.goto('/');
    await expect(page.locator('h1:has-text("No logins. Zero scrolling. Jobs in your inbox.")')).toBeVisible();
  });
});
