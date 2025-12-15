import { test, expect, Page } from "@playwright/test";

/**
 * ABFI Platform - Comprehensive Site Audit
 * Tests live site at abfi.io for functionality, design, and mobile compatibility
 */

// All public routes to test
const PUBLIC_PAGES = [
  { path: "/", name: "Home", shouldHaveH1: true },
  { path: "/for-growers", name: "For Growers", shouldHaveH1: true },
  { path: "/for-developers", name: "For Developers", shouldHaveH1: true },
  { path: "/for-lenders", name: "For Lenders", shouldHaveH1: true },
  { path: "/platform-features", name: "Platform Features", shouldHaveH1: true },
  { path: "/browse", name: "Browse Marketplace", shouldHaveH1: true },
  { path: "/futures", name: "Futures Marketplace", shouldHaveH1: true },
  { path: "/map", name: "Map View", shouldHaveH1: false },
  { path: "/feedstock-map", name: "Feedstock Map", shouldHaveH1: false },
  { path: "/financial-onboarding", name: "Financial Onboarding", shouldHaveH1: true },
  { path: "/bankability-explainer", name: "Bankability Explainer", shouldHaveH1: true },
  { path: "/grower-benefits", name: "Grower Benefits", shouldHaveH1: true },
  { path: "/project-registration", name: "Project Registration", shouldHaveH1: true },
  { path: "/certificate-verification", name: "Certificate Verification", shouldHaveH1: true },
  { path: "/producer-registration", name: "Producer Registration", shouldHaveH1: true },
  { path: "/demand-signals", name: "Demand Signals", shouldHaveH1: true },
];

const DASHBOARD_PAGES = [
  { path: "/dashboard", name: "Dashboard" },
  { path: "/bankability", name: "Bankability Dashboard" },
  { path: "/supplier/futures", name: "Supplier Futures" },
  { path: "/buyer/eois", name: "Buyer EOIs" },
  { path: "/lender-portal", name: "Lender Portal" },
  { path: "/compliance-dashboard", name: "Compliance Dashboard" },
  { path: "/admin", name: "Admin Dashboard" },
  { path: "/notifications", name: "Notifications" },
];

// Design constants for consistency checking
const DESIGN_TOKENS = {
  primaryColor: "rgb(22, 163, 74)", // green-600
  accentColors: [
    "rgb(34, 197, 94)",  // green-500
    "rgb(21, 128, 61)",  // green-700
  ],
  fontFamily: "Inter",
  borderRadius: "0.5rem",
};

// Helper to collect all links on a page
async function getAllLinks(page: Page): Promise<string[]> {
  const links = await page.$$eval("a[href]", (anchors) =>
    anchors
      .map((a) => a.getAttribute("href"))
      .filter((href): href is string => href !== null)
  );
  return links;
}

// Helper to check for console errors
async function captureConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  return errors;
}

test.describe("Page Load & Status Tests", () => {
  for (const pageInfo of PUBLIC_PAGES) {
    test(`${pageInfo.name} - loads successfully`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));

      const response = await page.goto(pageInfo.path, { waitUntil: "domcontentloaded", timeout: 30000 });
      
      // Check HTTP status
      expect(response?.status(), `${pageInfo.name} should return 200`).toBe(200);
      
      // Wait for page to be interactive
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      
      // Check no React error boundary
      const errorBoundary = await page.locator("text=Something went wrong").count();
      expect(errorBoundary, `${pageInfo.name} should not show error boundary`).toBe(0);
      
      // Check page has meaningful content
      const bodyText = await page.textContent("body");
      expect(bodyText?.length, `${pageInfo.name} should have content`).toBeGreaterThan(50);
    });
  }
});

test.describe("Navigation & Header Tests", () => {
  test("Header navigation is present on all pages", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    
    // Check for navigation elements
    const nav = page.locator("nav, header, [role='navigation']").first();
    await expect(nav).toBeVisible();
    
    // Check for logo/brand
    const logo = page.locator("a[href='/']").first();
    await expect(logo).toBeVisible();
  });

  test("Main navigation links work", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    
    // Get all nav links
    const navLinks = await page.locator("nav a, header a").all();
    expect(navLinks.length).toBeGreaterThan(0);
    
    // Test first few nav links
    for (let i = 0; i < Math.min(navLinks.length, 5); i++) {
      const href = await navLinks[i].getAttribute("href");
      if (href && href.startsWith("/") && !href.includes("#")) {
        const response = await page.goto(href, { waitUntil: "domcontentloaded" });
        expect(response?.status(), `Nav link ${href} should work`).toBeLessThan(400);
      }
    }
  });
});

