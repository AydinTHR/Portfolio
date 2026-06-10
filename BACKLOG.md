# Backlog

Planned work, roughly in priority order. Items move to "Done" once shipped.

## Up next

- [ ] **Contact email notifications** — sign up for Resend, verify the sending domain, set `RESEND_API_KEY` on the API host (messages are already stored and visible in the admin panel without it).
- [ ] **Resume download** — host the resume PDF (e.g. `public/resume.pdf` or served by the API) and wire the hero's "Download Resume" button to it.
- [ ] **Real social links** — replace the placeholder GitHub/LinkedIn URLs in the contact section with real profiles (editable in the admin panel).
- [ ] **Real project links** — fill in live/code links for the three featured projects (currently `#`).

## Improvements

- [ ] **Image storage on S3/R2** — images currently live in MongoDB behind `/api/images/…`, which needs no external account; swapping the storage layer to S3/Cloudflare R2 later only changes the images router, not the API contract.
- [ ] **Optimize bundled profile photo** — `src/assets/profile.jpg` is ~3 MB; compress/resize it to cut the build size.

## Nice to have

- [ ] **Blog section** — markdown posts stored in MongoDB, rendered with syntax highlighting.
- [ ] **Per-project detail pages** — expand "View Details" into routed case-study pages.
- [ ] **Open Graph image** — generated social-share card.
- [ ] **Sitemap + robots.txt** — small SEO pass once deployed on a real domain.

## Done

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
