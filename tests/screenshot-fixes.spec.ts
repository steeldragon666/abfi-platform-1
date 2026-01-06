import { test } from '@playwright/test';

test('Capture visual fix screenshots', async ({ page }) => {
  // Landing page - full
  await page.goto('http://localhost:3002/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'tests/screenshots/fix-01-landing-hero.png', fullPage: false });

  // Scroll to pathway cards
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'tests/screenshots/fix-02-pathway-cards.png' });

  // Scroll to intelligence teasers
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'tests/screenshots/fix-03-intelligence.png' });

  // Scroll to bottom CTA
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'tests/screenshots/fix-04-bottom-cta.png' });

  // For Growers page
  await page.goto('http://localhost:3002/for-growers');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'tests/screenshots/fix-05-for-growers.png', fullPage: true });

  // Bankability page
  await page.goto('http://localhost:3002/bankability');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'tests/screenshots/fix-06-bankability.png', fullPage: true });

  console.log('Screenshots captured successfully');
});
