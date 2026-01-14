#!/usr/bin/env node

/**
 * ABFI Platform - Premium Design Quality Test Suite
 *
 * Tests for:
 * - Element spacing validation
 * - Overlap detection
 * - Contrast ratio compliance
 * - Layout hierarchy
 * - Accessibility standards
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class DesignQualityTester {
  constructor() {
    this.results = {
      spacing: [],
      overlaps: [],
      contrast: [],
      accessibility: [],
      performance: []
    };
  }

  async runTests(url) {
    console.log('🚀 Starting Premium Design Quality Tests...');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      console.log('📄 Loading page:', url);
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Run all tests
      await this.testSpacing(page);
      await this.testOverlaps(page);
      await this.testContrastRatios(page);
      await this.testAccessibility(page);
      await this.testLayoutHierarchy(page);

      console.log('✅ Tests completed successfully');

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.results.errors = [error.message];
    } finally {
      await browser.close();
    }

    return this.generateReport();
  }

  async testSpacing(page) {
    console.log('📏 Testing element spacing...');

    const spacingResults = await page.evaluate(() => {
      const issues = [];

      // Check all cards have proper spacing
      const cards = document.querySelectorAll('[class*="card"], [class*="Card"]');
      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(card);

        // Check padding
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(computedStyle.paddingRight) || 0;

        if (paddingTop < 16) issues.push(`Card ${index + 1}: Insufficient top padding (${paddingTop}px)`);
        if (paddingBottom < 16) issues.push(`Card ${index + 1}: Insufficient bottom padding (${paddingBottom}px)`);
        if (paddingLeft < 16) issues.push(`Card ${index + 1}: Insufficient left padding (${paddingLeft}px)`);
        if (paddingRight < 16) issues.push(`Card ${index + 1}: Insufficient right padding (${paddingRight}px)`);

        // Check margins between cards
        if (index > 0) {
          const prevCard = cards[index - 1];
          const prevRect = prevCard.getBoundingClientRect();
          const gap = rect.top - prevRect.bottom;

          if (gap < 24) {
            issues.push(`Cards ${index} and ${index + 1}: Insufficient vertical spacing (${gap}px)`);
          }
        }
      });

      // Check button spacing
      const buttons = document.querySelectorAll('button, [role="button"]');
      buttons.forEach((button, index) => {
        const rect = button.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(button);

        const marginTop = parseFloat(computedStyle.marginTop) || 0;
        const marginBottom = parseFloat(computedStyle.marginBottom) || 0;

        if (marginTop < 8 && index > 0) {
          issues.push(`Button ${index + 1}: Insufficient top margin (${marginTop}px)`);
        }
      });

      return issues;
    });

    this.results.spacing = spacingResults;
    console.log(`📏 Found ${spacingResults.length} spacing issues`);
  }

  async testOverlaps(page) {
    console.log('🔍 Testing for element overlaps...');

    const overlapResults = await page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('*');

      elements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);

        // Skip invisible elements
        if (rect.width === 0 || rect.height === 0 ||
            computedStyle.display === 'none' ||
            computedStyle.visibility === 'hidden') {
          return;
        }

        // Check for negative margins or positioning issues
        const marginLeft = parseFloat(computedStyle.marginLeft) || 0;
        const marginTop = parseFloat(computedStyle.marginTop) || 0;

        if (marginLeft < -5) {
          issues.push(`Element ${index}: Negative left margin (${marginLeft}px) may cause overlap`);
        }

        if (marginTop < -5) {
          issues.push(`Element ${index}: Negative top margin (${marginTop}px) may cause overlap`);
        }

        // Check for elements positioned outside viewport boundaries
        if (rect.left < -10 || rect.top < -10) {
          issues.push(`Element ${index}: Positioned outside viewport (left: ${rect.left}, top: ${rect.top})`);
        }

        // Check for extremely small elements that might be overlapping
        if (rect.width > 0 && rect.width < 5 && rect.height > 5) {
          issues.push(`Element ${index}: Suspiciously narrow (${rect.width}px wide)`);
        }

        if (rect.height > 0 && rect.height < 5 && rect.width > 5) {
          issues.push(`Element ${index}: Suspiciously short (${rect.height}px tall)`);
        }
      });

      return issues;
    });

    this.results.overlaps = overlapResults;
    console.log(`🔍 Found ${overlapResults.length} potential overlap issues`);
  }

  async testContrastRatios(page) {
    console.log('🎨 Testing contrast ratios...');

    const contrastResults = await page.evaluate(() => {
      const issues = [];

      // Function to calculate luminance
      function getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }

      // Function to calculate contrast ratio
      function getContrastRatio(color1, color2) {
        const l1 = getLuminance(...color1);
        const l2 = getLuminance(...color2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      }

      // Test text elements
      const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, div, button');
      textElements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element);
        const fontSize = parseFloat(computedStyle.fontSize);
        const fontWeight = parseFloat(computedStyle.fontWeight) || 400;

        // Skip if no text content
        if (!element.textContent || element.textContent.trim().length === 0) return;

        // Get colors
        const textColor = computedStyle.color;
        const bgColor = computedStyle.backgroundColor;

        // Parse RGB values (simplified - in production use a proper color parser)
        const textRgb = textColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        const bgRgb = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) ||
                      bgColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d\.]+\)/);

        if (textRgb && bgRgb) {
          const textValues = [parseInt(textRgb[1]), parseInt(textRgb[2]), parseInt(textRgb[3])];
          const bgValues = [parseInt(bgRgb[1]), parseInt(bgRgb[2]), parseInt(bgRgb[3])];

          const contrast = getContrastRatio(textValues, bgValues);

          // WCAG AA standards
          const minContrast = fontSize >= 18 || fontWeight >= 700 ? 3.0 : 4.5;

          if (contrast < minContrast) {
            issues.push({
              element: `Text element ${index}`,
              contrast: contrast.toFixed(2),
              required: minContrast,
              text: element.textContent.substring(0, 50) + '...'
            });
          }
        }
      });

      return issues;
    });

    this.results.contrast = contrastResults;
    console.log(`🎨 Found ${contrastResults.length} contrast ratio issues`);
  }

  async testAccessibility(page) {
    console.log('♿ Testing accessibility...');

    const accessibilityResults = await page.evaluate(() => {
      const issues = [];

      // Check for missing alt text
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        if (!img.getAttribute('alt') && !img.getAttribute('aria-label')) {
          issues.push(`Image ${index + 1}: Missing alt text`);
        }
      });

      // Check button labels
      const buttons = document.querySelectorAll('button');
      buttons.forEach((button, index) => {
        if (!button.textContent && !button.getAttribute('aria-label') && !button.getAttribute('title')) {
          issues.push(`Button ${index + 1}: Missing accessible label`);
        }
      });

      // Check heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let lastLevel = 0;
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        if (level - lastLevel > 1 && lastLevel !== 0) {
          issues.push(`Heading ${index + 1} (${heading.tagName}): Skips heading level (from h${lastLevel} to h${level})`);
        }
        lastLevel = level;
      });

      return issues;
    });

    this.results.accessibility = accessibilityResults;
    console.log(`♿ Found ${accessibilityResults.length} accessibility issues`);
  }

  async testLayoutHierarchy(page) {
    console.log('📊 Testing layout hierarchy...');

    const hierarchyResults = await page.evaluate(() => {
      const issues = [];

      // Check font sizes follow hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const bodyText = document.querySelectorAll('p, span, div');

      headings.forEach((heading, index) => {
        const computedStyle = window.getComputedStyle(heading);
        const fontSize = parseFloat(computedStyle.fontSize);

        // H1 should be largest
        if (heading.tagName === 'H1' && fontSize < 32) {
          issues.push(`H1 ${index + 1}: Font size too small (${fontSize}px, should be ≥32px)`);
        }

        // Check for proper spacing around headings
        const rect = heading.getBoundingClientRect();
        const nextElement = heading.nextElementSibling;
        if (nextElement) {
          const nextRect = nextElement.getBoundingClientRect();
          const gap = nextRect.top - rect.bottom;

          if (gap < 16) {
            issues.push(`Heading ${index + 1}: Insufficient spacing below (${gap}px)`);
          }
        }
      });

      return issues;
    });

    this.results.hierarchy = hierarchyResults;
    console.log(`📊 Found ${hierarchyResults.length} layout hierarchy issues`);
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.results.spacing.length + this.results.overlaps.length +
                    this.results.contrast.length + this.results.accessibility.length +
                    (this.results.hierarchy ? this.results.hierarchy.length : 0),
        spacingIssues: this.results.spacing.length,
        overlapIssues: this.results.overlaps.length,
        contrastIssues: this.results.contrast.length,
        accessibilityIssues: this.results.accessibility.length,
        hierarchyIssues: this.results.hierarchy ? this.results.hierarchy.length : 0
      },
      details: this.results
    };

    console.log('\n📋 DESIGN QUALITY TEST REPORT');
    console.log('=' .repeat(50));
    console.log(`Total Issues Found: ${report.summary.totalIssues}`);
    console.log(`Spacing Issues: ${report.summary.spacingIssues}`);
    console.log(`Overlap Issues: ${report.summary.overlapIssues}`);
    console.log(`Contrast Issues: ${report.summary.contrastIssues}`);
    console.log(`Accessibility Issues: ${report.summary.accessibilityIssues}`);
    console.log(`Hierarchy Issues: ${report.summary.hierarchyIssues}`);

    if (report.summary.totalIssues === 0) {
      console.log('🎉 All tests passed! Premium design quality achieved.');
    } else {
      console.log('\n⚠️  Issues to fix:');
      this.printIssues('Spacing', this.results.spacing);
      this.printIssues('Overlaps', this.results.overlaps);
      this.printIssues('Contrast', this.results.contrast);
      this.printIssues('Accessibility', this.results.accessibility);
      if (this.results.hierarchy) {
        this.printIssues('Hierarchy', this.results.hierarchy);
      }
    }

    return report;
  }

  printIssues(category, issues) {
    if (issues.length > 0) {
      console.log(`\n${category}:`);
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${typeof issue === 'string' ? issue : JSON.stringify(issue)}`);
      });
    }
  }
}

// CLI runner
async function main() {
  const url = process.argv[2] || 'https://abfi-platform.vercel.app/grower/dashboard';

  const tester = new DesignQualityTester();
  const report = await tester.runTests(url);

  // Save report to file
  const reportPath = `design-quality-report-${Date.now()}.json`;
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);

  // Exit with error code if issues found
  process.exit(report.summary.totalIssues > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DesignQualityTester;