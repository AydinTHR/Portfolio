# Aydin's Portfolio

A full-stack personal portfolio: a React 19 + Vite frontend backed by a FastAPI + MongoDB API. Content is managed through a built-in admin panel, the contact form delivers real messages, and first-party analytics track visits — no third-party trackers.

## Live Demo

> _Add your deployed URL here once live._

## Features

**Frontend**
- **Animated contour background** — simplex-noise marching-squares run in a Web Worker with OffscreenCanvas; pauses when the hero scrolls out of view to stay kind to CPU/GPU.
- **Section polish** — char-staggered hero name with gradient + text scramble, typewriter subtitles, magnetic buttons, scroll hint.
- **Project cards** — full-width cards with thumbnail images, numbered index, year badge, category eyebrow pill, tech chips, and 3D tilt + glare hover.
- **Skills** — animated SVG proficiency rings.
- **Work experience** — vertical timeline with role, company, dates, and bullet highlights.
- **Contact** — floating-label inputs, copy-email toast, live timezone pill, character counter, social link cards; submissions go to the API and are emailed to you.
- **Light / dark mode toggle** — dark is the default; single button flips CSS variables.
- **Accessibility** — focus-visible ring, `prefers-reduced-motion` guards on every animation, keyboard-navigable.

**Backend** (see [backend/README.md](backend/README.md))
- **Content API** — the site's content lives in MongoDB and is served from `GET /api/content`; the admin panel publishes updates that go live for every visitor instantly.
- **Admin authentication** — single-admin login (Argon2 + JWT in an httpOnly cookie) protects publishing, messages, and analytics.
- **Contact pipeline** — validation, rate limiting, a honeypot spam trap, MongoDB persistence, and email notifications via Resend.
- **First-party analytics** — page views and section engagement with a privacy-preserving daily visitor hash; summary dashboard in the admin panel.

## Tech Stack

| Area | Tools |
|------|-------|
| Frontend | React 19, Vite 7, Framer Motion |
| Backend | FastAPI, Pydantic v2, Motor (async MongoDB), SlowAPI |
| Database | MongoDB 7 |
| Auth | Argon2 password hashing, JWT (httpOnly cookie) |
| Email | Resend |
| Rendering | OffscreenCanvas + Web Worker (simplex noise, marching squares) |
| Styling | Plain CSS with custom properties, `data-theme` light mode |
| Testing | pytest (backend), ESLint (frontend) |

## Getting Started

### 1. Backend

```bash
cd backend
docker compose up -d            # starts MongoDB
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # then fill in the values
python scripts/hash_password.py # → ADMIN_PASSWORD_HASH for .env
uvicorn app.main:app --reload   # http://localhost:8000 · docs at /docs
```

### 2. Frontend

```bash
npm install
cp .env.example .env            # VITE_API_URL=http://localhost:8000
npm run dev                     # http://localhost:5173
```

The database is auto-seeded with default content on first run, so the site renders immediately.

## Editing Your Content

Click the ✎ pencil button (bottom right) or press `Ctrl / Cmd + Shift + E`, then sign in with your admin credentials.

- Edit Hero, About, Skills, Experience, Projects, and Contact in their tabs.
- Changes stay in a local draft until you press **Publish** — then they're saved to the server and live for every visitor.
- **Messages** tab: read, mark, and delete contact-form submissions.
- **Analytics** tab: views, unique visitors, and top sections.
- **Data** tab: export / import a JSON backup of all content.

## Project Structure

```
├── backend/                   # FastAPI + MongoDB API (own README inside)
│   ├── app/
│   │   ├── main.py            # app factory, CORS, lifespan
│   │   ├── config.py          # environment settings
│   │   ├── db.py              # Mongo client, indexes, seeding
│   │   ├── security.py        # hashing, JWT, auth dependency
│   │   ├── models/            # Pydantic schemas
│   │   ├── routers/           # content, auth, contact, messages, analytics
│   │   └── services/          # email (Resend), seed content
│   ├── tests/                 # pytest suite (in-memory Mongo)
│   ├── docker-compose.yml     # local MongoDB
│   └── Dockerfile             # production image
└── src/                       # React frontend
    ├── Portfolio.jsx          # root layout, analytics, keyboard shortcuts
    ├── Portfolio.css          # design system + all section styles
    ├── lib/api.js             # API client (fetch wrapper)
    ├── components/            # Hero, About, Skills, Experience, Projects,
    │                          # Contact, Nav, AdminPanel, polish/…
    ├── hooks/                 # useContent (API + fallback), useScrollSpy, …
    ├── data/defaults.js       # bundled fallback content (offline safety net)
    └── workers/               # contour background worker
```

## Testing

```bash
cd backend && pytest      # API tests — no live database needed
npx eslint src            # frontend lint
```

## Deploying

1. **Database** — create a free MongoDB Atlas cluster; note the connection string.
2. **API** — deploy `backend/` (Dockerfile included) to Render, Railway, or Fly. Set the `.env` values, `ENVIRONMENT=production`, and `FRONTEND_ORIGIN=https://your-domain`.
3. **Frontend** — deploy to Vercel or Netlify with `VITE_API_URL` pointing at the API.
4. If the frontend and API live on different domains, set `COOKIE_SAMESITE=none` so the admin session cookie works cross-site.

See [BACKLOG.md](BACKLOG.md) for planned improvements.

## License

MIT — see [LICENSE](./LICENSE).
