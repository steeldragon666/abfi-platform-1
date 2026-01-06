import { test, expect } from "@playwright/test";

test.describe("ABFI redesign smoke flows", () => {
  test("landing page primary CTAs navigate", async ({ page }) => {
    await page.goto("/");

    const startAssessment = page.getByRole("link", {
      name: /start market assessment/i,
    });
    await expect(startAssessment).toBeVisible();
    await startAssessment.click();
    await expect(page).toHaveURL(/\/explore/);

    await page.goto("/");
    const browseMarketplace = page.getByRole("link", {
      name: /explore marketplace/i,
    });
    await expect(browseMarketplace).toBeVisible();
    await browseMarketplace.click();
    await expect(page).toHaveURL(/\/browse/);
  });

  test("explore flow shows profiler controls", async ({ page }) => {
    await page.goto("/explore");

    await expect(
      page.getByRole("heading", { name: /what best describes your role/i })
    ).toBeVisible();

    const firstOption = page.getByRole("button", {
      name: /feedstock producer/i,
    });
    await expect(firstOption).toBeVisible();
  });

  test("design vision layout loads with trust and intelligence rails", async ({
    page,
  }) => {
    await page.goto("/design-vision");

    await expect(
      page.getByRole("heading", { name: /sovereign market infrastructure/i })
    ).toBeVisible();

    const railToggle = page.getByRole("button", { name: /collapse/i });
    await expect(railToggle).toBeVisible();
    await railToggle.click();
    await expect(page.getByRole("button", { name: /open/i })).toBeVisible();
  });
});
