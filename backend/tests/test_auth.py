from .conftest import TEST_EMAIL, TEST_PASSWORD


async def test_me_unauthenticated(client):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 200
    assert resp.json()["authenticated"] is False


async def test_login_wrong_password(client):
    resp = await client.post(
        "/api/auth/login", json={"email": TEST_EMAIL, "password": "nope"}
    )
    assert resp.status_code == 401


async def test_login_unknown_email(client):
    resp = await client.post(
        "/api/auth/login", json={"email": "someoneelse@test.com", "password": TEST_PASSWORD}
    )
    assert resp.status_code == 401


async def test_login_sets_cookie_and_me_reflects_it(client):
    resp = await client.post(
        "/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert resp.status_code == 200
    assert resp.json() == {"authenticated": True, "email": TEST_EMAIL}
    assert "portfolio_session" in client.cookies

    me = await client.get("/api/auth/me")
    assert me.json()["authenticated"] is True


async def test_logout_clears_session(client):
    await client.post(
        "/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    out = await client.post("/api/auth/logout")
    assert out.status_code == 200
    client.cookies.clear()
    me = await client.get("/api/auth/me")
    assert me.json()["authenticated"] is False
