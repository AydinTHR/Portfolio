# Aydin's Portfolio

A full-stack personal portfolio: a React 19 + Vite frontend backed by a FastAPI + MongoDB API. Content is managed through a built-in admin panel, the contact form delivers real messages, and first-party analytics track visits with no third-party trackers.

## Live Demo

**[aydintehrani.com](https://aydintehrani.com)** : frontend on Vercel, API at [api.aydintehrani.com](https://api.aydintehrani.com/api/health) on Render, data on MongoDB Atlas.

## Features

**Frontend**
- **Animated contour background**: simplex-noise marching-squares run in a Web Worker with OffscreenCanvas, and fade out as you scroll past the hero into the darker lower sections.
- **Loading gate**: the page waits for live content before rendering, so a visitor never sees a stale or placeholder version first (with a friendly "waking the server" hint on slow cold starts).
- **Section polish**: char-staggered hero name with gradient + text scramble, typewriter subtitles, magnetic buttons, scroll hint, section dots.
- **Projects**: full-width cards with thumbnail images, numbered index, year badge, category pill, tech chips, and a subtle 3D tilt on hover. Each card opens a routed detail page at `/projects/<name>`.
- **Skills**: animated horizontal proficiency bars with a percentage and tech-stack chips.
- **Work experience**: vertical timeline with role, company, dates, and bullet highlights.
- **Contact**: floating-label inputs, copy-email toast, live timezone pill, character counter, equal-size social link cards; submissions go to the API and are emailed to you.
- **Light / dark mode toggle**: dark is the default; a single button flips CSS variables.
- **SEO + sharing**: sitemap, robots.txt, and a branded 1200x630 Open Graph card for link previews.
- **Accessibility**: focus-visible ring, `prefers-reduced-motion` guards on every animation, keyboard-navigable.

**Backend** (see [backend/README.md](backend/README.md))
- **Content API**: the site's content lives in MongoDB and is served from `GET /api/content`; the admin panel publishes updates that go live for every visitor instantly.
- **Versioning & drafts**: every publish archives the previous version (last 10, one-click restore, plus clear-all-history), and edits autosave to a server-side draft that survives closing the tab.
- **Admin authentication**: single-admin login (Argon2 + JWT in an httpOnly cookie, login rate-limited) protects publishing, messages, and analytics. There is no visible login button; the editor is opened from a secret `/admin` URL or the `Ctrl / Cmd + Shift + E` shortcut.
- **Contact pipeline**: validation, rate limiting, a honeypot spam trap, MongoDB persistence, and email notifications via Resend.
- **First-party analytics**: page views and section engagement with a privacy-preserving weekly visitor hash and no raw PII. The dashboard shows total/7d/30d views, unique visitors, new vs returning, traffic sources, top pages, top sections, device breakdown, busiest day/hour, and a 14-day chart. The owner's own device is reliably excluded, and history can be reset.
- **Image uploads**: admin-uploaded images stored in MongoDB and served with immutable caching.

## Tech Stack

| Area | Tools |
|------|-------|
| Frontend | React 19, Vite 7, React Router, Framer Motion |
| Backend | FastAPI, Pydantic v2, Motor (async MongoDB), SlowAPI |
| Database | MongoDB 7 (Atlas in production) |
| Auth | Argon2 password hashing, JWT (httpOnly cookie) |
| Email | Resend |
| Rendering | OffscreenCanvas + Web Worker (simplex noise, marching squares) |
| Styling | Plain CSS with custom properties, `data-theme` light mode |
| Testing | pytest + ruff (backend), ESLint (frontend), Playwright (e2e) |
| Hosting | Vercel (frontend), Render (API), MongoDB Atlas (data) |

## Getting Started

### 1. Backend

```bash
cd backend
docker compose up -d            # starts MongoDB
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # then fill in the values
python scripts/hash_password.py # produces ADMIN_PASSWORD_HASH for .env
uvicorn app.main:app --reload   # http://localhost:8000 (docs at /docs)
```

### 2. Frontend

```bash
npm install
cp .env.example .env            # VITE_API_URL=http://localhost:8000
npm run dev                     # http://localhost:5173
```

The database is auto-seeded with default content on first run, so the site renders immediately.

## Editing Your Content

There is no visible edit button. Open the editor by visiting **`/admin`** (e.g. `aydintehrani.com/admin`) or pressing `Ctrl / Cmd + Shift + E`, then sign in with your admin credentials.

- Edit Hero, About, Skills, Projects, Experience, and Contact in their tabs.
- Changes stay in a server-side draft until you press **Publish**, then they go live for every visitor.
- **Messages** tab: read, mark, and delete contact-form submissions.
- **Analytics** tab: views, unique visitors, new vs returning, traffic sources, top pages, sections, devices, and busiest times; plus an "exclude this device" toggle and a reset.
- **Data** tab: export / import a JSON backup, restore or clear published versions.

Signing in on a device marks it as the owner so your own visits stop being counted in analytics.

## Project Structure

```
├── backend/                   # FastAPI + MongoDB API (own README inside)
│   ├── app/
│   │   ├── main.py            # app factory, CORS, lifespan
│   │   ├── config.py          # environment settings
│   │   ├── db.py              # Mongo client, indexes, seeding
│   │   ├── security.py        # hashing, JWT, auth dependency
│   │   ├── models/            # Pydantic schemas
│   │   ├── routers/           # content, auth, contact, messages, analytics, images
│   │   └── services/          # email (Resend), seed content
│   ├── tests/                 # pytest suite (in-memory Mongo)
│   ├── docker-compose.yml     # local MongoDB
│   └── Dockerfile             # production image
└── src/                       # React frontend
    ├── main.jsx               # router (home, /admin, /projects/:slug)
    ├── Portfolio.jsx          # root layout, analytics, keyboard shortcuts
    ├── Portfolio.css          # design system + all section styles
    ├── lib/api.js             # API client (fetch wrapper)
    ├── components/            # Hero, About, Skills, Projects, Experience,
    │                          # Contact, Nav, AdminPanel, ProjectDetail, polish/…
    ├── hooks/                 # useContent (API + cache + fallback), useScrollSpy, …
    ├── data/defaults.js       # bundled fallback content (offline safety net)
    └── workers/               # contour background worker
```

## Testing

```bash
cd backend && ruff check app tests && pytest   # API lint + tests (no live DB needed)
npx eslint src                                 # frontend lint
npm run test:e2e                               # Playwright end-to-end (needs MongoDB on localhost)
```

Continuous integration runs all suites on every push (see `.github/workflows/ci.yml`). A scheduled workflow pings the API so the free-tier host stays warm.

## Deploying

1. **Database**: create a free MongoDB Atlas cluster and note the connection string.
2. **API**: deploy `backend/` (Dockerfile included) to Render, Railway, or Fly. Set the `.env` values, `ENVIRONMENT=production`, and `FRONTEND_ORIGIN=https://your-domain`.
3. **Frontend**: deploy to Vercel or Netlify with `VITE_API_URL` pointing at the API. The included `vercel.json` rewrites all routes to the SPA so `/admin` and `/projects/...` resolve.
4. If the frontend and API live on different domains, set `COOKIE_SAMESITE=none` so the admin session cookie works cross-site (a same-site API subdomain like `api.your-domain` can keep `lax`).

See [BACKLOG.md](BACKLOG.md) for planned improvements.

## License

MIT, see [LICENSE](./LICENSE).
