// Generates public/og.png (1200x630 social-share card). Run: node e2e/make-og.mjs
import { chromium } from '@playwright/test';

const html = `<!doctype html>
<html><head>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&family=Space+Grotesk:wght@700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden; position: relative;
    background: #0a0a0c; font-family: 'Space Grotesk', sans-serif;
    display: flex; flex-direction: column; justify-content: center; padding: 0 96px;
  }
  .glow {
    position: absolute; right: -180px; top: -180px; width: 640px; height: 640px;
    background: radial-gradient(circle, rgba(245,166,35,0.22) 0%, transparent 65%);
  }
  .ring { position: absolute; border: 1px solid rgba(255,255,255,0.07); border-radius: 50%; }
  .r1 { width: 420px; height: 420px; right: -80px; top: -90px; }
  .r2 { width: 560px; height: 560px; right: -150px; top: -160px; }
  .r3 { width: 700px; height: 700px; right: -220px; top: -230px; }
  .r4 { width: 300px; height: 300px; left: -120px; bottom: -150px; border-color: rgba(255,255,255,0.05); }
  .r5 { width: 440px; height: 440px; left: -190px; bottom: -220px; border-color: rgba(255,255,255,0.05); }
  .eyebrow {
    color: #f5a623; letter-spacing: 0.35em; font-size: 22px; font-weight: 700;
    text-transform: uppercase; margin-bottom: 28px; font-family: 'Inter', sans-serif;
  }
  h1 { font-size: 96px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.05; color: #fff; }
  h1 .accent { background: linear-gradient(135deg, #fff 20%, #f5a623 90%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .sub { color: rgba(255,255,255,0.72); font-size: 38px; margin-top: 22px; font-weight: 700; }
  .domain {
    position: absolute; bottom: 56px; left: 96px; color: rgba(255,255,255,0.45);
    font-size: 26px; font-family: 'Inter', sans-serif; font-weight: 500; letter-spacing: 0.02em;
  }
  .bar { position: absolute; bottom: 0; left: 0; right: 0; height: 10px;
    background: linear-gradient(90deg, #f5a623, rgba(245,166,35,0.25)); }
</style></head>
<body>
  <div class="glow"></div>
  <div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div>
  <div class="ring r4"></div><div class="ring r5"></div>
  <div class="eyebrow">Portfolio</div>
  <h1>Hi, I'm <span class="accent">Aydin</span></h1>
  <div class="sub">Full Stack Developer</div>
  <div class="domain">aydintehrani.com</div>
  <div class="bar"></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.waitForTimeout(800); // font load settle
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('public/og.png written');
