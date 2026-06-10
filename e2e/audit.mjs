// Visual audit script (not a test): captures every section at multiple
// viewports/themes and probes known-suspect behaviors. Run:
//   node e2e/audit.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const OUT = process.env.AUDIT_OUT || '/tmp/audit';
mkdirSync(OUT, { recursive: true });
const BASE = process.env.AUDIT_BASE || 'http://localhost:5173';
const SECTIONS = ['home', 'about', 'skills', 'experience', 'projects', 'contact'];

const browser = await chromium.launch();
const findings = [];
const consoleErrors = [];

async function sweep(label, viewport, { lightMode = false } = {}) {
  const page = await browser.newPage({ viewport });
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(`[${label}] ${m.text()}`);
  });
  page.on('pageerror', (e) => consoleErrors.push(`[${label}] PAGEERROR ${e.message}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500); // content fetch + entrance animations

  if (lightMode) {
    await page.click('.theme-toggle');
    await page.waitForTimeout(600);
  }

  for (const id of SECTIONS) {
    await page.evaluate((sid) => {
      document.getElementById(sid).scrollIntoView({ behavior: 'instant', block: 'start' });
    }, id);
    await page.waitForTimeout(1100); // in-view animations
    await page.screenshot({ path: `${OUT}/${label}-${id}.png` });
  }

  // footer
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${label}-footer.png` });

  // scroll-top behavior probe (desktop dark run only)
  if (label === 'desktop-dark') {
    const visDown = await page.evaluate(() => getComputedStyle(document.querySelector('.scroll-top')).opacity);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(1200);
    const visTop = await page.evaluate(() => getComputedStyle(document.querySelector('.scroll-top')).opacity);
    findings.push(`scroll-top opacity: scrolled-down=${visDown} (want 1), back-at-top=${visTop} (want 0)`);

    // nav active state at top after settle
    const activeNav = await page.evaluate(() =>
      [...document.querySelectorAll('nav a, nav li')].filter((el) => (el.className || '').toString().includes('active')).map((el) => el.textContent.trim())
    );
    findings.push(`nav active at top after settle: ${JSON.stringify(activeNav)} (want Home)`);

    // overflow-x check at each viewport
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 0) findings.push(`[${label}] HORIZONTAL OVERFLOW: ${overflow}px wider than viewport`);

  await page.close();
}

await sweep('desktop-dark', { width: 1440, height: 900 });
await sweep('mobile-dark', { width: 375, height: 812 });
await sweep('desktop-light', { width: 1440, height: 900 }, { lightMode: true });
await sweep('mobile-light', { width: 375, height: 812 }, { lightMode: true });

console.log('=== FINDINGS ===');
findings.forEach((f) => console.log('-', f));
console.log('=== CONSOLE ERRORS ===');
console.log(consoleErrors.length ? consoleErrors.join('\n') : '(none)');
await browser.close();
