import datetime as dt

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import CONTENT_ID, get_db
from ..models.content import PortfolioContent
from ..security import get_current_admin

router = APIRouter(prefix="/api/content", tags=["content"])


@router.get("", response_model=PortfolioContent)
async def get_content(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Public: the published portfolio content (the frontend's source of truth)."""
    doc = await db.content.find_one({"_id": CONTENT_ID})
    if not doc:
        from ..services.seed import DEFAULT_CONTENT

        return DEFAULT_CONTENT
    return doc


@router.put("", response_model=PortfolioContent)
async def update_content(
    payload: PortfolioContent,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    """Admin: replace the published content."""
    data = payload.model_dump()
    data["updated_at"] = dt.datetime.now(dt.UTC)
    await db.content.update_one({"_id": CONTENT_ID}, {"$set": data}, upsert=True)
    return data
