import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .config import settings
from .db import close_mongo_connection, connect_to_mongo
from .rate_limit import limiter

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


def create_app() -> FastAPI:
    app = FastAPI(title="Portfolio API", version="1.0.0", lifespan=lifespan)

    # Rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health", tags=["health"])
    async def health():
        return {"status": "ok"}

    # Feature routers
    from .routers import analytics, auth, contact, content, messages

    app.include_router(content.router)
    app.include_router(auth.router)
    app.include_router(contact.router)
    app.include_router(analytics.router)
    app.include_router(messages.router)

    return app


app = create_app()
