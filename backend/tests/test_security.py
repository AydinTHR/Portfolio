import pytest
from pydantic import ValidationError

from app.config import Settings, settings
from app.rate_limit import limiter

from .conftest import TEST_EMAIL

CF = "CF-Connecting-IP"
STRONG_SECRET = "x7Kp2vQ9mR4tW8yB3nF6hJ1cL5sD0gZa"


@pytest.fixture
def behind_proxy(monkeypatch):
    """Run as on Render: the visitor's address arrives in CF-Connecting-IP."""
    monkeypatch.setattr(settings, "client_ip_header", CF)


@pytest.fixture
def rate_limited():
    """Turn the limiter back on (conftest disables it) with empty counters."""
    limiter.reset()
    limiter.enabled = True
    yield
    limiter.enabled = False
    limiter.reset()


# ---- Client IP ----


async def test_contact_records_the_connecting_address_by_default(client, db):
    await client.post(
        "/api/contact",
        json={"name": "A", "email": "a@example.com", "message": "hi"},
        headers={CF: "203.0.113.7"},  # ignored unless configured
    )
    doc = await db.messages.find_one({})
    assert doc["ip"] == "127.0.0.1"


async def test_contact_records_the_visitor_address_behind_a_proxy(client, db, behind_proxy):
    await client.post(
        "/api/contact",
        json={"name": "A", "email": "a@example.com", "message": "hi"},
        headers={CF: "203.0.113.7"},
    )
    doc = await db.messages.find_one({})
    assert doc["ip"] == "203.0.113.7"


async def test_client_ip_falls_back_when_the_header_is_missing(client, db, behind_proxy):
    await client.post(
        "/api/contact", json={"name": "A", "email": "a@example.com", "message": "hi"}
    )
    doc = await db.messages.find_one({})
    assert doc["ip"] == "127.0.0.1"


async def test_analytics_tells_visitors_apart_behind_a_proxy(client, db, behind_proxy):
    ua = {"user-agent": "Mozilla/5.0 (Macintosh) Safari"}
    for ip in ("203.0.113.7", "198.51.100.4"):
        resp = await client.post(
            "/api/analytics/event", json={"type": "pageview"}, headers={**ua, CF: ip}
        )
        assert resp.status_code == 200
    hashes = {doc["visitor_hash"] async for doc in db.analytics_events.find({})}
    assert len(hashes) == 2


# ---- Rate limits are per visitor ----


async def test_login_limit_is_per_visitor(client, behind_proxy, rate_limited):
    bad = {"email": TEST_EMAIL, "password": "wrong"}
    for _ in range(5):
        resp = await client.post("/api/auth/login", json=bad, headers={CF: "203.0.113.7"})
        assert resp.status_code == 401
    resp = await client.post("/api/auth/login", json=bad, headers={CF: "203.0.113.7"})
    assert resp.status_code == 429

    # Another visitor is not locked out by the first one's attempts.
    resp = await client.post("/api/auth/login", json=bad, headers={CF: "198.51.100.4"})
    assert resp.status_code == 401


async def test_contact_limit_is_per_visitor(client, behind_proxy, rate_limited):
    msg = {"name": "A", "email": "a@example.com", "message": "hi"}
    for _ in range(5):
        resp = await client.post("/api/contact", json=msg, headers={CF: "203.0.113.7"})
        assert resp.status_code == 200
    resp = await client.post("/api/contact", json=msg, headers={CF: "203.0.113.7"})
    assert resp.status_code == 429

    resp = await client.post("/api/contact", json=msg, headers={CF: "198.51.100.4"})
    assert resp.status_code == 200


# ---- Analytics event endpoint ----


async def test_analytics_event_is_rate_limited(client, db, behind_proxy, rate_limited):
    for _ in range(60):
        resp = await client.post(
            "/api/analytics/event", json={"type": "pageview"}, headers={CF: "203.0.113.7"}
        )
        assert resp.status_code == 200
    resp = await client.post(
        "/api/analytics/event", json={"type": "pageview"}, headers={CF: "203.0.113.7"}
    )
    assert resp.status_code == 429
    assert await db.analytics_events.count_documents({}) == 60

    resp = await client.post(
        "/api/analytics/event", json={"type": "pageview"}, headers={CF: "198.51.100.4"}
    )
    assert resp.status_code == 200


@pytest.mark.parametrize(
    "event",
    [
        {"type": "pageview", "path": "/" + "a" * 512},
        {"type": "section", "section": "s" * 101},
        {"type": "pageview", "referrer": "https://example.com/" + "r" * 2048},
    ],
)
async def test_analytics_event_rejects_oversized_fields(client, db, event):
    resp = await client.post("/api/analytics/event", json=event)
    assert resp.status_code == 422
    assert await db.analytics_events.count_documents({}) == 0


# ---- Production refuses a forgeable JWT secret ----


@pytest.mark.parametrize(
    "secret",
    ["dev-insecure-secret-change-me", "change-me-to-a-long-random-string", "short-secret"],
)
def test_production_refuses_a_known_or_short_jwt_secret(secret):
    with pytest.raises(ValidationError, match="JWT_SECRET"):
        Settings(_env_file=None, environment="production", jwt_secret=secret)


def test_production_starts_with_a_strong_jwt_secret():
    prod = Settings(_env_file=None, environment="production", jwt_secret=STRONG_SECRET)
    assert prod.is_production


def test_development_keeps_the_default_jwt_secret():
    assert Settings(_env_file=None, environment="development").jwt_secret
