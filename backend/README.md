# Portfolio Backend

FastAPI + MongoDB API that powers the portfolio frontend:

- **Content CMS** — serves the published portfolio content and accepts authenticated updates.
- **Contact form** — validates, stores, and emails submissions (via [Resend](https://resend.com)).
- **Admin auth** — single-admin login with a JWT in an httpOnly cookie.
- **Analytics** — privacy-preserving page-view / section tracking with an aggregated summary.

## Stack

FastAPI · Motor (async MongoDB) · Pydantic v2 · PyJWT · Argon2 · Resend · SlowAPI (rate limiting).

## Quick start (local)

```bash
cd backend

# 1. Start MongoDB
docker compose up -d

# 2. Python env + deps
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt   # or requirements.txt for runtime only

# 3. Configure
cp .env.example .env
python scripts/hash_password.py        # paste output into ADMIN_PASSWORD_HASH
# set ADMIN_EMAIL, JWT_SECRET, ANALYTICS_SALT, and (optionally) RESEND_* in .env

# 4. Run
uvicorn app.main:app --reload          # http://localhost:8000  · docs at /docs
```

The `content` collection is **auto-seeded** with default portfolio content on first run.

## Configuration (`.env`)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` / `DB_NAME` | MongoDB connection (local Docker or Atlas) |
| `ADMIN_EMAIL` | The single admin's login email |
| `ADMIN_PASSWORD_HASH` | Argon2 hash — generate with `scripts/hash_password.py` |
| `JWT_SECRET` | Secret for signing session tokens (use a long random string) |
| `JWT_EXPIRE_HOURS` | Session lifetime (default 12) |
| `ENVIRONMENT` | `production` marks the auth cookie `Secure` |
| `COOKIE_SAMESITE` | `lax` (default) / `strict` / `none` (cross-site prod needs `none` + HTTPS) |
| `COOKIE_DOMAIN` | Optional cookie domain scope |
| `FRONTEND_ORIGIN` | Allowed CORS origin(s), comma-separated |
| `RESEND_API_KEY` | Resend key; if blank, contact emails are skipped (messages still stored) |
| `CONTACT_FROM_EMAIL` / `CONTACT_TO_EMAIL` | Sender / recipient for contact emails |
| `ANALYTICS_SALT` | Salt for the daily visitor hash |

## API

Interactive docs: `GET /docs`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | – | Liveness |
| GET | `/api/content` | – | Published content |
| PUT | `/api/content` | admin | Replace content |
| POST | `/api/contact` | rate-limited | Submit a message (+ honeypot field `website`) |
| POST | `/api/auth/login` | rate-limited | Set session cookie |
| POST | `/api/auth/logout` | admin | Clear session |
| GET | `/api/auth/me` | – | `{authenticated, email}` |
| GET | `/api/messages` | admin | List submissions |
| PATCH | `/api/messages/{id}` | admin | Mark read/unread |
| DELETE | `/api/messages/{id}` | admin | Delete |
| POST | `/api/analytics/event` | – | Record pageview/section event |
| GET | `/api/analytics/summary` | admin | Aggregated stats |

## Tests & lint

```bash
pytest            # uses an in-memory Mongo double — no live DB required
ruff check .
```

## Deploy

1. **Database:** MongoDB Atlas — set `MONGODB_URI`.
2. **API:** build the included `Dockerfile` and deploy to Render / Railway / Fly / any container host. Set all `.env` variables, `ENVIRONMENT=production`, and `FRONTEND_ORIGIN` to your site's URL. The container honours `$PORT`.
3. **Frontend:** point the frontend's `VITE_API_URL` at the deployed API base URL.
4. If the frontend and API are on **different sites**, set `COOKIE_SAMESITE=none` (requires HTTPS) so the auth cookie is sent cross-site.
