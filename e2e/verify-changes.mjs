// Verification for the 4 changes. Run: node e2e/verify-changes.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

mkdirSync('/tmp/verify2', { recursive: true });
const BASE = 'http://localhost:5174';
const EMAIL = 'e2e-admin@portfolio-ci.dev';
const PASSWORD = 'e2e-password-123';
const browser = await chromium.launch();
const results = [];
const ok = (n, cond, detail = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${n}${detail ? ` — ${detail}` : ''}`);

// ---------- Change 1: stale-content fix ----------

// 1a. First-ever visit (no cache): loader covers, then real content; cache gets written.
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'commit' });
  // Immediately after commit, the section tree should NOT be in the DOM yet
  // (gated) OR the loader is covering. Check loader present.
  const loaderExists = await page.locator('.page-loader').count();
  await page.waitForSelector('.hero__title', { timeout: 20000 });
  await page.waitForTimeout(1500);
  const heroText = await page.locator('.hero__title').innerText();
  const cache = await page.evaluate(() => localStorage.getItem('pf-content-cache'));
  const loaderLoaded = await page.locator('.page-loader.loaded').count();
  ok('1a first visit renders real content', /Aydin/.test(heroText), `hero="${heroText.replace(/\n/g, ' ')}"`);
  ok('1a content cache written', !!cache && cache.includes('hero'), cache ? `${cache.length} bytes` : 'EMPTY');
  ok('1a loader fades after load', loaderLoaded === 1 && loaderExists === 1);
  await ctx.close();
}

// 1b. Empty-sections response must END loading and render the sparse site (no demo flash).
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const sparse = {
    hero: { greeting: "Hi, I'm", name: 'Aydin', subtitles: ['Full Stack Developer'], availability: {} },
    about: { paragraphs: ['Sparse about text.'], stats: [] },
    contact: { heading: 'Get In Touch', subheading: 'Reach out', links: [] },
    skills: [], experience: [], projects: [],
  };
  await page.route('**/api/content', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sparse) })
  );
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.hero__title', { timeout: 20000 });
  await page.waitForTimeout(1200);
  const loaderGone = await page.locator('.page-loader.loaded').count();
  const hasSkills = await page.locator('#skills').count();
  const hasExperience = await page.locator('#experience').count();
  const hasProjects = await page.locator('#projects').count();
  const hasAbout = await page.locator('#about').count();
  const hasContact = await page.locator('#contact').count();
  ok('1b sparse response ends loading', loaderGone === 1);
  ok('1b empty sections absent', hasSkills === 0 && hasExperience === 0 && hasProjects === 0,
    `skills=${hasSkills} exp=${hasExperience} proj=${hasProjects}`);
  ok('1b about+contact present', hasAbout === 1 && hasContact === 1);
  await page.screenshot({ path: '/tmp/verify2/1b-sparse.png' });
  await ctx.close();
}

// 1c. Returning visitor (cache present): hero renders fast, loader already faded.
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.hero__title', { timeout: 20000 });
  await page.waitForTimeout(800);
  // Second navigation in the SAME context = cache present.
  await page.goto(BASE, { waitUntil: 'commit' });
  // With cache, loading starts false → loader has 'loaded' immediately, hero present near-instantly.
  const heroQuick = await page.waitForSelector('.hero__title', { timeout: 3000 }).then(() => true).catch(() => false);
  ok('1c returning visit renders from cache fast', heroQuick);
  await ctx.close();
}

// 1d. API down + no cache → defaults fallback still renders (offline safety).
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.route('**/api/content', (route) => route.abort());
  await page.goto(BASE, { waitUntil: 'commit' });
  const rendered = await page.waitForSelector('.hero__title', { timeout: 65000 }).then(() => true).catch(() => false);
  ok('1d API-down fallback renders (defaults)', rendered);
  await ctx.close();
}

// ---------- Changes 2-4: admin panel ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept()); // auto-accept confirm() dialogs
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.admin-fab', { timeout: 20000 });
  await page.click('.admin-fab');
  await page.fill('.admin-login input[type="email"]', EMAIL);
  await page.fill('.admin-login input[type="password"]', PASSWORD);
  await page.click('.admin-login button[type="submit"]');
  await page.waitForSelector('.admin-tabs', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Create 2 versions by publishing twice (Hero greeting tweak).
  const greetingInput = page.locator('.admin-content .admin-section input.admin-input').first();
  const publish = page.locator('.admin-header-actions .admin-btn--primary');
  for (let i = 0; i < 2; i++) {
    await greetingInput.fill(`Verify rev ${i}`);
    await publish.click();
    await page.waitForFunction(() => {
      const b = document.querySelector('.admin-header-actions .admin-btn--primary');
      return b && /Published/i.test(b.textContent);
    }, { timeout: 10000 });
    await page.waitForTimeout(500);
  }

  // Change 2: Data tab → Clear all history.
  await page.locator('.admin-tabs button, .admin-tabs .admin-tab', { hasText: 'Data' }).first().click();
  await page.waitForTimeout(800);
  const versionsBefore = await page.locator('.admin-version-row').count();
  await page.locator('.admin-btn--danger', { hasText: 'Clear all history' }).click();
  await page.waitForTimeout(1000);
  const versionsAfter = await page.locator('.admin-version-row').count();
  const emptyNote = await page.locator('.admin-note', { hasText: 'No published versions yet' }).count();
  ok('2 clear all history empties versions', versionsBefore >= 2 && versionsAfter === 0 && emptyNote === 1,
    `before=${versionsBefore} after=${versionsAfter}`);
  // Live content unchanged: greeting still the last published value.
  const liveGreeting = await page.evaluate(() =>
    fetch('http://localhost:8001/api/content').then((r) => r.json()).then((d) => d.hero.greeting)
  );
  ok('2 live content kept after clearing history', liveGreeting === 'Verify rev 1', `greeting="${liveGreeting}"`);

  // Change 4: Analytics tab → devices scroll box.
  await page.locator('.admin-tabs button, .admin-tabs .admin-tab', { hasText: 'Analytics' }).first().click();
  await page.waitForSelector('.admin-stat-card', { timeout: 10000 });
  await page.waitForTimeout(800);
  const box = page.locator('.admin-scroll-list');
  const boxExists = await box.count();
  let boxScrolls = false;
  if (boxExists) {
    boxScrolls = await box.first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return cs.overflowY === 'auto' && el.scrollHeight >= 0 && parseInt(cs.maxHeight) <= 260;
    });
  }
  ok('4 devices list in a scroll box', boxExists === 1 && boxScrolls, `box=${boxExists}`);
  await page.screenshot({ path: '/tmp/verify2/4-analytics.png' });

  // Change 3: Reset analytics → numbers go to 0.
  const totalBefore = await page.locator('.admin-stat-value').first().innerText();
  await page.locator('.admin-btn--danger', { hasText: 'Reset analytics' }).click();
  await page.waitForTimeout(1200);
  const cardsAfter = await page.locator('.admin-stat-value').allInnerTexts();
  const allZero = cardsAfter.length >= 4 && cardsAfter.slice(0, 4).every((t) => t.trim() === '0');
  ok('3 reset analytics zeros all stat cards', allZero, `before-total=${totalBefore} after=${JSON.stringify(cardsAfter.slice(0,4))}`);
  await ctx.close();
}

console.log(results.join('\n'));
await browser.close();
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
