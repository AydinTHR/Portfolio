from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status


def oid_or_400(value: str, label: str = "id") -> ObjectId:
    """Parse an ObjectId path parameter or fail with a 400."""
    try:
        return ObjectId(value)
    except (InvalidId, TypeError) as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid {label}"
        ) from err
