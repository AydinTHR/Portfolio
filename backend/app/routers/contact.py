import datetime as dt

from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db
from ..models.message import ContactIn
from ..rate_limit import limiter
from ..services.email import send_contact_notification

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("")
@limiter.limit("5/minute")
async def submit_contact(
    request: Request,
    payload: ContactIn,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # Honeypot: silently accept (so bots don't learn) but store/send nothing.
    if payload.website.strip():
        return {"ok": True}

    doc = {
        "name": payload.name,
        "email": str(payload.email),
        "message": payload.message,
        "created_at": dt.datetime.now(dt.UTC),
        "read": False,
        "ip": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
    }
    await db.messages.insert_one(doc)
    await send_contact_notification(payload.name, str(payload.email), payload.message)
    return {"ok": True}
