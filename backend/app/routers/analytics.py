import datetime as dt
import hashlib

from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..config import settings
from ..db import get_db
from ..models.analytics import (
    AnalyticsSummary,
    DayViews,
    EventIn,
    SectionCount,
    VisitorRow,
)
from ..security import COOKIE_NAME, decode_token, get_current_admin

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _visitor_hash(request: Request, day: str) -> str:
    """Coarse, privacy-preserving visitor id: salted daily hash of IP + UA.

    Rotates daily and stores no raw PII. Fallback grouping key for events
    sent without a client-side visitor id.
    """
    ip = request.client.host if request.client else ""
    ua = request.headers.get("user-agent", "")
    raw = f"{settings.analytics_salt}:{day}:{ip}:{ua}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def _is_admin(request: Request) -> bool:
    """True when the request carries a valid admin session cookie."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return False
    payload = decode_token(token)
    return bool(payload) and payload.get("sub") == settings.admin_email


def _parse_device(ua: str) -> str:
    """Coarse device label from the user agent, e.g. 'iOS · Safari · mobile'."""
    ua_l = ua.lower()

    if "ipad" in ua_l or ("android" in ua_l and "mobile" not in ua_l):
        form = "tablet"
    elif "iphone" in ua_l or "android" in ua_l or "mobile" in ua_l:
        form = "mobile"
    else:
        form = "desktop"

    if "iphone" in ua_l or "ipad" in ua_l:
        os_name = "iOS"
    elif "android" in ua_l:
        os_name = "Android"
    elif "mac os" in ua_l or "macintosh" in ua_l:
        os_name = "macOS"
    elif "windows" in ua_l:
        os_name = "Windows"
    elif "linux" in ua_l:
        os_name = "Linux"
    else:
        os_name = "Other"

    # Order matters: Edge UAs contain "chrome"; Chrome UAs contain "safari".
    if "edg" in ua_l:
        browser = "Edge"
    elif "opr/" in ua_l or "opera" in ua_l:
        browser = "Opera"
    elif "chrome" in ua_l or "crios" in ua_l:
        browser = "Chrome"
    elif "firefox" in ua_l or "fxios" in ua_l:
        browser = "Firefox"
    elif "safari" in ua_l:
        browser = "Safari"
    else:
        browser = "Other"

    return f"{os_name} · {browser} · {form}"


@router.post("/event")
async def record_event(
    request: Request,
    payload: EventIn,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # The admin's own browsing must not pollute visitor stats.
    if _is_admin(request):
        return {"ok": True}

    now = dt.datetime.now(dt.UTC)
    day = now.strftime("%Y-%m-%d")
    await db.analytics_events.insert_one(
        {
            "type": payload.type,
            "path": payload.path,
            "section": payload.section,
            "referrer": payload.referrer,
            "visitor": payload.visitor,
            "device": _parse_device(request.headers.get("user-agent", "")),
            "visitor_hash": _visitor_hash(request, day),
            "created_at": now,
        }
    )
    return {"ok": True}


@router.post("/reset")
async def reset_analytics(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    """Wipe all recorded events so every number returns to zero."""
    result = await db.analytics_events.delete_many({})
    return {"deleted_count": result.deleted_count}


@router.get("/summary", response_model=AnalyticsSummary)
async def summary(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    now = dt.datetime.now(dt.UTC)
    d7 = now - dt.timedelta(days=7)
    d30 = now - dt.timedelta(days=30)

    total = await db.analytics_events.count_documents({"type": "pageview"})
    v7 = await db.analytics_events.count_documents(
        {"type": "pageview", "created_at": {"$gte": d7}}
    )
    v30 = await db.analytics_events.count_documents(
        {"type": "pageview", "created_at": {"$gte": d30}}
    )

    # Top sections (last 30d), bucketed in Python so behavior is identical
    # across MongoDB and the in-memory test double.
    section_counts: dict[str, int] = {}
    async for doc in db.analytics_events.find(
        {"type": "section", "created_at": {"$gte": d30}}, {"section": 1}
    ):
        section = doc.get("section")
        if section:
            section_counts[section] = section_counts.get(section, 0) + 1
    top_sections = [
        SectionCount(section=s, count=c)
        for s, c in sorted(section_counts.items(), key=lambda kv: kv[1], reverse=True)[:10]
    ]

    # Continuous 14-day series, zero-filled so the chart has no gaps.
    chart_window = 14
    chart_start = now - dt.timedelta(days=chart_window - 1)
    day_counts = {
        (chart_start + dt.timedelta(days=i)).strftime("%Y-%m-%d"): 0
        for i in range(chart_window)
    }
    window_floor = chart_start.replace(hour=0, minute=0, second=0, microsecond=0)

    # Per-device visit counts: group pageviews by the stable client-side
    # visitor id, falling back to the daily hash for events that lack one.
    visitor_rows: dict[str, dict] = {}
    unique_30d: set[str] = set()
    async for doc in db.analytics_events.find(
        {"type": "pageview"},
        {"visitor": 1, "visitor_hash": 1, "device": 1, "created_at": 1},
    ):
        created = doc["created_at"]
        key = doc.get("visitor") or doc.get("visitor_hash") or "unknown"

        day_key = created.strftime("%Y-%m-%d")
        if day_key in day_counts and created >= window_floor.replace(tzinfo=created.tzinfo):
            day_counts[day_key] += 1

        if created.replace(tzinfo=dt.UTC) >= d30:
            unique_30d.add(key)

        row = visitor_rows.setdefault(
            key,
            {"visits": 0, "last_seen": created, "device": doc.get("device") or "Unknown device"},
        )
        row["visits"] += 1
        if created >= row["last_seen"]:
            row["last_seen"] = created
            if doc.get("device"):
                row["device"] = doc["device"]

    recent_days = [DayViews(date=k, views=day_counts[k]) for k in sorted(day_counts)]
    visitors = [
        VisitorRow(device=r["device"], visits=r["visits"], last_seen=r["last_seen"])
        for r in sorted(visitor_rows.values(), key=lambda r: r["visits"], reverse=True)[:20]
    ]

    return AnalyticsSummary(
        total_views=total,
        views_7d=v7,
        views_30d=v30,
        unique_visitors=len(unique_30d),
        top_sections=top_sections,
        recent_days=recent_days,
        visitors=visitors,
    )
