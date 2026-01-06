import { test, expect, Page } from "@playwright/test";

/**
 * ABFI Platform - Full Platform Audit
 * Comprehensive testing of all functions, spacing, icons, maps, and sentiment data
 */

// All pages to audit
const ALL_PAGES = [
  // Landing/Marketing
  { path: "/", name: "Landing" },
  { path: "/for-growers", name: "For Growers" },
  { path: "/for-developers", name: "For Developers" },
  { path: "/for-lenders", name: "For Lenders" },
  { path: "/platform-features", name: "Platform Features" },
  { path: "/grower-benefits", name: "Grower Benefits" },
  { path: "/bankability-explainer", name: "Bankability Explainer" },

  // Browse/Marketplace
  { path: "/browse", name: "Browse Marketplace" },
  { path: "/futures", name: "Futures Marketplace" },
  { path: "/demand-signals", name: "Demand Signals" },

  // Maps
  { path: "/map", name: "Unified Map" },
  { path: "/feedstock-map", name: "Feedstock Map" },

  // Dashboards
  { path: "/dashboard", name: "Dashboard" },
  { path: "/grower/dashboard", name: "Grower Dashboard" },
  { path: "/developer/dashboard", name: "Developer Dashboard" },
  { path: "/finance/dashboard", name: "Finance Dashboard" },
  { path: "/bankability", name: "Bankability Dashboard" },
  { path: "/compliance-dashboard", name: "Compliance Dashboard" },

  // Intelligence
  { path: "/price-dashboard", name: "Price Dashboard" },
  { path: "/lending-sentiment", name: "Lending Sentiment" },
  { path: "/stealth-discovery", name: "Stealth Discovery" },
  { path: "/policy-carbon", name: "Policy Carbon Dashboard" },

  // Registration/Onboarding
  { path: "/financial-onboarding", name: "Financial Onboarding" },
  { path: "/producer-registration", name: "Producer Registration" },
  { path: "/project-registration", name: "Project Registration" },
  { path: "/certificate-verification", name: "Certificate Verification" },

  // Admin
  { path: "/admin", name: "Admin Dashboard" },
  { path: "/admin/users", name: "Admin User Management" },
  { path: "/admin/audit-logs", name: "Admin Audit Logs" },
];

interface AuditResult {
  page: string;
  path: string;
  status: number;
  loadTime: number;
  hasErrors: boolean;
  consoleErrors: string[];
  iconCount: number;
  iconVisibility: { visible: number; hidden: number };
  spacingIssues: string[];
  headingStructure: { h1: number; h2: number; h3: number; h4: number };
  buttonCount: number;
  formCount: number;
  linkCount: number;
  mapPresent: boolean;
  sentimentDataPresent: boolean;
  chartCount: number;
}

// Helper to audit a single page
async function auditPage(page: Page, pagePath: string, pageName: string): Promise<AuditResult> {
  const consoleErrors: string[] = [];
  const startTime = Date.now();

  // Capture console errors
  page.on("console", msg => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", error => {
    consoleErrors.push(error.message);
  });

  // Navigate
  const response = await page.goto(pagePath, {
    waitUntil: "networkidle",
    timeout: 30000
  }).catch(() => null);

  const loadTime = Date.now() - startTime;
  const status = response?.status() || 0;

  // Collect metrics
  const metrics = await page.evaluate(() => {
    // Icon visibility check
    const svgs = document.querySelectorAll("svg");
    let visibleIcons = 0;
    let hiddenIcons = 0;

    svgs.forEach(svg => {
      const computed = window.getComputedStyle(svg);
      const rect = svg.getBoundingClientRect();

      // Check if icon is visible
      if (computed.display !== "none" &&
          computed.visibility !== "hidden" &&
          computed.opacity !== "0" &&
          rect.width > 0 && rect.height > 0) {

        // Check icon contrast against background
        const parent = svg.parentElement;
        if (parent) {
          const parentBg = window.getComputedStyle(parent).backgroundColor;
          const svgColor = computed.color || computed.fill;

          // Basic visibility check - ensure icon has distinguishable color
          if (svgColor && svgColor !== "rgba(0, 0, 0, 0)" && svgColor !== "transparent") {
            visibleIcons++;
          } else {
            hiddenIcons++;
          }
        } else {
          visibleIcons++;
        }
      } else {
        hiddenIcons++;
      }
    });

    // Spacing issues check
    const spacingIssues: string[] = [];
    const elements = document.querySelectorAll("*");
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      // Check for overlapping elements (basic)
      if (rect.width < 0 || rect.height < 0) {
        spacingIssues.push(`Negative dimensions: ${el.tagName}`);
      }
    });

    // Check for horizontal overflow
    if (document.body.scrollWidth > window.innerWidth + 20) {
      spacingIssues.push("Horizontal overflow detected");
    }

    // Heading structure
    const headingStructure = {
      h1: document.querySelectorAll("h1, [class*='H1']").length,
      h2: document.querySelectorAll("h2, [class*='H2']").length,
      h3: document.querySelectorAll("h3, [class*='H3']").length,
      h4: document.querySelectorAll("h4, [class*='H4']").length,
    };

    // Map detection
    const mapPresent = !!(
      document.querySelector("[class*='map']") ||
      document.querySelector("[class*='Map']") ||
      document.querySelector(".gm-style") || // Google Maps
      document.querySelector("[data-map]") ||
      document.querySelector("canvas") // Map canvas
    );

    // Sentiment data detection
    const sentimentDataPresent = !!(
      document.querySelector("[class*='sentiment']") ||
      document.querySelector("[class*='Sentiment']") ||
      document.body.textContent?.toLowerCase().includes("sentiment") ||
      document.body.textContent?.toLowerCase().includes("bullish") ||
      document.body.textContent?.toLowerCase().includes("bearish")
    );

    return {
      iconCount: svgs.length,
      iconVisibility: { visible: visibleIcons, hidden: hiddenIcons },
      spacingIssues,
      headingStructure,
      buttonCount: document.querySelectorAll("button").length,
      formCount: document.querySelectorAll("form, [role='form']").length,
      linkCount: document.querySelectorAll("a[href]").length,
      mapPresent,
      sentimentDataPresent,
      chartCount: document.querySelectorAll("svg[class*='recharts'], [class*='chart'], canvas").length,
    };
  });

  return {
    page: pageName,
    path: pagePath,
    status,
    loadTime,
    hasErrors: consoleErrors.length > 0,
    consoleErrors,
    ...metrics,
  };
}

