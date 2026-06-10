import datetime as dt

from bson.binary import Binary
from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db
from ..security import get_current_admin
from .common import oid_or_400

router = APIRouter(prefix="/api/images", tags=["images"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("")
async def upload_image(
    file: UploadFile,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG, WebP, and GIF images are allowed",
        )
    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Image must be 5 MB or smaller",
        )
    result = await db.images.insert_one(
        {
            "data": Binary(data),
            "content_type": file.content_type,
            "filename": file.filename or "upload",
            "size": len(data),
            "created_at": dt.datetime.now(dt.UTC),
        }
    )
    image_id = str(result.inserted_id)
    return {"id": image_id, "url": f"/api/images/{image_id}"}


@router.get("/{image_id}")
async def get_image(image_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await db.images.find_one({"_id": oid_or_400(image_id, "image id")})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return Response(
        content=bytes(doc["data"]),
        media_type=doc["content_type"],
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


@router.delete("/{image_id}")
async def delete_image(
    image_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    result = await db.images.delete_one({"_id": oid_or_400(image_id, "image id")})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return {"ok": True}
