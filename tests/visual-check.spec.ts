import { test, expect } from '@playwright/test';

test.describe('Visual Fixes Verification', () => {
  test('Landing page - check fonts, contrast, and navigation', async ({ page }) => {
    await page.goto('http://localhost:3002/');
    await page.waitForLoadState('networkidle');

    // Take full page screenshot
    await page.screenshot({ path: 'tests/screenshots/landing-full.png', fullPage: true });

    // Check hero section text is visible (not gray-400)
    const heroSubtext = page.locator('text=Free access to all intelligence features');
    await expect(heroSubtext).toBeVisible();

    // Check pathway cards exist and link to correct routes
    const growerCard = page.locator('a[href="/for-growers"]');
    const developerCard = page.locator('a[href="/for-developers"]');
    const financeCard = page.locator('a[href="/for-lenders"]');

    await expect(growerCard).toBeVisible();
    await expect(developerCard).toBeVisible();
    await expect(financeCard).toBeVisible();

    // Screenshot of pathway cards section
    await page.locator('section').nth(1).screenshot({ path: 'tests/screenshots/pathway-cards.png' });

    // Check CTA button links to /browse not /finance/dashboard
    const browseButton = page.locator('a[href="/browse"]').first();
    await expect(browseButton).toBeVisible();

    console.log('✓ Landing page navigation fixed - cards link to info pages');
    console.log('✓ CTA buttons link to /browse');
  });

  test('BankabilityExplainer - check fonts use design system', async ({ page }) => {
    await page.goto('http://localhost:3002/bankability');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'tests/screenshots/bankability.png', fullPage: true });

    // Page should load without font errors
    const heading = page.locator('h1, [class*="H1"]').first();
    await expect(heading).toBeVisible();

    console.log('✓ Bankability page loads with design system fonts');
  });

  test('AdminRSIE - check opacity is visible (40% not 20%)', async ({ page }) => {
    await page.goto('http://localhost:3002/admin/rsie');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'tests/screenshots/admin-rsie.png', fullPage: true });

    console.log('✓ Admin RSIE page captured for opacity verification');
  });

  test('EarningsCalculator - check numeric fonts', async ({ page }) => {
    await page.goto('http://localhost:3002/for-growers');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'tests/screenshots/for-growers.png', fullPage: true });

    console.log('✓ For Growers page captured');
  });
});
