# Backlog

Planned work, roughly in priority order. Items move to "Done" once shipped.

## Up next

- [ ] **Contact email notifications**: sign up for Resend, verify the sending domain, set `RESEND_API_KEY` on the API host (messages are already stored and visible in the admin panel without it).
- [ ] **Drop in the resume PDF**: the hero button is wired and auto-appears once `public/resume.pdf` exists; just add the file and push.
- [ ] **Real content**: fill skills, projects (with live/code links), and experience through the admin panel; demo data has been cleared.

## Improvements

- [ ] **Image storage on S3/R2** (deferred): images live in MongoDB behind `/api/images/...`; swapping to S3/Cloudflare R2 later only changes the images router, not the API contract.

## Nice to have

- [ ] **Blog section**: markdown posts stored in MongoDB, rendered with syntax highlighting.

## Done

- [x] Secret admin access: removed the visible pencil button; the editor now opens from a hidden `/admin` URL or the `Ctrl / Cmd + Shift + E` shortcut. Login security is unchanged (Argon2 password, signed httpOnly JWT cookie, rate-limited).
- [x] Analytics overhaul: the owner's own device is reliably excluded (a localStorage flag set at sign-in, independent of the login cookie), a weekly visitor hash for accurate unique counts, plus traffic sources, top pages, new vs returning, busiest day/hour, and an "exclude this device" toggle and reset.
- [x] Skills redesign: replaced the circular proficiency rings with animated horizontal bars and tech-stack chips.
- [x] Projects before Experience: reordered the page, nav, section dots, and admin tabs.
- [x] Admin panel UX: fixed height so it no longer resizes between tabs; it no longer closes on an outside click (close with the X or Escape).
- [x] UI polish round: contact pill/button alignment, removed the Projects background seam and the cursor glow on project cards, timeline dot centered on the rail, centered mobile stats, equal-size contact link cards, centered bottom toast, and spacing between the project pill and title.
- [x] Restored the contour background fade on scroll (it had regressed when the loading gate moved the hero).
- [x] Loading gate + keep-alive: the page always waits for live content before rendering, so a visitor never sees a stale or demo version first; a scheduled GitHub Actions workflow pings the API so the free tier stays warm.
- [x] Project detail pages: every project card's "View Details" opens a routed case-study page at `/projects/<name>` (client routing + SPA rewrites on Vercel).
- [x] Resume download wiring: the hero button appears automatically when a real `public/resume.pdf` is deployed.
- [x] Open Graph share image: branded 1200x630 card (`public/og.png`, regenerate with `node e2e/make-og.mjs`) wired into og/twitter meta.
- [x] Real social links: contact section links to the real GitHub and LinkedIn profiles.
- [x] Optimized the bundled profile photo: 2.9 MB down to 202 KB (4000x6000 down to 800x1200).
- [x] Sitemap + robots.txt: served from `public/`, sitemap referenced in robots.
- [x] Deployed to production: site live at [aydintehrani.com](https://aydintehrani.com) (Vercel), API at api.aydintehrani.com (Render, Docker), data on MongoDB Atlas (local data migrated); auto-deploys from `main`.
- [x] API on a subdomain: api.aydintehrani.com keeps the auth cookie first-party (`SameSite=Lax`), so admin login works in Safari and other strict browsers.
- [x] Image uploads: admin can upload profile/project images (5 MB cap, JPEG/PNG/WebP/GIF); stored in MongoDB and served from `/api/images/{id}` with immutable caching.
- [x] Content versioning: every publish archives the previous version (last 10 kept); one-click restore and a clear-all-history button in the admin Data tab.
- [x] Draft autosave: edits autosave to a server-side draft (debounced) and are restored on the next sign-in; discard button included.
- [x] CI pipeline: GitHub Actions runs backend ruff + pytest, frontend eslint + build, and Playwright E2E with a MongoDB service container.
- [x] E2E tests: Playwright happy path (site loads from API, contact form submits, admin login, publish, change goes live, project detail page).
- [x] Backend API: content CMS, contact pipeline (storage + Resend email + rate limiting + honeypot), single-admin auth (Argon2 + httpOnly JWT cookie), first-party privacy-preserving analytics.
- [x] Frontend integration: API client, content fetched from the server with a cached last-known-good copy and bundled fallback, real contact form, the admin panel with draft to Publish workflow, Messages and Analytics tabs.
- [x] Backend test suite (pytest, in-memory MongoDB) and lint (ruff); frontend lint clean.
- [x] Local dev environment: Dockerized MongoDB, `.env.example` templates, password-hash helper script, production Dockerfile.
- [x] UI cleanup: removed availability pill, custom cursor, duplicate section labels, coffee stat; fixed scroll-to-top button position and footer gap.
