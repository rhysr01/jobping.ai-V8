import { test, expect } from '@playwright/test';

/**
 * Debug Signup Form Tests
 * 
 * Simple tests to debug the signup form validation issues
 */

test.describe('Debug Signup Form', () => {
  test('Debug form validation step by step', async ({ page }) => {
    console.log('🚀 Debugging signup form validation');
    
    await page.goto('/signup?tier=free');
    
    // Check initial state
    const button = page.locator('button:has-text("Continue to Preferences")');
    await expect(button).toBeDisabled();
    console.log('✅ Initial state: button is disabled');
    
    // Fill name
    await page.fill('input[type="text"]', 'Test User');
    console.log('✅ Filled name');
    
    // Check button state after name
    const buttonAfterName = page.locator('button:has-text("Continue to Preferences")');
    await expect(buttonAfterName).toBeDisabled();
    console.log('✅ After name: button still disabled');
    
    // Fill email
    await page.fill('input[type="email"]', 'test@example.com');
    console.log('✅ Filled email');
    
    // Check button state after email
    const buttonAfterEmail = page.locator('button:has-text("Continue to Preferences")');
    await expect(buttonAfterEmail).toBeDisabled();
    console.log('✅ After email: button still disabled');
    
    // Select a city
    await page.locator('button:has-text("London")').click();
    console.log('✅ Selected London');
    
    // Check button state after city
    const buttonAfterCity = page.locator('button:has-text("Continue to Preferences")');
    await expect(buttonAfterCity).toBeDisabled();
    console.log('✅ After city: button still disabled');
    
    // Select a language
    await page.locator('button:has-text("English")').click();
    console.log('✅ Selected English');
    
    // Check button state after language
    const buttonAfterLanguage = page.locator('button:has-text("Continue to Preferences")');
    await expect(buttonAfterLanguage).toBeEnabled();
    console.log('✅ After language: button is enabled!');
    
    // Try to click
    await buttonAfterLanguage.click();
    console.log('✅ Clicked button successfully');
    
    // Check if we moved to next step
    await expect(page.locator('text=Your preferences')).toBeVisible();
    console.log('✅ Successfully moved to preferences step');
  });

  test('Debug form with different cities', async ({ page }) => {
    console.log('🚀 Debugging with different cities');
    
    await page.goto('/signup?tier=free');
    
    // Fill basic info
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    
    // Try different cities
    const cities = ['Dublin', 'Paris', 'Amsterdam'];
    for (const city of cities) {
      console.log(`Trying city: ${city}`);
      const cityButton = page.locator(`button:has-text("${city}")`);
      if (await cityButton.isVisible()) {
        await cityButton.click();
        console.log(`✅ Selected ${city}`);
      } else {
        console.log(`❌ City ${city} not found`);
      }
    }
    
    // Select language
    await page.locator('button:has-text("English")').click();
    console.log('✅ Selected English');
    
    // Check button state
    const button = page.locator('button:has-text("Continue to Preferences")');
    const isEnabled = await button.isEnabled();
    console.log(`Button enabled: ${isEnabled}`);
    
    if (isEnabled) {
      await button.click();
      console.log('✅ Button clicked successfully');
    }
  });

  test('Debug form validation logic', async ({ page }) => {
    console.log('🚀 Debugging form validation logic');
    
    await page.goto('/signup?tier=free');
    
    // Fill all required fields
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.locator('button:has-text("London")').click();
    await page.locator('button:has-text("English")').click();
    
    // Check the form data in the browser
    const formData = await page.evaluate(() => {
      // Try to access the form data from the React component
      const form = document.querySelector('form');
      if (form) {
        const formData = new FormData(form);
        return Object.fromEntries(formData.entries());
      }
      return null;
    });
    
    console.log('Form data:', formData);
    
    // Check if the button is enabled
    const button = page.locator('button:has-text("Continue to Preferences")');
    const isEnabled = await button.isEnabled();
    console.log(`Button enabled: ${isEnabled}`);
    
    // Check the button's disabled attribute
    const disabled = await button.getAttribute('disabled');
    console.log(`Button disabled attribute: ${disabled}`);
    
    // Check the button's classes
    const classes = await button.getAttribute('class');
    console.log(`Button classes: ${classes}`);
  });
});
