// Targeted verification of the Phase-1 fixes. Run: node e2e/verify-fixes.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

mkdirSync('/tmp/verify', { recursive: true });
const browser = await chromium.launch();
const results = [];
const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);

// --- Fix 4: empty sections hidden (5173 = prod Atlas content, currently empty) ---
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const visibleSections = await page.evaluate(() => [...document.querySelectorAll('section[id], .projects-section[id]')].map((s) => s.id));
  const navLinks = await page.evaluate(() => [...document.querySelectorAll('nav a, nav button')].map((a) => a.textContent.trim()).filter(Boolean));
  check('empty sections hidden', !visibleSections.includes('skills') && !visibleSections.includes('experience') && !visibleSections.includes('projects'), `sections=${JSON.stringify(visibleSections)}`);
  check('nav skips empty sections', !navLinks.some((l) => /skills|experience|projects/i.test(l)), `nav=${JSON.stringify(navLinks)}`);
  await page.screenshot({ path: '/tmp/verify/empty-sections-home.png' });
  await page.close();
}

// --- Fixes 1, 2, 5 on the full-content stack (5174) ---
{
  // Fix 2: light-mode stat numbers
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.click('.theme-toggle');
  await page.waitForTimeout(500);
  await page.evaluate(() => document.getElementById('about').scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(1200);
  const grad = await page.evaluate(() => getComputedStyle(document.querySelector('.about__stat-value span')).backgroundImage);
  check('light-mode stat gradient uses dark text', grad.includes('17, 17, 17') || grad.includes('rgb(17'), grad.slice(0, 80));
  await page.screenshot({ path: '/tmp/verify/light-about-stats.png' });
  await page.close();
}
{
  // Fix 1: mobile timeline header stacks; Fix 5: button spacing
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => document.getElementById('experience').scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(1200);
  const layout = await page.evaluate(() => {
    const header = document.querySelector('.timeline__header');
    const role = header.querySelector('.timeline__role').getBoundingClientRect();
    const dates = header.querySelector('.timeline__dates').getBoundingClientRect();
    const company = header.querySelector('.timeline__company').getBoundingClientRect();
    return {
      headerDir: getComputedStyle(header).flexDirection,
      datesBelowRole: dates.top >= role.bottom - 2,
      companyHeight: Math.round(company.height),
      roleWidth: Math.round(role.width),
    };
  });
  check('mobile timeline header stacks', layout.headerDir === 'column' && layout.datesBelowRole, JSON.stringify(layout));
  check('mobile company line is one/two lines', layout.companyHeight < 50, `height=${layout.companyHeight}px`);
  await page.screenshot({ path: '/tmp/verify/mobile-experience.png' });

  const buttons = await page.evaluate(() => {
    const get = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), w: Math.round(r.width) };
    };
    return { theme: get('.theme-toggle'), fab: get('.admin-fab'), scroll: get('.scroll-top') };
  });
  const gap1 = buttons.fab && buttons.theme ? buttons.fab.top - buttons.theme.bottom : -1;
  const gap2 = buttons.scroll && buttons.fab ? buttons.scroll.top - buttons.fab.bottom : -1;
  check('mobile buttons 38px with >=10px gaps', buttons.theme?.w === 38 && gap1 >= 10 && gap2 >= 10, `w=${buttons.theme?.w} gaps=${gap1},${gap2}`);
  await page.close();
}

// --- Fix 3: admin header on mobile ---
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.click('.admin-fab');
  await page.waitForTimeout(400);
  await page.fill('.admin-login input[type="email"]', 'e2e-admin@portfolio-ci.dev');
  await page.fill('.admin-login input[type="password"]', 'e2e-password-123');
  await page.click('.admin-login button[type="submit"]');
  await page.waitForSelector('.admin-tabs', { timeout: 10000 });
  await page.waitForTimeout(800);
  const header = await page.evaluate(() => {
    const title = document.querySelector('.admin-title').getBoundingClientRect();
    const published = document.querySelector('.admin-btn--primary')?.getBoundingClientRect();
    const close = [...document.querySelectorAll('.admin-header button')].at(-1).getBoundingClientRect();
    const overlap = published && !(title.right <= published.left || published.right <= title.left || title.bottom <= published.top || published.bottom <= title.top);
    return { overlap, closeOnScreen: close.right <= window.innerWidth, closeRight: Math.round(close.right), vw: window.innerWidth };
  });
  check('admin mobile header: no title/button overlap', !header.overlap, JSON.stringify(header));
  check('admin mobile header: close button on screen', header.closeOnScreen, `right=${header.closeRight} vw=${header.vw}`);
  await page.screenshot({ path: '/tmp/verify/admin-mobile-header.png' });
  await page.close();
}

console.log(results.join('\n'));
await browser.close();
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
