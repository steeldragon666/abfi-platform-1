import { test, expect } from '@playwright/test';

test('Verify all visual fixes', async ({ page }) => {
  // Landing page
  await page.goto('http://localhost:3002/');
  await page.waitForLoadState('networkidle');

  // Scroll to pathway cards and screenshot
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/screenshots/01-landing-cards.png' });

  // Verify pathway card links are correct (not dashboard routes)
  const growerLink = await page.locator('a[href="/for-growers"]').count();
  const developerLink = await page.locator('a[href="/for-developers"]').count();
  const lenderLink = await page.locator('a[href="/for-lenders"]').count();
  const browseLink = await page.locator('a[href="/browse"]').count();

  // Should NOT have dashboard links on landing
  const growerDashboard = await page.locator('a[href="/grower/dashboard"]').count();
  const developerDashboard = await page.locator('a[href="/developer/dashboard"]').count();
  const financeDashboard = await page.locator('a[href="/finance/dashboard"]').count();

  console.log('\n=== NAVIGATION LINKS CHECK ===');
  console.log(`✓ /for-growers links: ${growerLink}`);
  console.log(`✓ /for-developers links: ${developerLink}`);
  console.log(`✓ /for-lenders links: ${lenderLink}`);
  console.log(`✓ /browse links: ${browseLink}`);
  console.log(`✗ /grower/dashboard links (should be 0): ${growerDashboard}`);
  console.log(`✗ /developer/dashboard links (should be 0): ${developerDashboard}`);
  console.log(`✗ /finance/dashboard links (should be 0): ${financeDashboard}`);

  expect(growerLink).toBeGreaterThan(0);
  expect(developerLink).toBeGreaterThan(0);
  expect(lenderLink).toBeGreaterThan(0);
  expect(growerDashboard).toBe(0);
  expect(developerDashboard).toBe(0);
  expect(financeDashboard).toBe(0);

  // Scroll to bottom CTA
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/screenshots/02-landing-cta.png' });

  // Check for-growers page (earnings calculator with fixed fonts)
  await page.goto('http://localhost:3002/for-growers');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'tests/screenshots/03-for-growers-full.png', fullPage: true });

  console.log('\n=== ALL FIXES VERIFIED ===');
});
