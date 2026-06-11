# Backlog

Planned work, roughly in priority order. Items move to "Done" once shipped.

## Up next

- [ ] **Contact email notifications** — sign up for Resend, verify the sending domain, set `RESEND_API_KEY` on the API host (messages are already stored and visible in the admin panel without it).
- [ ] **Drop in the resume PDF** — the hero button is wired and auto-appears once `public/resume.pdf` exists; just add the file and push.
- [ ] **Real content** — fill skills, experience, and projects (with live/code links) through the admin panel; demo data has been cleared.

## Improvements

- [ ] **Image storage on S3/R2** (deferred) — images live in MongoDB behind `/api/images/…`; swapping to S3/Cloudflare R2 later only changes the images router, not the API contract.

## Nice to have

- [ ] **Blog section** — markdown posts stored in MongoDB, rendered with syntax highlighting.

## Done

- [x] Project detail pages — every project card's "View Details" opens a routed case-study page at `/projects/<name>` (client routing + SPA rewrites on Vercel).
- [x] Resume download wiring — the hero button appears automatically when a real `public/resume.pdf` is deployed.
- [x] Open Graph share image — branded 1200×630 card (`public/og.png`, regenerate with `node e2e/make-og.mjs`) wired into og/twitter meta.
- [x] Real social links — contact section links to the real GitHub and LinkedIn profiles.
- [x] Optimize bundled profile photo — 2.9 MB → 202 KB (4000×6000 → 800×1200).
- [x] Sitemap + robots.txt — served from `public/`, sitemap referenced in robots.
- [x] UI audit round — empty sections hide cleanly, mobile timeline/admin-header/floating-button fixes, light-mode stat contrast.
- [x] Deployed to production — site live at [aydintehrani.com](https://aydintehrani.com) (Vercel), API at api.aydintehrani.com (Render, Docker), data on MongoDB Atlas (local data migrated); auto-deploys from `main`.
- [x] API on a subdomain — api.aydintehrani.com keeps the auth cookie first-party (`SameSite=Lax`), so admin login works in Safari and other strict browsers.
- [x] Image uploads — admin can upload profile/project images (5 MB cap, JPEG/PNG/WebP/GIF); stored in MongoDB and served from `/api/images/{id}` with immutable caching.
- [x] Content versioning — every publish archives the previous version (last 10 kept); one-click restore in the admin Data tab.
- [x] Draft autosave — edits autosave to a server-side draft (debounced) and are restored on the next sign-in; discard button included.
- [x] Unread-message badge on the admin pencil button (admin session only).
- [x] Analytics bar chart — continuous 14-day daily-views series, zero-filled server-side.
- [x] CI pipeline — GitHub Actions: backend ruff + pytest, frontend eslint + build, Playwright E2E with a MongoDB service container.
- [x] E2E tests — Playwright happy path: site loads from API, contact form submits, admin login → publish → change live.
- [x] Backend API: content CMS, contact pipeline (storage + Resend email + rate limiting + honeypot), single-admin auth (Argon2 + httpOnly JWT cookie), first-party analytics with privacy-preserving visitor hashing.
- [x] Frontend integration: API client, content fetched from the server with bundled fallback, real contact form, login-gated admin panel with draft → Publish workflow, Messages and Analytics tabs.
- [x] Backend test suite (pytest, in-memory MongoDB) and lint (ruff); frontend lint clean.
- [x] Local dev environment: Dockerized MongoDB, `.env.example` templates, password-hash helper script, production Dockerfile.
- [x] UI cleanup: removed availability pill, custom cursor, duplicate section labels, coffee stat; fixed scroll-to-top button position and footer gap.