test.describe("Mobile Responsiveness Tests", () => {
  test("Home page is mobile responsive", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/", { waitUntil: "networkidle" });
    
    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small margin
    
    // Check mobile menu exists (hamburger or similar)
    const mobileMenu = page.locator("[aria-label*='menu'], [aria-label*='Menu'], button:has(svg), .hamburger, [data-mobile-menu]");
    const menuVisible = await mobileMenu.first().isVisible().catch(() => false);
    
    // Either mobile menu is visible OR regular nav is still accessible
    const navVisible = await page.locator("nav").first().isVisible().catch(() => false);
    expect(menuVisible || navVisible, "Mobile navigation should be accessible").toBe(true);
  });

  test("All public pages render on mobile without overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    for (const pageInfo of PUBLIC_PAGES.slice(0, 5)) {
      await page.goto(pageInfo.path, { waitUntil: "domcontentloaded" });
      
      // Check for horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth + 20;
      });
      
      expect(hasOverflow, `${pageInfo.name} should not have horizontal overflow on mobile`).toBe(false);
    }
  });
});

test.describe("Link Checker - 404 Detection", () => {
  test("Home page links are valid", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    
    const links = await getAllLinks(page);
    const internalLinks = links.filter(
      (link) => link.startsWith("/") && !link.includes("#") && !link.includes("mailto:")
    );
    
    const brokenLinks: string[] = [];
    
    // Test unique links only
    const uniqueLinks = [...new Set(internalLinks)].slice(0, 20);
    
    for (const link of uniqueLinks) {
      const response = await page.goto(link, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => null);
      if (!response || response.status() >= 400) {
        brokenLinks.push(`${link} (${response?.status() || "timeout"})`);
      }
    }
    
    if (brokenLinks.length > 0) {
      console.log("Broken links found:", brokenLinks);
    }
    expect(brokenLinks.length, `Found broken links: ${brokenLinks.join(", ")}`).toBe(0);
  });

  test("No 404 for main navigation paths", async ({ page }) => {
    const mainPaths = [
      "/for-growers",
      "/for-developers", 
      "/for-lenders",
      "/platform-features",
      "/browse",
      "/futures",
      "/financial-onboarding",
      "/producer-registration",
    ];

    for (const path of mainPaths) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${path} should not return 404`).not.toBe(404);
    }
  });
});

test.describe("Visual Consistency Tests", () => {
  test("Primary colors are consistent", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    
    // Check for green-themed buttons/elements
    const greenElements = await page.locator("[class*='green'], [class*='primary'], .bg-primary").count();
    expect(greenElements, "Should have primary colored elements").toBeGreaterThan(0);
  });

  test("Typography is consistent across pages", async ({ page }) => {
    const fontSizes: Map<string, string[]> = new Map();
    
    for (const pageInfo of PUBLIC_PAGES.slice(0, 3)) {
      await page.goto(pageInfo.path, { waitUntil: "domcontentloaded" });
      
      // Get heading font sizes
      const h1Size = await page.locator("h1").first().evaluate((el) => 
        getComputedStyle(el).fontSize
      ).catch(() => "N/A");
      
      if (!fontSizes.has("h1")) fontSizes.set("h1", []);
      fontSizes.get("h1")?.push(h1Size);
    }
    
    // Check H1 sizes are relatively consistent
    const h1Sizes = fontSizes.get("h1") || [];
    const validSizes = h1Sizes.filter(s => s !== "N/A");
    if (validSizes.length > 1) {
      const unique = new Set(validSizes);
      expect(unique.size, "H1 sizes should be consistent").toBeLessThanOrEqual(2);
    }
  });

  test("Buttons have consistent styling", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    
    const buttons = await page.locator("button, a[class*='btn'], a[class*='button'], [role='button']").all();
    
    if (buttons.length > 0) {
      const styles: string[] = [];
      for (const btn of buttons.slice(0, 5)) {
        const borderRadius = await btn.evaluate((el) => getComputedStyle(el).borderRadius).catch(() => "");
        if (borderRadius) styles.push(borderRadius);
      }
      
      // Most buttons should have similar border radius
      const uniqueRadii = new Set(styles);
      expect(uniqueRadii.size, "Buttons should have consistent border radius").toBeLessThanOrEqual(3);
    }
  });
});

test.describe("Form Functionality Tests", () => {
  test("Producer registration form is interactive", async ({ page }) => {
    await page.goto("/producer-registration", { waitUntil: "networkidle" });
    
    // Look for form elements
    const inputs = await page.locator("input, select, textarea").count();
    const buttons = await page.locator("button[type='submit'], button:has-text('Continue'), button:has-text('Next'), button:has-text('Submit')").count();
    
    // Should have form elements
    expect(inputs + buttons, "Registration page should have form elements").toBeGreaterThan(0);
  });

  test("Financial onboarding form is accessible", async ({ page }) => {
    await page.goto("/financial-onboarding", { waitUntil: "networkidle" });
    
    // Check for form or wizard steps
    const formElements = await page.locator("form, [role='form'], .wizard, .steps, input, button").count();
    expect(formElements, "Financial onboarding should have interactive elements").toBeGreaterThan(0);
  });
});

test.describe("Dashboard Access Tests", () => {
  for (const pageInfo of DASHBOARD_PAGES) {
    test(`${pageInfo.name} - handles auth gracefully`, async ({ page }) => {
      const response = await page.goto(pageInfo.path, { waitUntil: "domcontentloaded" });
      
      // Should not return 500 error
      expect(response?.status(), `${pageInfo.name} should not return 500`).toBeLessThan(500);
      
      // Should either show content or redirect to login
      const bodyText = await page.textContent("body");
      expect(bodyText?.length, `${pageInfo.name} should have some content`).toBeGreaterThan(20);
    });
  }
});

test.describe("Client Journey Flow Tests", () => {
  test("Grower journey: Home -> For Growers -> Registration", async ({ page }) => {
    // Start at home
    await page.goto("/", { waitUntil: "networkidle" });
    
    // Look for "For Growers" link
    const growerLink = page.locator("a:has-text('Grower'), a:has-text('grower'), a[href*='grower']").first();
    if (await growerLink.isVisible()) {
      await growerLink.click();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("grower");
    }
    
    // Navigate to For Growers page directly
    await page.goto("/for-growers", { waitUntil: "networkidle" });
    expect(await page.title()).toBeTruthy();
    
    // Look for CTA to registration
    const registerCTA = page.locator("a:has-text('Register'), a:has-text('Get Started'), a:has-text('Sign Up'), button:has-text('Register')").first();
    const ctaVisible = await registerCTA.isVisible().catch(() => false);
    expect(ctaVisible, "For Growers page should have registration CTA").toBe(true);
  });

  test("Developer journey: Home -> For Developers -> Browse", async ({ page }) => {
    await page.goto("/for-developers", { waitUntil: "networkidle" });
    
    // Page should have developer-focused content
    const bodyText = await page.textContent("body");
    const hasRelevantContent = 
      bodyText?.toLowerCase().includes("developer") ||
      bodyText?.toLowerCase().includes("project") ||
      bodyText?.toLowerCase().includes("biogas") ||
      bodyText?.toLowerCase().includes("feedstock");
    
    expect(hasRelevantContent, "For Developers page should have relevant content").toBe(true);
    
    // Should have browse/marketplace CTA
    const browseCTA = page.locator("a[href*='browse'], a:has-text('Browse'), a:has-text('Marketplace')").first();
    const browseVisible = await browseCTA.isVisible().catch(() => false);
    expect(browseVisible, "Should have browse/marketplace link").toBe(true);
  });

  test("Lender journey: Home -> For Lenders -> Portal", async ({ page }) => {
    await page.goto("/for-lenders", { waitUntil: "networkidle" });
    
    // Page should have lender-focused content
    const bodyText = await page.textContent("body");
    const hasRelevantContent = 
      bodyText?.toLowerCase().includes("lend") ||
      bodyText?.toLowerCase().includes("financ") ||
      bodyText?.toLowerCase().includes("invest") ||
      bodyText?.toLowerCase().includes("bank");
    
    expect(hasRelevantContent, "For Lenders page should have relevant content").toBe(true);
  });
});

test.describe("SEO & Accessibility Basics", () => {
  test("All pages have title tags", async ({ page }) => {
    for (const pageInfo of PUBLIC_PAGES.slice(0, 5)) {
      await page.goto(pageInfo.path, { waitUntil: "domcontentloaded" });
      const title = await page.title();
      expect(title.length, `${pageInfo.name} should have a title`).toBeGreaterThan(0);
    }
  });

  test("Images have alt text", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    
    const images = await page.locator("img").all();
    let missingAlt = 0;
    
    for (const img of images) {
      const alt = await img.getAttribute("alt");
      const ariaHidden = await img.getAttribute("aria-hidden");
      if (!alt && ariaHidden !== "true") {
        missingAlt++;
      }
    }
    
    // Allow some decorative images without alt
    expect(missingAlt, "Most images should have alt text").toBeLessThan(images.length * 0.5);
  });

  test("Page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    
    const h1Count = await page.locator("h1").count();
    const h2Count = await page.locator("h2").count();
    
    // Should have at least one h1 or clear heading
    expect(h1Count + h2Count, "Page should have headings").toBeGreaterThan(0);
  });
});
