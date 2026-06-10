# Backlog

Planned work, roughly in priority order. Items move to "Done" once shipped.

## Up next

- [ ] **Deploy to production** — MongoDB Atlas + API on Render/Railway + frontend on Vercel; set `FRONTEND_ORIGIN`, `ENVIRONMENT=production`, and a real `RESEND_API_KEY` with a verified sending domain.
- [ ] **Resume download** — host the resume PDF (e.g. `public/resume.pdf` or served by the API) and wire the hero's "Download Resume" button to it.
- [ ] **Real social links** — replace the placeholder GitHub/LinkedIn URLs in the contact section with real profiles (editable in the admin panel).
- [ ] **Real project links** — fill in live/code links for the three featured projects (currently `#`).

## Improvements

- [ ] **Image uploads to object storage** — profile/project images are currently data-URLs or hotlinks; store uploads in S3/Cloudflare R2 and serve by URL to keep the content document small.
- [ ] **Unread-message badge** — show a count on the admin pencil button when there are unread contact messages.
- [ ] **Analytics time-series chart** — replace the per-day rows with a small sparkline/bar chart in the Analytics tab.
- [ ] **Draft autosave** — persist the admin draft to the server (separate draft document) so unpublished edits survive closing the tab.
- [ ] **Content versioning** — keep the last N published versions with one-click rollback.
- [ ] **API on a subdomain** — serve the API from `api.<domain>` so the auth cookie can stay `SameSite=Lax`.
- [ ] **CI pipeline** — GitHub Actions: backend pytest + ruff, frontend eslint + build, on every push/PR.
- [ ] **E2E tests** — Playwright happy-path: load site, submit contact form, admin login + publish.

## Nice to have

- [ ] **Blog section** — markdown posts stored in MongoDB, rendered with syntax highlighting.
- [ ] **Per-project detail pages** — expand "View Details" into routed case-study pages.
- [ ] **Open Graph image** — generated social-share card.
- [ ] **Sitemap + robots.txt** — small SEO pass once deployed on a real domain.

## Done

- [x] Backend API: content CMS, contact pipeline (storage + Resend email + rate limiting + honeypot), single-admin auth (Argon2 + httpOnly JWT cookie), first-party analytics with privacy-preserving visitor hashing.
- [x] Frontend integration: API client, content fetched from the server with bundled fallback, real contact form, login-gated admin panel with draft → Publish workflow, Messages and Analytics tabs.
- [x] Backend test suite (pytest, in-memory MongoDB) and lint (ruff); frontend lint clean.
- [x] Local dev environment: Dockerized MongoDB, `.env.example` templates, password-hash helper script, production Dockerfile.
- [x] UI cleanup: removed availability pill, custom cursor, duplicate section labels, coffee stat; fixed scroll-to-top button position and footer gap.
