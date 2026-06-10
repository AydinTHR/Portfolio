// Admin panel + mobile nav audit against the isolated e2e stack (port 5174).
// Run: node e2e/audit-admin.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const OUT = '/tmp/audit-admin';
mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:5174';
const EMAIL = 'e2e-admin@portfolio-ci.dev';
const PASSWORD = 'e2e-password-123';

const browser = await chromium.launch();
const issues = [];

// --- Mobile nav (hamburger) ---
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const burger = page.locator('.nav__toggle, .hamburger, [aria-label*="menu" i]').first();
  if ((await burger.count()) === 0) {
    issues.push('mobile: no hamburger button found');
  } else {
    await burger.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/mobile-menu-open.png` });
    const aboutLink = page.locator('nav a, .nav__menu a', { hasText: 'About' }).first();
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await page.waitForTimeout(1200);
      const y = await page.evaluate(() => window.scrollY);
      const menuStillOpen = await page.evaluate(() => {
        const m = document.querySelector('.nav__menu, .nav__links');
        return m ? getComputedStyle(m).visibility !== 'hidden' && m.getBoundingClientRect().height > 100 : false;
      });
      issues.push(`mobile menu: click About -> scrollY=${y} (want >0), menu still open=${menuStillOpen} (want false)`);
      await page.screenshot({ path: `${OUT}/mobile-after-nav-click.png` });
    } else {
      issues.push('mobile menu: About link not visible after opening hamburger');
    }
  }
  await page.close();
}

// --- Admin panel, desktop ---
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.click('.admin-fab');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/admin-login.png` });
  await page.fill('.admin-login input[type="email"]', EMAIL);
  await page.fill('.admin-login input[type="password"]', PASSWORD);
  await page.click('.admin-login button[type="submit"]');
  await page.waitForSelector('.admin-tabs', { timeout: 10000 });
  await page.waitForTimeout(1200); // draft restore settle

  const tabs = await page.locator('.admin-tabs button, .admin-tabs .admin-tab').allTextContents();
  issues.push(`admin tabs found: ${JSON.stringify(tabs)}`);

  for (const tab of tabs) {
    await page.locator('.admin-tabs button, .admin-tabs .admin-tab', { hasText: tab }).first().click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/admin-${tab.toLowerCase().replace(/[^a-z]/g, '')}.png` });
  }
  await page.close();
}

// --- Admin panel on a small laptop (1280x680) and mobile ---
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.click('.admin-fab');
  await page.waitForTimeout(400);
  await page.fill('.admin-login input[type="email"]', EMAIL);
  await page.fill('.admin-login input[type="password"]', PASSWORD);
  await page.click('.admin-login button[type="submit"]');
  await page.waitForSelector('.admin-tabs', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/admin-mobile-hero.png` });
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  issues.push(`admin mobile horizontal overflow: ${overflowX}px (want 0)`);
  await page.close();
}

console.log('=== ADMIN AUDIT NOTES ===');
issues.forEach((i) => console.log('-', i));
await browser.close();
