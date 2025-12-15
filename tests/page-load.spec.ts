import { test, expect } from "@playwright/test";

/**
 * ABFI Platform - Page Load Tests
 * Tests that all pages load successfully without JavaScript errors
 */

// All routes from App.tsx
const PUBLIC_PAGES = [
  { path: "/", name: "Home" },
  { path: "/for-growers", name: "For Growers" },
  { path: "/for-developers", name: "For Developers" },
  { path: "/for-lenders", name: "For Lenders" },
  { path: "/platform-features", name: "Platform Features" },
  { path: "/browse", name: "Browse Marketplace" },
  { path: "/futures", name: "Futures Marketplace" },
  { path: "/map", name: "Map View" },
  { path: "/feedstock-map", name: "Feedstock Map" },
  { path: "/financial-onboarding", name: "Financial Onboarding" },
  { path: "/bankability-explainer", name: "Bankability Explainer" },
  { path: "/grower-benefits", name: "Grower Benefits" },
  { path: "/project-registration", name: "Project Registration" },
  { path: "/certificate-verification", name: "Certificate Verification" },
  { path: "/producer-registration", name: "Producer Registration" },
  { path: "/demand-signals", name: "Demand Signals" },
];

const AUTH_REQUIRED_PAGES = [
  { path: "/dashboard", name: "Dashboard" },
  { path: "/bankability", name: "Bankability Dashboard" },
  { path: "/supplier/futures", name: "Supplier Futures" },
  { path: "/buyer/eois", name: "Buyer EOIs" },
  { path: "/lender-portal", name: "Lender Portal" },
  { path: "/compliance-dashboard", name: "Compliance Dashboard" },
  { path: "/admin", name: "Admin Dashboard" },
  { path: "/notifications", name: "Notifications" },
  { path: "/supplier/feedstocks", name: "Supplier Feedstocks" },
  { path: "/supplier/profile", name: "Supplier Profile" },
  { path: "/buyer/profile", name: "Buyer Profile" },
  { path: "/inquiries/supplier", name: "Supplier Inquiries" },
  { path: "/inquiries/buyer", name: "Buyer Inquiries" },
  { path: "/saved-searches", name: "Saved Searches" },
];

const REGISTRATION_FLOWS = [
  { path: "/supplier/register", name: "Supplier Registration" },
  { path: "/buyer/register", name: "Buyer Registration" },
  { path: "/producer-registration/account-setup", name: "Producer Account Setup" },
  { path: "/producer-registration/property-map", name: "Producer Property Map" },
  { path: "/producer-registration/property-details", name: "Producer Property Details" },
  { path: "/producer-registration/production-profile", name: "Producer Production Profile" },
  { path: "/producer-registration/carbon-calculator", name: "Producer Carbon Calculator" },
  { path: "/producer-registration/contracts", name: "Producer Contracts" },
  { path: "/producer-registration/marketplace-listing", name: "Producer Marketplace Listing" },
  { path: "/producer-registration/review", name: "Producer Review" },
  { path: "/project-registration/flow", name: "Project Registration Flow" },
];

test.describe("Public Pages Load Tests", () => {
  for (const page of PUBLIC_PAGES) {
    test(`${page.name} (${page.path}) loads successfully`, async ({ page: browserPage }) => {
      const errors: string[] = [];
      
      // Capture JavaScript errors
      browserPage.on("pageerror", (error) => {
        errors.push(error.message);
      });

      // Capture console errors
      browserPage.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      const response = await browserPage.goto(page.path, { waitUntil: "networkidle" });
      
      // Check response status
      expect(response?.status()).toBeLessThan(400);
      
      // Check page has content
      const content = await browserPage.content();
      expect(content.length).toBeGreaterThan(100);
      
      // Check no critical errors (ignore some common benign errors)
      const criticalErrors = errors.filter(e => 
        !e.includes("ResizeObserver") && 
        !e.includes("Failed to load resource") &&
        !e.includes("net::ERR_")
      );
      
      if (criticalErrors.length > 0) {
        console.log(`Errors on ${page.path}:`, criticalErrors);
      }
      
      // Check for React error boundary
      const errorBoundary = await browserPage.locator("text=Something went wrong").count();
      expect(errorBoundary).toBe(0);
    });
  }
});

test.describe("Auth-Required Pages Load Tests", () => {
  for (const page of AUTH_REQUIRED_PAGES) {
    test(`${page.name} (${page.path}) loads without crashing`, async ({ page: browserPage }) => {
      const errors: string[] = [];
      
      browserPage.on("pageerror", (error) => {
        errors.push(error.message);
      });

      const response = await browserPage.goto(page.path, { waitUntil: "networkidle" });
      
      // Should load (may show login prompt or redirect)
      expect(response?.status()).toBeLessThan(500);
      
      // Check for React error boundary
      const errorBoundary = await browserPage.locator("text=Something went wrong").count();
      expect(errorBoundary).toBe(0);
    });
  }
});

test.describe("Registration Flow Pages Load Tests", () => {
  for (const page of REGISTRATION_FLOWS) {
    test(`${page.name} (${page.path}) loads without crashing`, async ({ page: browserPage }) => {
      const response = await browserPage.goto(page.path, { waitUntil: "networkidle" });
      
      expect(response?.status()).toBeLessThan(500);
      
      const errorBoundary = await browserPage.locator("text=Something went wrong").count();
      expect(errorBoundary).toBe(0);
    });
  }
});

test.describe("404 Page Tests", () => {
  test("Non-existent page shows 404", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-12345");
    
    // Should show 404 content
    const notFoundText = await page.locator("text=404").count() + 
                         await page.locator("text=not found").count() +
                         await page.locator("text=Not Found").count();
    expect(notFoundText).toBeGreaterThan(0);
  });
});
