"""Shared test fixtures.

Environment is configured *before* the app is imported so settings pick up
deterministic test credentials (overriding any local .env). The database is an
in-memory mongomock double injected via dependency override, and rate limiting
is disabled so repeated requests across tests don't trip limits.
"""

import os

from argon2 import PasswordHasher

TEST_PASSWORD = "testpass123"
TEST_EMAIL = "admin@test.com"

os.environ["ADMIN_EMAIL"] = TEST_EMAIL
os.environ["ADMIN_PASSWORD_HASH"] = PasswordHasher().hash(TEST_PASSWORD)
os.environ["JWT_SECRET"] = "test-secret-key-that-is-sufficiently-long-for-hs256"
os.environ["RESEND_API_KEY"] = ""  # email sends are skipped in tests
os.environ["ANALYTICS_SALT"] = "test-salt"
os.environ["ENVIRONMENT"] = "development"
os.environ["COOKIE_SAMESITE"] = "lax"

import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from mongomock_motor import AsyncMongoMockClient  # noqa: E402

from app.db import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.rate_limit import limiter  # noqa: E402

limiter.enabled = False


@pytest_asyncio.fixture
async def db():
    client = AsyncMongoMockClient()
    return client["test_portfolio"]


@pytest_asyncio.fixture
async def client(db):
    app.dependency_overrides[get_db] = lambda: db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


async def login(client: AsyncClient) -> None:
    """Authenticate the client; cookie is stored on the client's jar."""
    resp = await client.post(
        "/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert resp.status_code == 200, resp.text