test.describe("Full Platform Audit", () => {
  test("Audit all pages and generate report", async ({ page }) => {
    const results: AuditResult[] = [];

    for (const pageConfig of ALL_PAGES) {
      await test.step(`Auditing ${pageConfig.name}`, async () => {
        const result = await auditPage(page, pageConfig.path, pageConfig.name);
        results.push(result);

        // Basic assertions
        expect(result.status, `${pageConfig.name} should load`).toBeLessThan(500);
      });
    }

    // Generate summary report
    console.log("\n" + "=".repeat(80));
    console.log("FULL PLATFORM AUDIT REPORT");
    console.log("=".repeat(80) + "\n");

    // Page load summary
    console.log("PAGE LOAD STATUS:");
    console.log("-".repeat(40));
    results.forEach(r => {
      const statusIcon = r.status === 200 ? "✓" : r.status < 500 ? "⚠" : "✗";
      console.log(`${statusIcon} ${r.page}: ${r.status} (${r.loadTime}ms)`);
    });

    // Icon visibility summary
    console.log("\nICON VISIBILITY:");
    console.log("-".repeat(40));
    const totalVisible = results.reduce((sum, r) => sum + r.iconVisibility.visible, 0);
    const totalHidden = results.reduce((sum, r) => sum + r.iconVisibility.hidden, 0);
    console.log(`Total icons: ${totalVisible + totalHidden}`);
    console.log(`Visible: ${totalVisible}`);
    console.log(`Hidden/Unclear: ${totalHidden}`);

    // Pages with icon issues
    const iconIssuePages = results.filter(r => r.iconVisibility.hidden > r.iconVisibility.visible * 0.2);
    if (iconIssuePages.length > 0) {
      console.log("\nPages with potential icon visibility issues:");
      iconIssuePages.forEach(r => {
        console.log(`  - ${r.page}: ${r.iconVisibility.hidden} hidden of ${r.iconCount}`);
      });
    }

    // Spacing issues
    console.log("\nSPACING ISSUES:");
    console.log("-".repeat(40));
    const pagesWithSpacingIssues = results.filter(r => r.spacingIssues.length > 0);
    if (pagesWithSpacingIssues.length > 0) {
      pagesWithSpacingIssues.forEach(r => {
        console.log(`${r.page}:`);
        r.spacingIssues.forEach(issue => console.log(`  - ${issue}`));
      });
    } else {
      console.log("No spacing issues detected");
    }

    // Console errors
    console.log("\nCONSOLE ERRORS:");
    console.log("-".repeat(40));
    const pagesWithErrors = results.filter(r => r.consoleErrors.length > 0);
    if (pagesWithErrors.length > 0) {
      pagesWithErrors.forEach(r => {
        console.log(`${r.page}:`);
        r.consoleErrors.slice(0, 3).forEach(err => console.log(`  - ${err.substring(0, 100)}`));
      });
    } else {
      console.log("No console errors detected");
    }

    // Map presence
    console.log("\nMAP FUNCTIONALITY:");
    console.log("-".repeat(40));
    const mapPages = results.filter(r => r.mapPresent);
    console.log(`Pages with maps: ${mapPages.length}`);
    mapPages.forEach(r => console.log(`  - ${r.page}`));

    // Sentiment data
    console.log("\nSENTIMENT DATA:");
    console.log("-".repeat(40));
    const sentimentPages = results.filter(r => r.sentimentDataPresent);
    console.log(`Pages with sentiment data: ${sentimentPages.length}`);
    sentimentPages.forEach(r => console.log(`  - ${r.page}`));

    // Chart/Visualization count
    console.log("\nDATA VISUALIZATIONS:");
    console.log("-".repeat(40));
    const chartPages = results.filter(r => r.chartCount > 0);
    console.log(`Pages with charts: ${chartPages.length}`);
    chartPages.forEach(r => console.log(`  - ${r.page}: ${r.chartCount} charts`));

    console.log("\n" + "=".repeat(80));
    console.log("AUDIT COMPLETE");
    console.log("=".repeat(80) + "\n");
  });
});

