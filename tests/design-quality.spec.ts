/**
 * ABFI Platform - Premium Design Quality Tests
 * Using Playwright for advanced browser automation
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Premium Design Quality Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Set premium viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // Disable animations for consistent testing
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `
    });
  });

  test('Dashboard has premium spacing', async ({ page }) => {
    await page.goto('/grower/dashboard');

    // Check main container spacing
    const mainContainer = page.locator('main').first();
    const padding = await mainContainer.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        paddingTop: parseFloat(style.paddingTop),
        paddingBottom: parseFloat(style.paddingBottom),
        paddingLeft: parseFloat(style.paddingLeft),
        paddingRight: parseFloat(style.paddingRight)
      };
    });

    // Premium spacing requirements
    expect(padding.paddingTop).toBeGreaterThanOrEqual(32); // 2rem minimum
    expect(padding.paddingBottom).toBeGreaterThanOrEqual(32);
    expect(padding.paddingLeft).toBeGreaterThanOrEqual(24); // 1.5rem minimum
    expect(padding.paddingRight).toBeGreaterThanOrEqual(24);
  });

  test('Cards have generous internal spacing', async ({ page }) => {
    await page.goto('/grower/dashboard');

    const cards = page.locator('[class*="card"], [class*="Card"]');
    const cardCount = await cards.count();

    expect(cardCount).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = cards.nth(i);
      const padding = await card.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          paddingTop: parseFloat(style.paddingTop),
          paddingBottom: parseFloat(style.paddingBottom),
          paddingLeft: parseFloat(style.paddingLeft),
          paddingRight: parseFloat(style.paddingRight)
        };
      });

      // Premium card padding
      expect(padding.paddingTop).toBeGreaterThanOrEqual(24); // 1.5rem
      expect(padding.paddingBottom).toBeGreaterThanOrEqual(24);
      expect(padding.paddingLeft).toBeGreaterThanOrEqual(24);
      expect(padding.paddingRight).toBeGreaterThanOrEqual(24);
    }
  });

  test('Typography hierarchy is correct', async ({ page }) => {
    await page.goto('/grower/dashboard');

    // Check H1 is largest
    const h1 = page.locator('h1').first();
    const h1Size = await h1.evaluate(el => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.fontSize);
    });

    expect(h1Size).toBeGreaterThanOrEqual(32); // Minimum 2rem for H1

    // Check H2 is smaller than H1 but larger than body
    const h2Elements = page.locator('h2');
    if (await h2Elements.count() > 0) {
      const h2Size = await h2Elements.first().evaluate(el => {
        const style = window.getComputedStyle(el);
        return parseFloat(style.fontSize);
      });

      expect(h2Size).toBeLessThan(h1Size);
      expect(h2Size).toBeGreaterThanOrEqual(20); // Minimum 1.25rem
    }
  });

  test('No element overlaps detected', async ({ page }) => {
    await page.goto('/grower/dashboard');

    // Take screenshot and analyze for overlaps
    const screenshot = await page.screenshot({ fullPage: true });
    // In a real implementation, you'd use image analysis to detect overlaps
    // For now, we'll check for negative margins which often indicate overlaps

    const elementsWithNegativeMargins = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const problematic = [];

      elements.forEach((el, index) => {
        const style = window.getComputedStyle(el);
        const marginLeft = parseFloat(style.marginLeft) || 0;
        const marginTop = parseFloat(style.marginTop) || 0;

        if (marginLeft < -2 || marginTop < -2) {
          problematic.push({
            index,
            tagName: el.tagName,
            className: el.className,
            marginLeft,
            marginTop
          });
        }
      });

      return problematic;
    });

    expect(elementsWithNegativeMargins.length).toBe(0);
  });

  test('Contrast ratios meet WCAG AA standards', async ({ page }) => {
    await page.goto('/grower/dashboard');

    const contrastIssues = await page.evaluate(() => {
      function getLuminance(r: number, g: number, b: number): number {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }

      function getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
        const l1 = getLuminance(...color1);
        const l2 = getLuminance(...color2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      }

      const issues: Array<{element: string, contrast: number, required: number}> = [];
      const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, button');

      textElements.forEach((el, index) => {
        if (!el.textContent || el.textContent.trim().length === 0) return;

        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = parseFloat(style.fontWeight) || 400;

        const textColor = style.color;
        const bgColor = style.backgroundColor;

        const textMatch = textColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        const bgMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) ||
                       bgColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d\.]+\)/);

        if (textMatch && bgMatch) {
          const textRgb: [number, number, number] = [
            parseInt(textMatch[1]), parseInt(textMatch[2]), parseInt(textMatch[3])
          ];
          const bgRgb: [number, number, number] = [
            parseInt(bgMatch[1]), parseInt(bgMatch[2]), parseInt(bgMatch[3])
          ];

          const contrast = getContrastRatio(textRgb, bgRgb);
          const minContrast = fontSize >= 18 || fontWeight >= 700 ? 3.0 : 4.5;

          if (contrast < minContrast) {
            issues.push({
              element: `${el.tagName}[${index}]`,
              contrast: Math.round(contrast * 100) / 100,
              required: minContrast
            });
          }
        }
      });

      return issues;
    });

    expect(contrastIssues.length).toBe(0);

    if (contrastIssues.length > 0) {
      console.log('Contrast issues found:', contrastIssues);
    }
  });

  test('Interactive elements have premium hover states', async ({ page }) => {
    await page.goto('/grower/dashboard');

    const buttons = page.locator('button, [role="button"]').first();

    if (await buttons.count() > 0) {
      // Check initial state
      const initialTransform = await buttons.evaluate(el => window.getComputedStyle(el).transform);

      // Hover
      await buttons.hover();

      // Check hover state (should have scale or other premium effect)
      const hoverTransform = await buttons.evaluate(el => window.getComputedStyle(el).transform);

      // Premium buttons should have hover effects
      expect(hoverTransform).not.toBe(initialTransform);
    }
  });

  test('Layout is responsive and doesn't overflow', async ({ page }) => {
    await page.goto('/grower/dashboard');

    // Check for horizontal scroll
    const scrollWidth = await page.evaluate(() => {
      return {
        body: document.body.scrollWidth,
        window: window.innerWidth,
        hasHorizontalScroll: document.body.scrollWidth > window.innerWidth
      };
    });

    expect(scrollWidth.hasHorizontalScroll).toBe(false);

    if (scrollWidth.hasHorizontalScroll) {
      console.log(`Horizontal overflow detected: ${scrollWidth.body}px content in ${scrollWidth.window}px window`);
    }
  });

  test('Premium cursor effects are present', async ({ page }) => {
    await page.goto('/grower/dashboard');

    // Check for custom cursor styles
    const hasPremiumCursor = await page.evaluate(() => {
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
      let hasCursorEffects = false;

      styles.forEach(style => {
        const content = style.textContent || '';
        if (content.includes('--cursor-scale') ||
            content.includes('--cursor-shadow') ||
            content.includes('cursor: pointer') && content.includes('scale')) {
          hasCursorEffects = true;
        }
      });

      return hasCursorEffects;
    });

    expect(hasPremiumCursor).toBe(true);
  });
});