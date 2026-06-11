import datetime as dt
from typing import Literal

from pydantic import BaseModel, Field


class EventIn(BaseModel):
    type: Literal["pageview", "section"] = "pageview"
    path: str = "/"
    section: str | None = None
    referrer: str | None = None
    # Anonymous first-party device id generated client-side (localStorage),
    # used to count repeat visits per device. Optional: blocked storage sends null.
    visitor: str | None = Field(
        default=None, min_length=8, max_length=64, pattern=r"^[A-Za-z0-9-]+$"
    )


class SectionCount(BaseModel):
    section: str
    count: int


class DayViews(BaseModel):
    date: str
    views: int


class VisitorRow(BaseModel):
    device: str
    visits: int
    last_seen: dt.datetime


class AnalyticsSummary(BaseModel):
    total_views: int
    views_7d: int
    views_30d: int
    unique_visitors: int
    top_sections: list[SectionCount] = []
    recent_days: list[DayViews] = []
    visitors: list[VisitorRow] = []
