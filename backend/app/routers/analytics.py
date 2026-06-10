import datetime as dt
import hashlib

from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..config import settings
from ..db import get_db
from ..models.analytics import AnalyticsSummary, DayViews, EventIn, SectionCount
from ..security import get_current_admin

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _visitor_hash(request: Request, day: str) -> str:
    """Coarse, privacy-preserving visitor id: salted daily hash of IP + UA.

    Rotates daily and stores no raw PII.
    """
    ip = request.client.host if request.client else ""
    ua = request.headers.get("user-agent", "")
    raw = f"{settings.analytics_salt}:{day}:{ip}:{ua}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


@router.post("/event")
async def record_event(
    request: Request,
    payload: EventIn,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    now = dt.datetime.now(dt.UTC)
    day = now.strftime("%Y-%m-%d")
    await db.analytics_events.insert_one(
        {
            "type": payload.type,
            "path": payload.path,
            "section": payload.section,
            "referrer": payload.referrer,
            "visitor_hash": _visitor_hash(request, day),
            "created_at": now,
        }
    )
    return {"ok": True}


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
    unique = await db.analytics_events.distinct(
        "visitor_hash", {"created_at": {"$gte": d30}}
    )

    # Top sections (last 30d) and per-day pageviews (last 7d), bucketed in Python
    # so behavior is identical across MongoDB and the in-memory test double.
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

    day_counts: dict[str, int] = {}
    async for doc in db.analytics_events.find(
        {"type": "pageview", "created_at": {"$gte": d7}}, {"created_at": 1}
    ):
        key = doc["created_at"].strftime("%Y-%m-%d")
        day_counts[key] = day_counts.get(key, 0) + 1
    recent_days = [DayViews(date=k, views=day_counts[k]) for k in sorted(day_counts)]

    return AnalyticsSummary(
        total_views=total,
        views_7d=v7,
        views_30d=v30,
        unique_visitors=len(unique),
        top_sections=top_sections,
        recent_days=recent_days,
    )
