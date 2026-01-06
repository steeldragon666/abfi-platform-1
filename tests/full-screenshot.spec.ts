import { test } from '@playwright/test';

test('Full page screenshots', async ({ page }) => {
  // Landing page - full
  await page.goto('http://localhost:3002/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tests/screenshots/landing-complete.png', fullPage: true });

  console.log('Full landing page screenshot captured');
});
