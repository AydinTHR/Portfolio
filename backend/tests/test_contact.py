import app.routers.contact as contact_module

from .conftest import login

VALID = {"name": "Jane", "email": "jane@example.com", "message": "Hi there!"}


async def test_contact_stores_message(client):
    resp = await client.post("/api/contact", json=VALID)
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}

    await login(client)
    messages = (await client.get("/api/messages")).json()
    assert len(messages) == 1
    assert messages[0]["name"] == "Jane"
    assert messages[0]["read"] is False


async def test_contact_invalid_email_rejected(client):
    resp = await client.post(
        "/api/contact", json={**VALID, "email": "not-an-email"}
    )
    assert resp.status_code == 422


async def test_contact_empty_fields_rejected(client):
    resp = await client.post(
        "/api/contact", json={"name": "", "email": "a@b.com", "message": ""}
    )
    assert resp.status_code == 422


async def test_honeypot_silently_ignored(client):
    resp = await client.post(
        "/api/contact", json={**VALID, "website": "http://spam.example"}
    )
    assert resp.status_code == 200

    await login(client)
    messages = (await client.get("/api/messages")).json()
    assert messages == []  # nothing stored


async def test_email_notification_invoked(client, monkeypatch):
    calls = {}

    async def fake_send(name, email, message):
        calls["args"] = (name, email, message)
        return True

    monkeypatch.setattr(contact_module, "send_contact_notification", fake_send)
    resp = await client.post("/api/contact", json=VALID)
    assert resp.status_code == 200
    assert calls["args"] == ("Jane", "jane@example.com", "Hi there!")
