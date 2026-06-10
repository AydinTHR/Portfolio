from typing import Literal

from pydantic import BaseModel


class EventIn(BaseModel):
    type: Literal["pageview", "section"] = "pageview"
    path: str = "/"
    section: str | None = None
    referrer: str | None = None


class SectionCount(BaseModel):
    section: str
    count: int


class DayViews(BaseModel):
    date: str
    views: int


class AnalyticsSummary(BaseModel):
    total_views: int
    views_7d: int
    views_30d: int
    unique_visitors: int
    top_sections: list[SectionCount] = []
    recent_days: list[DayViews] = []
