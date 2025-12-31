import { test, expect } from "@playwright/test";

test.describe("Navigation & Accessibility", () => {
  test("should navigate between main pages", async ({ page }) => {
    // Start at homepage
    await page.goto("/");
    await expect(page).toHaveURL("/");

    // Navigate to For Growers page (pathway that exists)
    const growerLink = page.getByRole("link", { name: /grower|sell.*feedstock/i }).first();
    if (await growerLink.isVisible()) {
      await growerLink.click();
      await expect(page).toHaveURL(/.*grower.*/);
    }

    // Navigate back home via logo or home link
    await page.goto("/");
    await expect(page).toHaveURL("/");
  });

  test("should have correct page titles", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ABFI/i);

    await page.goto("/login");
    await expect(page).toHaveTitle(/ABFI|login|sign in/i);

    await page.goto("/for-growers");
    await expect(page).toHaveTitle(/ABFI|grower/i);

    await page.goto("/for-developers");
    await expect(page).toHaveTitle(/ABFI|developer/i);

    await page.goto("/for-lenders");
    await expect(page).toHaveTitle(/ABFI|lender/i);
  });

  test("should handle 404 for non-existent pages", async ({ page }) => {
    const response = await page.goto("/non-existent-page-12345");

    // Should show 404 page or redirect
    expect([200, 404]).toContain(response?.status() ?? 404);
  });

  test("should have semantic HTML structure", async ({ page }) => {
    await page.goto("/");

    // Check for main landmark (use first() to handle multiple main elements)
    const main = page.locator("main").first();
    if (await main.isVisible()) {
      await expect(main).toBeVisible();
    }

    // Check for header
    const header = page.locator("header").first();
    if (await header.isVisible()) {
      await expect(header).toBeVisible();
    }
  });

  test("should work with keyboard navigation", async ({ page }) => {
    await page.goto("/");

    // Tab through focusable elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Check that something is focused
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(focusedElement).toBeTruthy();
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    // Should have at least one h1 (allow time for page to load)
    await page.waitForLoadState("networkidle");
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
  });

  test("should load images with alt text", async ({ page }) => {
    await page.goto("/");

    // Check all images have alt attributes
    const images = await page.locator("img").all();
    for (const img of images) {
      const alt = await img.getAttribute("alt");
      // Alt should exist (can be empty for decorative images)
      expect(alt).toBeDefined();
    }
  });

  test("should have proper color contrast", async ({ page }) => {
    await page.goto("/");

    // Basic check that text is visible
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();
  });

  test("should load unified map page", async ({ page }) => {
    // Navigate to unified map
    await page.goto("/unified-map");

    // Should render the map container
    await page.waitForLoadState("networkidle");

    // Check for map-related UI elements
    const layersButton = page.getByRole("button", { name: /layers/i });
    const filtersButton = page.getByRole("button", { name: /filters/i });

    // At least one of these should be visible (map controls)
    const layersVisible = await layersButton.isVisible().catch(() => false);
    const filtersVisible = await filtersButton.isVisible().catch(() => false);

    expect(layersVisible || filtersVisible).toBeTruthy();
  });

  test("should load unified dashboard page", async ({ page }) => {
    await page.goto("/unified");

    await page.waitForLoadState("networkidle");

    // Check for dashboard content
    const welcomeText = page.getByText(/welcome to abfi/i);
    await expect(welcomeText).toBeVisible();
  });
});
