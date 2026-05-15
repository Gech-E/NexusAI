from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.infrastructure.database import engine, init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    if settings.app_env == "development":
        await init_db()
        # Auto-seed demo data if database is empty
        try:
            from scripts.seed import run_seed
            await run_seed()
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Seed skipped: {e}")
    yield
    await engine.dispose()


app = FastAPI(title=settings.app_name, lifespan=lifespan, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.websockets.cv_alerts import router as websocket_router

app.include_router(api_router, prefix=settings.api_v1_prefix)
app.include_router(websocket_router)

@app.get("/")
async def root() -> dict[str, str]:
    return {"name": settings.app_name, "docs": "/docs"}
