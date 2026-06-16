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


class LabelCount(BaseModel):
    label: str
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
    new_visitors: int = 0
    returning_visitors: int = 0
    top_sections: list[SectionCount] = []
    sources: list[LabelCount] = []
    top_pages: list[LabelCount] = []
    recent_days: list[DayViews] = []
    visitors: list[VisitorRow] = []
    by_weekday: list[int] = []  # 7 buckets, Mon..Sun
    by_hour: list[int] = []  # 24 buckets, hour of day (UTC)
