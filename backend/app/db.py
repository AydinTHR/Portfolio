import datetime as dt
import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from .config import settings

logger = logging.getLogger("portfolio.db")

# Single content document lives under this fixed _id.
CONTENT_ID = "singleton"


class _DBState:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


_state = _DBState()


async def connect_to_mongo() -> None:
    _state.client = AsyncIOMotorClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=5000,
        uuidRepresentation="standard",
    )
    _state.db = _state.client[settings.db_name]
    await _create_indexes(_state.db)
    await seed_if_empty(_state.db)
    logger.info("Connected to MongoDB (db=%s)", settings.db_name)


async def close_mongo_connection() -> None:
    if _state.client is not None:
        _state.client.close()
        _state.client = None
        _state.db = None


def get_database() -> AsyncIOMotorDatabase:
    if _state.db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return _state.db


def set_database(db: AsyncIOMotorDatabase) -> None:
    """Inject a database (used by tests)."""
    _state.db = db


# FastAPI dependency
def get_db() -> AsyncIOMotorDatabase:
    return get_database()


async def _create_indexes(db: AsyncIOMotorDatabase) -> None:
    await db.messages.create_index([("created_at", -1)])
    await db.analytics_events.create_index([("created_at", -1)])
    await db.analytics_events.create_index([("type", 1), ("created_at", -1)])


async def seed_if_empty(db: AsyncIOMotorDatabase) -> None:
    """Insert default content if the content collection is empty."""
    from .services.seed import DEFAULT_CONTENT

    existing = await db.content.find_one({"_id": CONTENT_ID})
    if existing is None:
        doc = {
            "_id": CONTENT_ID,
            **DEFAULT_CONTENT,
            "updated_at": dt.datetime.now(dt.UTC),
        }
        await db.content.insert_one(doc)
        logger.info("Seeded default portfolio content")
