from .conftest import login


async def test_health(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


async def test_get_content_returns_defaults_when_empty(client):
    resp = await client.get("/api/content")
    assert resp.status_code == 200
    data = resp.json()
    assert data["hero"]["name"] == "Aydin"
    assert isinstance(data["skills"], list) and len(data["skills"]) > 0
    assert isinstance(data["projects"], list)


async def test_put_content_requires_auth(client):
    resp = await client.put("/api/content", json={})
    assert resp.status_code == 401


async def test_put_content_then_get_roundtrip(client):
    await login(client)
    current = (await client.get("/api/content")).json()
    current["hero"]["name"] = "Updated Name"
    put = await client.put("/api/content", json=current)
    assert put.status_code == 200, put.text
    assert put.json()["hero"]["name"] == "Updated Name"

    # Persisted: a fresh GET reflects the change.
    again = await client.get("/api/content")
    assert again.json()["hero"]["name"] == "Updated Name"


async def test_put_content_rejects_invalid_shape(client):
    await login(client)
    # Missing required `hero` -> 422 validation error.
    resp = await client.put("/api/content", json={"about": {}})
    assert resp.status_code == 422
