"""Offline sync applies a narrowly validated set of domain mutations.

Quiz attempt submissions use /quizzes/{id}/submit and are not duplicated here.
"""
import hashlib
import json
from math import isfinite
from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func

from app.deps import CurrentUser, DbSession
from app.infrastructure.models.academic import Enrollment
from app.infrastructure.models.sync import OfflineSyncLog

router = APIRouter()


class SyncRecord(BaseModel):
    entity_type: Literal["course_progress"]
    entity_id: str = Field(min_length=1, max_length=64)
    operation: Literal["upsert"] = "upsert"
    data: dict[str, Any] = Field(default_factory=dict)


class SyncPayload(BaseModel):
    device_id: str = Field(min_length=1, max_length=128)
    records: list[SyncRecord] = Field(default_factory=list, max_length=100)


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
async def bulk_sync(payload: SyncPayload, db: DbSession, user: CurrentUser) -> dict:
    """Apply progress events, preserving the higher completed percentage on conflicts.

    An unsupported entity fails validation before any records are applied.
    Enrollment ownership is checked for every event; all events commit together.
    """
    # Parse and validate the entire batch before mutating domain tables.
    parsed: list[tuple[SyncRecord, UUID, float, str]] = []
    for record in payload.records:
        try:
            course_id = UUID(record.entity_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid course ID") from None
        value = record.data.get("progress_pct")
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise HTTPException(status_code=422, detail="progress_pct must be a number")
        progress = float(value)
        if not isfinite(progress) or not 0 <= progress <= 100:
            raise HTTPException(status_code=422, detail="progress_pct must be between 0 and 100")
        hash_value = hashlib.sha256(json.dumps(
            {"progress_pct": progress}, sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")).hexdigest()
        parsed.append((record, course_id, progress, hash_value))

    synced = 0
    duplicates = 0
    seen: set[tuple[UUID, str]] = set()
    for record, course_id, progress, hash_value in parsed:
        batch_key = (course_id, hash_value)
        if batch_key in seen:
            duplicates += 1
            continue
        seen.add(batch_key)

        enrollment = (await db.execute(
            select(Enrollment).where(
                Enrollment.student_user_id == user.id,
                Enrollment.course_id == course_id,
            ).with_for_update()
        )).scalar_one_or_none()
        if enrollment is None:
            raise HTTPException(status_code=403, detail="Course enrollment not found")

        existing = (await db.execute(
            select(OfflineSyncLog.id).where(
                OfflineSyncLog.user_id == user.id,
                OfflineSyncLog.device_id == payload.device_id,
                OfflineSyncLog.entity_type == record.entity_type,
                OfflineSyncLog.entity_id == record.entity_id,
                OfflineSyncLog.operation == record.operation,
                OfflineSyncLog.payload_hash == hash_value,
            ).limit(1)
        )).scalar_one_or_none()
        if existing:
            duplicates += 1
            continue

        # Completion never goes backwards if an older device synchronizes later.
        enrollment.progress_pct = max(enrollment.progress_pct, progress)
        db.add(OfflineSyncLog(
            device_id=payload.device_id,
            user_id=user.id,
            operation=record.operation,
            entity_type=record.entity_type,
            entity_id=record.entity_id,
            payload_hash=hash_value,
            status="synced",
            detail={"progress_pct": progress},
        ))
        synced += 1

    if synced:
        await db.commit()
    return {
        "status": "success",
        "synced": synced,
        "skipped_duplicates": duplicates,
        "errors": [],
        "device_id": payload.device_id,
    }


@router.get("/status")
async def sync_status(
    db: DbSession,
    user: CurrentUser,
    limit: int = Query(default=50, ge=1, le=100),
) -> dict:
    """Returns sync history for the authenticated user."""
    # Get recent sync logs
    logs_q = await db.execute(
        select(OfflineSyncLog)
        .where(OfflineSyncLog.user_id == user.id)
        .order_by(OfflineSyncLog.created_at.desc())
        .limit(limit)
    )
    logs = logs_q.scalars().all()

    # Aggregate counts
    total_q = await db.execute(
        select(func.count(OfflineSyncLog.id)).where(OfflineSyncLog.user_id == user.id)
    )
    total = total_q.scalar() or 0

    synced_q = await db.execute(
        select(func.count(OfflineSyncLog.id)).where(
            OfflineSyncLog.user_id == user.id,
            OfflineSyncLog.status == "synced",
        )
    )
    synced = synced_q.scalar() or 0

    failed_q = await db.execute(
        select(func.count(OfflineSyncLog.id)).where(
            OfflineSyncLog.user_id == user.id,
            OfflineSyncLog.status == "failed",
        )
    )
    failed = failed_q.scalar() or 0

    return {
        "total_records": total,
        "synced": synced,
        "failed": failed,
        "pending": total - synced - failed,
        "last_sync": logs[0].created_at.isoformat() if logs else None,
        "recent_logs": [
            {
                "id": str(log.id),
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "operation": log.operation,
                "status": log.status,
                "device_id": log.device_id,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs[:20]
        ],
    }
