from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from ..db import get_db
from ..models.message import MessageOut, MessageUpdate
from ..security import get_current_admin

router = APIRouter(prefix="/api/messages", tags=["messages"])


def _serialize(doc: dict) -> MessageOut:
    return MessageOut(
        id=str(doc["_id"]),
        name=doc["name"],
        email=doc["email"],
        message=doc["message"],
        created_at=doc["created_at"],
        read=doc.get("read", False),
    )


def _oid(message_id: str) -> ObjectId:
    try:
        return ObjectId(message_id)
    except (InvalidId, TypeError) as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid message id"
        ) from err


@router.get("", response_model=list[MessageOut])
async def list_messages(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: str = Depends(get_current_admin),
    limit: int = Query(default=50, ge=1, le=200),
    skip: int = Query(default=0, ge=0),
):
    cursor = db.messages.find().sort("created_at", -1).skip(skip).limit(limit)
    return [_serialize(d) async for d in cursor]


@router.patch("/{message_id}", response_model=MessageOut)
async def update_message(
    message_id: str,
    payload: MessageUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    updated = await db.messages.find_one_and_update(
        {"_id": _oid(message_id)},
        {"$set": {"read": payload.read}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return _serialize(updated)


@router.delete("/{message_id}")
async def delete_message(
    message_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    result = await db.messages.delete_one({"_id": _oid(message_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return {"ok": True}
