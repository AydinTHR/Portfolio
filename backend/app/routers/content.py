import datetime as dt
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from ..db import CONTENT_ID, DRAFT_ID, MAX_VERSIONS, get_db
from ..models.content import PortfolioContent
from ..security import get_current_admin
from .common import oid_or_400

router = APIRouter(prefix="/api/content", tags=["content"])


class DraftOut(BaseModel):
    exists: bool
    content: dict[str, Any] | None = None


class VersionOut(BaseModel):
    id: str
    archived_at: dt.datetime
    label: str = ""


async def _archive_current(db: AsyncIOMotorDatabase) -> None:
    """Snapshot the published document into content_versions, keeping the newest N."""
    current = await db.content.find_one({"_id": CONTENT_ID})
    if not current:
        return
    current.pop("_id", None)
    await db.content_versions.insert_one(
        {"content": current, "archived_at": dt.datetime.now(dt.UTC)}
    )
    stale = (
        await db.content_versions.find({}, {"_id": 1})
        .sort("archived_at", -1)
        .skip(MAX_VERSIONS)
        .to_list(length=None)
    )
    if stale:
        await db.content_versions.delete_many({"_id": {"$in": [d["_id"] for d in stale]}})


# ---- Draft (admin working copy) ----

@router.get("/draft", response_model=DraftOut)
async def get_draft(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    doc = await db.content.find_one({"_id": DRAFT_ID})
    if not doc:
        return DraftOut(exists=False)
    doc.pop("_id", None)
    return DraftOut(exists=True, content=doc)


@router.put("/draft", response_model=DraftOut)
async def save_draft(
    payload: PortfolioContent,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    data = payload.model_dump()
    data["updated_at"] = dt.datetime.now(dt.UTC)
    await db.content.update_one({"_id": DRAFT_ID}, {"$set": data}, upsert=True)
    return DraftOut(exists=True, content=data)


@router.delete("/draft")
async def delete_draft(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    await db.content.delete_one({"_id": DRAFT_ID})
    return {"ok": True}


# ---- Versions (rollback history) ----

@router.get("/versions", response_model=list[VersionOut])
async def list_versions(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    cursor = db.content_versions.find().sort("archived_at", -1)
    out = []
    async for doc in cursor:
        hero = (doc.get("content") or {}).get("hero") or {}
        label = f"{hero.get('greeting', '')} {hero.get('name', '')}".strip()
        out.append(
            VersionOut(id=str(doc["_id"]), archived_at=doc["archived_at"], label=label)
        )
    return out


@router.post("/versions/{version_id}/restore", response_model=PortfolioContent)
async def restore_version(
    version_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    version = await db.content_versions.find_one({"_id": oid_or_400(version_id, "version id")})
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")

    await _archive_current(db)
    data = dict(version["content"])
    data["updated_at"] = dt.datetime.now(dt.UTC)
    await db.content.update_one({"_id": CONTENT_ID}, {"$set": data}, upsert=True)
    return data


# ---- Published content ----

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
    """Admin: publish new content. Archives the outgoing version and clears the draft."""
    await _archive_current(db)
    data = payload.model_dump()
    data["updated_at"] = dt.datetime.now(dt.UTC)
    await db.content.update_one({"_id": CONTENT_ID}, {"$set": data}, upsert=True)
    await db.content.delete_one({"_id": DRAFT_ID})
    return data
