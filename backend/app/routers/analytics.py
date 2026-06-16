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
    LabelCount,
    SectionCount,
    VisitorRow,
)
from ..security import COOKIE_NAME, decode_token, get_current_admin

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _visitor_hash(request: Request, period: str) -> str:
    """Coarse, privacy-preserving visitor id: salted hash of IP + UA.

    Rotates per ISO week (not daily) so a repeat visitor without first-party
    storage isn't counted as a brand-new person every day, while still storing
    no raw PII. Used as the fallback grouping key when there's no client id.
    """
    ip = request.client.host if request.client else ""
    ua = request.headers.get("user-agent", "")
    raw = f"{settings.analytics_salt}:{period}:{ip}:{ua}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def _categorize_referrer(referrer: str | None) -> str:
    """Bucket a raw referrer into a readable traffic source."""
    if not referrer:
        return "Direct"
    r = referrer.lower()
    if "aydintehrani.com" in r:
        return "Direct"
    if any(s in r for s in ("google.", "bing.", "duckduckgo.", "yahoo.", "ecosia.")):
        return "Search"
    if "linkedin." in r or "lnkd.in" in r:
        return "LinkedIn"
    if "github." in r:
        return "GitHub"
    if "t.co" in r or "twitter." in r or "//x.com" in r or ".x.com" in r:
        return "X / Twitter"
    if "instagram." in r:
        return "Instagram"
    if "reddit." in r:
        return "Reddit"
    if "facebook." in r or "fb.com" in r:
        return "Facebook"
    return "Other"


def _page_label(path: str | None) -> str:
    """Human-readable label for a tracked path."""
    if not path or path == "/":
        return "Home"
    if path.startswith("/projects/"):
        return f"Project: {path[len('/projects/'):]}"
    return path


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
    week = now.strftime("%G-W%V")
    await db.analytics_events.insert_one(
        {
            "type": payload.type,
            "path": payload.path,
            "section": payload.section,
            "referrer": payload.referrer,
            "visitor": payload.visitor,
            "device": _parse_device(request.headers.get("user-agent", "")),
            "visitor_hash": _visitor_hash(request, week),
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

    # One pass over all pageviews powers: the 14-day chart, all-time per-device
    # rows, and the last-30d breakdowns (sources, pages, peak times, uniques,
    # new-vs-returning). Visitors are grouped by the stable client id, falling
    # back to the weekly hash for events that lack one.
    visitor_rows: dict[str, dict] = {}
    visitor_days: dict[str, set] = {}  # last-30d distinct days per visitor
    sources_counts: dict[str, int] = {}
    page_counts: dict[str, int] = {}
    by_weekday = [0] * 7
    by_hour = [0] * 24
    async for doc in db.analytics_events.find(
        {"type": "pageview"},
        {
            "visitor": 1,
            "visitor_hash": 1,
            "device": 1,
            "created_at": 1,
            "path": 1,
            "referrer": 1,
        },
    ):
        created = doc["created_at"]
        c = created if created.tzinfo else created.replace(tzinfo=dt.UTC)
        key = doc.get("visitor") or doc.get("visitor_hash") or "unknown"
        day_key = created.strftime("%Y-%m-%d")

        if day_key in day_counts and c >= window_floor:
            day_counts[day_key] += 1

        row = visitor_rows.setdefault(
            key,
            {"visits": 0, "last_seen": created, "device": doc.get("device") or "Unknown device"},
        )
        row["visits"] += 1
        if created >= row["last_seen"]:
            row["last_seen"] = created
            if doc.get("device"):
                row["device"] = doc["device"]

        if c >= d30:
            visitor_days.setdefault(key, set()).add(day_key)
            src = _categorize_referrer(doc.get("referrer"))
            sources_counts[src] = sources_counts.get(src, 0) + 1
            page = _page_label(doc.get("path"))
            page_counts[page] = page_counts.get(page, 0) + 1
            by_weekday[c.weekday()] += 1
            by_hour[c.hour] += 1

    unique_30d = len(visitor_days)
    returning = sum(1 for days in visitor_days.values() if len(days) >= 2)

    recent_days = [DayViews(date=k, views=day_counts[k]) for k in sorted(day_counts)]
    visitors = [
        VisitorRow(device=r["device"], visits=r["visits"], last_seen=r["last_seen"])
        for r in sorted(visitor_rows.values(), key=lambda r: r["visits"], reverse=True)[:20]
    ]
    sources = [
        LabelCount(label=k, count=v)
        for k, v in sorted(sources_counts.items(), key=lambda kv: kv[1], reverse=True)[:10]
    ]
    top_pages = [
        LabelCount(label=k, count=v)
        for k, v in sorted(page_counts.items(), key=lambda kv: kv[1], reverse=True)[:10]
    ]

    return AnalyticsSummary(
        total_views=total,
        views_7d=v7,
        views_30d=v30,
        unique_visitors=unique_30d,
        new_visitors=unique_30d - returning,
        returning_visitors=returning,
        top_sections=top_sections,
        sources=sources,
        top_pages=top_pages,
        recent_days=recent_days,
        visitors=visitors,
        by_weekday=by_weekday,
        by_hour=by_hour,
    )
