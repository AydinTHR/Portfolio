from .conftest import login


async def _published(client):
    return (await client.get("/api/content")).json()


async def test_draft_requires_auth(client):
    assert (await client.get("/api/content/draft")).status_code == 401
    assert (await client.put("/api/content/draft", json={})).status_code == 401
    assert (await client.delete("/api/content/draft")).status_code == 401


async def test_draft_save_get_delete(client):
    await login(client)

    empty = (await client.get("/api/content/draft")).json()
    assert empty["exists"] is False

    draft = await _published(client)
    draft["hero"]["greeting"] = "Draft greeting"
    saved = await client.put("/api/content/draft", json=draft)
    assert saved.status_code == 200
    assert saved.json()["content"]["hero"]["greeting"] == "Draft greeting"

    fetched = (await client.get("/api/content/draft")).json()
    assert fetched["exists"] is True
    assert fetched["content"]["hero"]["greeting"] == "Draft greeting"

    # Draft must not affect the published content.
    assert (await _published(client))["hero"]["greeting"] != "Draft greeting"

    assert (await client.delete("/api/content/draft")).status_code == 200
    assert (await client.get("/api/content/draft")).json()["exists"] is False


async def test_publish_clears_draft_and_archives_version(client):
    await login(client)

    current = await _published(client)
    draft = {**current, "hero": {**current["hero"], "greeting": "Pending"}}
    await client.put("/api/content/draft", json=draft)

    publish = await client.put("/api/content", json=draft)
    assert publish.status_code == 200

    # Draft is consumed by publishing.
    assert (await client.get("/api/content/draft")).json()["exists"] is False

    # The outgoing version was archived.
    versions = (await client.get("/api/content/versions")).json()
    assert len(versions) == 1
    assert versions[0]["label"]  # human-readable label present


async def test_restore_version_roundtrip(client):
    await login(client)

    original = await _published(client)
    original_greeting = original["hero"]["greeting"]

    changed = {**original, "hero": {**original["hero"], "greeting": "Changed"}}
    await client.put("/api/content", json=changed)
    assert (await _published(client))["hero"]["greeting"] == "Changed"

    versions = (await client.get("/api/content/versions")).json()
    restored = await client.post(f"/api/content/versions/{versions[0]['id']}/restore")
    assert restored.status_code == 200
    assert restored.json()["hero"]["greeting"] == original_greeting
    assert (await _published(client))["hero"]["greeting"] == original_greeting

    # Restoring archived the "Changed" state too: history grew.
    assert len((await client.get("/api/content/versions")).json()) == 2


async def test_versions_capped_at_ten(client):
    await login(client)
    base = await _published(client)
    for i in range(13):
        doc = {**base, "hero": {**base["hero"], "greeting": f"Rev {i}"}}
        await client.put("/api/content", json=doc)
    versions = (await client.get("/api/content/versions")).json()
    assert len(versions) == 10


async def test_restore_bad_and_missing_ids(client):
    await login(client)
    assert (await client.post("/api/content/versions/not-an-id/restore")).status_code == 400
    assert (
        await client.post("/api/content/versions/64b000000000000000000000/restore")
    ).status_code == 404


async def test_delete_all_versions_requires_auth(client):
    assert (await client.delete("/api/content/versions")).status_code == 401


async def test_delete_all_versions_keeps_current(client):
    await login(client)
    base = await _published(client)
    for i in range(3):
        doc = {**base, "hero": {**base["hero"], "greeting": f"Rev {i}"}}
        await client.put("/api/content", json=doc)

    assert len((await client.get("/api/content/versions")).json()) == 3
    live_before = await _published(client)

    resp = await client.delete("/api/content/versions")
    assert resp.status_code == 200
    assert resp.json()["deleted_count"] == 3

    # History is gone but the current published content is untouched.
    assert (await client.get("/api/content/versions")).json() == []
    assert (await _published(client))["hero"]["greeting"] == live_before["hero"]["greeting"]
    assert live_before["hero"]["greeting"] == "Rev 2"
