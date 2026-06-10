from .conftest import login

PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
    b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)


async def test_upload_requires_auth(client):
    resp = await client.post(
        "/api/images", files={"file": ("a.png", PNG_BYTES, "image/png")}
    )
    assert resp.status_code == 401


async def test_upload_and_fetch_roundtrip(client):
    await login(client)
    up = await client.post(
        "/api/images", files={"file": ("avatar.png", PNG_BYTES, "image/png")}
    )
    assert up.status_code == 200
    body = up.json()
    assert body["url"] == f"/api/images/{body['id']}"

    # Serving is public (no auth needed) and cacheable.
    fetched = await client.get(body["url"])
    assert fetched.status_code == 200
    assert fetched.headers["content-type"] == "image/png"
    assert "immutable" in fetched.headers["cache-control"]
    assert fetched.content == PNG_BYTES


async def test_upload_rejects_disallowed_type(client):
    await login(client)
    resp = await client.post(
        "/api/images", files={"file": ("evil.svg", b"<svg/>", "image/svg+xml")}
    )
    assert resp.status_code == 415


async def test_upload_rejects_oversized(client):
    await login(client)
    big = b"x" * (5 * 1024 * 1024 + 1)
    resp = await client.post(
        "/api/images", files={"file": ("big.png", big, "image/png")}
    )
    assert resp.status_code == 413


async def test_delete_image(client):
    await login(client)
    up = (
        await client.post(
            "/api/images", files={"file": ("a.png", PNG_BYTES, "image/png")}
        )
    ).json()
    assert (await client.delete(f"/api/images/{up['id']}")).status_code == 200
    assert (await client.get(up["url"])).status_code == 404
    assert (await client.get("/api/images/not-an-id")).status_code == 400
