"""Liveness and dependency readiness probes for orchestration."""
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.deps import DbSession

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    """Process liveness only, no external dependencies."""
    return {"status": "ok", "service": "nexus-learnai-api"}


@router.get("/health/ready")
async def ready(db: DbSession) -> dict[str, str]:
    """Readiness: refuse traffic if the database is unavailable."""
    try:
        await db.execute(text("SELECT 1"))
        # Connectivity alone is insufficient: schema migrations must exist.
        await db.execute(text("SELECT 1 FROM users LIMIT 1"))
        await db.execute(text("SELECT 1 FROM schools LIMIT 1"))
        await db.execute(text("SELECT 1 FROM courses LIMIT 1"))
        await db.execute(text("SELECT 1 FROM quizzes LIMIT 1"))
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail="Database unavailable") from None
    return {"status": "ready"}
