/**
 * MedLink Playwright Smoke Tests
 * ================================
 * These tests run against the production-preview build served at 127.0.0.1:4173.
 * They verify the SPA shell loads and key routes are reachable.
 * We test the HTML shell (what the server delivers) rather than React-rendered
 * content, because Playwright starts before hydration completes in a fast CI env.
 */
import { test, expect } from '@playwright/test';

// Helper — wait for the page to be at least partially loaded
async function waitForLoad(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
}

test.describe('MedLink SPA smoke tests', () => {

  test('root URL returns 200 and delivers an HTML shell', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    expect(response?.status()).toBeLessThan(400);
    const body = await page.content();
    expect(body).toContain('<html');
    expect(body.length).toBeGreaterThan(100);
  });

  test('HTML shell contains the root mount point', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const root = page.locator('#root');
    await expect(root).toBeAttached({ timeout: 10000 });
  });

  test('get-started route is served without 404', async ({ page }) => {
    const response = await page.goto('/get-started', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);
  });

  test('login route is served without 404', async ({ page }) => {
    const response = await page.goto('/login', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);
  });

  test('role-selection route is served without 404', async ({ page }) => {
    const response = await page.goto('/role-selection', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);
  });

  test('signup route is served without 404', async ({ page }) => {
    const response = await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);
  });

  test('page title is set by the app', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    // Title is either the app name or empty — both are fine; just not an error page
    expect(title).not.toMatch(/404|not found|error/i);
  });

  test('React root mounts (non-empty #root after JS load)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => null);
    await waitForLoad(page);
    const html = await page.content();
    // After hydration the #root div must contain child nodes
    const rootContent = await page.evaluate(() => {
      const el = document.getElementById('root');
      return el ? el.innerHTML.length : 0;
    });
    expect(rootContent).toBeGreaterThan(0);
  });

  test('no JavaScript console errors on root load', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));
    await page.goto('/', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => null);
    // Filter out known non-critical warnings
    const critical = jsErrors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('favicon')
    );
    expect(critical).toHaveLength(0);
  });

  test('SPA serves same HTML for unknown deep route (client-side routing)', async ({ page }) => {
    const rootResp = await page.goto('/', { waitUntil: 'domcontentloaded' });
    const deepResp = await page.goto('/patient/search', { waitUntil: 'domcontentloaded' });
    // Both should return 200 — the server rewrites all paths to index.html
    expect(rootResp?.status()).toBe(200);
    expect(deepResp?.status()).toBe(200);
  });

  test('page viewport renders without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => null);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });
});