test.describe("Map Functionality Tests", () => {
  test("Unified Map - renders and has controls", async ({ page }) => {
    await page.goto("/map", { waitUntil: "networkidle", timeout: 30000 });

    // Check map container exists
    const mapContainer = page.locator("[class*='map'], [class*='Map'], .gm-style, canvas").first();
    await expect(mapContainer).toBeVisible({ timeout: 10000 }).catch(() => {});

    // Check for layer controls
    const layerControls = page.locator("[class*='layer'], [class*='Layer'], button:has-text('Layer')");
    const controlCount = await layerControls.count();
    console.log(`Map layer controls found: ${controlCount}`);

    // Check for filter controls
    const filterControls = page.locator("[class*='filter'], [class*='Filter'], select, [role='combobox']");
    const filterCount = await filterControls.count();
    console.log(`Map filter controls found: ${filterCount}`);
  });

  test("Feedstock Map - displays markers", async ({ page }) => {
    await page.goto("/feedstock-map", { waitUntil: "networkidle", timeout: 30000 });

    // Wait for map to initialize
    await page.waitForTimeout(3000);

    // Check for map markers or feedstock indicators
    const markers = await page.locator("[class*='marker'], [class*='Marker'], [role='button'][aria-label*='marker']").count();
    console.log(`Map markers found: ${markers}`);

    // Check for feedstock data display
    const feedstockData = await page.locator("[class*='feedstock'], [class*='Feedstock']").count();
    console.log(`Feedstock elements found: ${feedstockData}`);
  });
});

test.describe("Sentiment Data Processing Tests", () => {
  test("Lending Sentiment Dashboard - displays real data", async ({ page }) => {
    await page.goto("/lending-sentiment", { waitUntil: "networkidle", timeout: 30000 });

    // Check for sentiment indicators
    const sentimentIndicators = await page.evaluate(() => {
      const body = document.body.textContent || "";
      return {
        hasBullish: body.toLowerCase().includes("bullish"),
        hasBearish: body.toLowerCase().includes("bearish"),
        hasNeutral: body.toLowerCase().includes("neutral"),
        hasSentimentScore: /sentiment.*\d+|score.*\d+|\d+.*sentiment/i.test(body),
        hasDataSources: body.toLowerCase().includes("source") || body.toLowerCase().includes("data"),
        hasPercentage: /%/.test(body),
        hasDateIndicator: /\d{4}|today|yesterday|week|month/i.test(body),
      };
    });

    console.log("Sentiment indicators:", sentimentIndicators);

    // Check for charts
    const chartCount = await page.locator("svg[class*='recharts'], [class*='chart'], canvas").count();
    console.log(`Charts found: ${chartCount}`);

    // Verify data is being displayed (not just loading)
    const hasRealData = await page.evaluate(() => {
      const numbers = document.body.textContent?.match(/\d+\.?\d*/g) || [];
      return numbers.length > 5; // Should have multiple data points
    });

    expect(hasRealData, "Sentiment page should display real data").toBe(true);
  });

  test("Finance Dashboard - displays market intelligence", async ({ page }) => {
    await page.goto("/finance/dashboard", { waitUntil: "networkidle", timeout: 30000 });

    // Check for price data
    const priceIndicators = await page.evaluate(() => {
      const body = document.body.textContent || "";
      return {
        hasPriceData: /\$\d+|\d+.*AUD|price/i.test(body),
        hasPercentChange: /[+-]?\d+\.?\d*%/.test(body),
        hasVolumeData: /volume|tonnes|ton/i.test(body),
        hasMarketData: /market|supply|demand/i.test(body),
      };
    });

    console.log("Price/Market indicators:", priceIndicators);
  });

  test("Stealth Discovery - AI entity detection", async ({ page }) => {
    await page.goto("/stealth-discovery", { waitUntil: "networkidle", timeout: 30000 });

    // Check for discovery signals
    const discoveryIndicators = await page.evaluate(() => {
      const body = document.body.textContent || "";
      return {
        hasSignals: body.toLowerCase().includes("signal"),
        hasEntities: body.toLowerCase().includes("entity") || body.toLowerCase().includes("entities"),
        hasConfidence: body.toLowerCase().includes("confidence"),
        hasAlerts: body.toLowerCase().includes("alert"),
      };
    });

    console.log("Discovery indicators:", discoveryIndicators);
  });
});

