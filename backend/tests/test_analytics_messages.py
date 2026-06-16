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
    # Peak-time buckets are always present and full-width.
    assert len(summary["by_weekday"]) == 7
    assert len(summary["by_hour"]) == 24
    assert sum(summary["by_weekday"]) == 2
    assert sum(summary["by_hour"]) == 2


async def test_analytics_sources_pages_and_new_returning(client):
    v1 = "11111111-1111-1111-1111-111111111111"
    v2 = "22222222-2222-2222-2222-222222222222"
    # v1: two pageviews from Google, on Home and a project page.
    await client.post(
        "/api/analytics/event",
        json={
            "type": "pageview",
            "path": "/",
            "referrer": "https://www.google.com/",
            "visitor": v1,
        },
    )
    await client.post(
        "/api/analytics/event",
        json={
            "type": "pageview",
            "path": "/projects/dog-wash",
            "referrer": "https://www.google.com/",
            "visitor": v1,
        },
    )
    # v2: one direct pageview (no referrer) on Home.
    await client.post(
        "/api/analytics/event",
        json={"type": "pageview", "path": "/", "referrer": None, "visitor": v2},
    )

    await login(client)
    summary = (await client.get("/api/analytics/summary")).json()

    sources = {s["label"]: s["count"] for s in summary["sources"]}
    assert sources["Search"] == 2
    assert sources["Direct"] == 1

    pages = {p["label"]: p["count"] for p in summary["top_pages"]}
    assert pages["Home"] == 2
    assert pages["Project: dog-wash"] == 1

    # Both visitors first seen today -> both "new", none returning yet.
    assert summary["unique_visitors"] == 2
    assert summary["new_visitors"] == 2
    assert summary["returning_visitors"] == 0


IPHONE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
)
MAC_CHROME_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)


async def test_admin_visits_are_not_tracked(client):
    await login(client)
    await client.post("/api/analytics/event", json={"type": "pageview", "path": "/"})
    summary = (await client.get("/api/analytics/summary")).json()
    assert summary["total_views"] == 0
    assert summary["visitors"] == []


async def test_visitor_device_and_visit_counts(client):
    # Same device id visiting twice from an iPhone, one other Mac/Chrome visitor.
    phone_id = "11111111-aaaa-bbbb-cccc-222222222222"
    for _ in range(2):
        await client.post(
            "/api/analytics/event",
            json={"type": "pageview", "visitor": phone_id},
            headers={"user-agent": IPHONE_UA},
        )
    await client.post(
        "/api/analytics/event",
        json={"type": "pageview", "visitor": "33333333-dddd-eeee-ffff-444444444444"},
        headers={"user-agent": MAC_CHROME_UA},
    )

    await login(client)
    summary = (await client.get("/api/analytics/summary")).json()
    rows = {v["device"]: v["visits"] for v in summary["visitors"]}
    assert rows == {"iOS · Safari · mobile": 2, "macOS · Chrome · desktop": 1}
    assert summary["unique_visitors"] == 2
    # Most-visiting device sorts first and carries a last-seen timestamp.
    assert summary["visitors"][0]["visits"] == 2
    assert summary["visitors"][0]["last_seen"]


async def test_event_rejects_malformed_visitor_id(client):
    resp = await client.post(
        "/api/analytics/event",
        json={"type": "pageview", "visitor": "<script>bad</script>"},
    )
    assert resp.status_code == 422


async def test_analytics_reset_requires_auth(client):
    assert (await client.post("/api/analytics/reset")).status_code == 401


async def test_analytics_reset_zeros_everything(client):
    # Events recorded while logged out (admin visits are dropped).
    await client.post("/api/analytics/event", json={"type": "pageview"})
    await client.post("/api/analytics/event", json={"type": "pageview"})
    await client.post("/api/analytics/event", json={"type": "section", "section": "about"})

    await login(client)
    resp = await client.post("/api/analytics/reset")
    assert resp.status_code == 200
    assert resp.json()["deleted_count"] == 3

    summary = (await client.get("/api/analytics/summary")).json()
    assert summary["total_views"] == 0
    assert summary["views_7d"] == 0
    assert summary["views_30d"] == 0
    assert summary["unique_visitors"] == 0
    assert summary["visitors"] == []
    assert summary["top_sections"] == []
    # The chart stays a continuous zero-filled 14-day series, not an empty list.
    assert len(summary["recent_days"]) == 14
    assert all(d["views"] == 0 for d in summary["recent_days"])


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
