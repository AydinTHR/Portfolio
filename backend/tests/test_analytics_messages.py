from .conftest import login


async def test_analytics_summary_requires_auth(client):
    assert (await client.get("/api/analytics/summary")).status_code == 401


async def test_analytics_event_and_summary(client):
    await client.post("/api/analytics/event", json={"type": "pageview", "path": "/"})
    await client.post("/api/analytics/event", json={"type": "pageview", "path": "/"})
    await client.post(
        "/api/analytics/event", json={"type": "section", "section": "projects"}
    )
    await client.post(
        "/api/analytics/event", json={"type": "section", "section": "projects"}
    )
    await client.post(
        "/api/analytics/event", json={"type": "section", "section": "about"}
    )

    await login(client)
    summary = (await client.get("/api/analytics/summary")).json()
    assert summary["total_views"] == 2
    assert summary["views_7d"] == 2
    assert summary["unique_visitors"] >= 1
    top = {s["section"]: s["count"] for s in summary["top_sections"]}
    assert top["projects"] == 2
    assert top["about"] == 1
    # Continuous zero-filled series: exactly 14 days, today's bucket holds the views.
    assert len(summary["recent_days"]) == 14
    assert summary["recent_days"][-1]["views"] == 2
    assert all(d["views"] == 0 for d in summary["recent_days"][:-1])


async def test_messages_list_requires_auth(client):
    assert (await client.get("/api/messages")).status_code == 401
    assert (await client.get("/api/messages/unread-count")).status_code == 401


async def test_unread_count(client):
    for i in range(2):
        await client.post(
            "/api/contact",
            json={"name": f"P{i}", "email": "p@example.com", "message": "Hi"},
        )
    await login(client)
    assert (await client.get("/api/messages/unread-count")).json() == {"count": 2}

    messages = (await client.get("/api/messages")).json()
    await client.patch(f"/api/messages/{messages[0]['id']}", json={"read": True})
    assert (await client.get("/api/messages/unread-count")).json() == {"count": 1}


async def test_message_mark_read_and_delete(client):
    await client.post(
        "/api/contact",
        json={"name": "Bob", "email": "bob@example.com", "message": "Yo"},
    )
    await login(client)

    messages = (await client.get("/api/messages")).json()
    assert len(messages) == 1
    mid = messages[0]["id"]

    patched = await client.patch(f"/api/messages/{mid}", json={"read": True})
    assert patched.status_code == 200
    assert patched.json()["read"] is True

    deleted = await client.delete(f"/api/messages/{mid}")
    assert deleted.status_code == 200
    assert (await client.get("/api/messages")).json() == []


async def test_message_bad_id_returns_400(client):
    await login(client)
    resp = await client.delete("/api/messages/not-a-valid-objectid")
    assert resp.status_code == 400