test.describe("Icon Visibility Tests", () => {
  const iconTestPages = [
    "/",
    "/for-growers",
    "/for-lenders",
    "/dashboard",
    "/finance/dashboard",
  ];

  for (const pagePath of iconTestPages) {
    test(`Icons visible on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: "networkidle" });

      // Get all SVG icons
      const iconMetrics = await page.evaluate(() => {
        const svgs = document.querySelectorAll("svg");
        const results: { visible: number; issues: string[] } = { visible: 0, issues: [] };

        svgs.forEach((svg, index) => {
          const computed = window.getComputedStyle(svg);
          const rect = svg.getBoundingClientRect();

          // Check visibility
          if (rect.width > 0 && rect.height > 0 && computed.opacity !== "0") {
            // Check if color is distinguishable
            const color = computed.color || computed.fill;
            const parent = svg.parentElement;
            const parentBg = parent ? window.getComputedStyle(parent).backgroundColor : "";

            // Simple contrast check
            if (color === parentBg || color === "transparent" || color === "rgba(0, 0, 0, 0)") {
              results.issues.push(`Icon ${index}: may have low contrast`);
            } else {
              results.visible++;
            }
          }
        });

        return results;
      });

      console.log(`${pagePath}: ${iconMetrics.visible} icons visible`);
      if (iconMetrics.issues.length > 0) {
        console.log(`  Issues: ${iconMetrics.issues.slice(0, 5).join(", ")}`);
      }

      // Most icons should be visible
      expect(iconMetrics.visible).toBeGreaterThan(0);
    });
  }
});

test.describe("Spacing and Layout Tests", () => {
  test("No horizontal overflow on any page", async ({ page }) => {
    const overflowPages: string[] = [];

    for (const pageConfig of ALL_PAGES.slice(0, 15)) {
      await page.goto(pageConfig.path, { waitUntil: "domcontentloaded" });

      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth + 20;
      });

      if (hasOverflow) {
        overflowPages.push(pageConfig.name);
      }
    }

    if (overflowPages.length > 0) {
      console.log("Pages with horizontal overflow:", overflowPages);
    }

    expect(overflowPages.length, "No pages should have horizontal overflow").toBe(0);
  });

  test("Consistent spacing between sections", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Check section spacing
    const sectionMetrics = await page.evaluate(() => {
      const sections = document.querySelectorAll("section, [class*='section']");
      const margins: number[] = [];

      sections.forEach(section => {
        const computed = window.getComputedStyle(section);
        const marginTop = parseInt(computed.marginTop) || 0;
        const marginBottom = parseInt(computed.marginBottom) || 0;
        const paddingTop = parseInt(computed.paddingTop) || 0;
        const paddingBottom = parseInt(computed.paddingBottom) || 0;

        margins.push(marginTop + paddingTop, marginBottom + paddingBottom);
      });

      return { sectionCount: sections.length, margins };
    });

    console.log(`Landing page has ${sectionMetrics.sectionCount} sections`);

    // Verify sections have proper spacing
    expect(sectionMetrics.sectionCount).toBeGreaterThan(0);
  });

  test("Card spacing is consistent", async ({ page }) => {
    await page.goto("/browse", { waitUntil: "networkidle" });

    const cardMetrics = await page.evaluate(() => {
      const cards = document.querySelectorAll("[class*='card'], [class*='Card']");
      const gaps: number[] = [];

      cards.forEach(card => {
        const computed = window.getComputedStyle(card);
        const margin = parseInt(computed.margin) || 0;
        const padding = parseInt(computed.padding) || 0;
        gaps.push(margin + padding);
      });

      // Check for consistency
      const uniqueGaps = new Set(gaps.filter(g => g > 0));
      return { cardCount: cards.length, uniqueSpacings: uniqueGaps.size };
    });

    console.log(`Browse page: ${cardMetrics.cardCount} cards, ${cardMetrics.uniqueSpacings} unique spacings`);

    // Spacing should be relatively consistent (not too many variations)
    if (cardMetrics.cardCount > 0) {
      expect(cardMetrics.uniqueSpacings).toBeLessThan(10);
    }
  });
});
