"""Offline sync endpoints — bulk data ingestion and sync status."""

import hashlib
import json
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func

from app.deps import CurrentUser, DbSession
from app.infrastructure.models.sync import OfflineSyncLog

router = APIRouter()


class SyncRecord(BaseModel):
    entity_type: str  # e.g. "quiz_attempt", "study_session"
    entity_id: str
    operation: str = Field(default="upsert")  # "create", "update", "upsert"
    data: dict[str, Any] = Field(default_factory=dict)


class SyncPayload(BaseModel):
    device_id: str = Field(min_length=1, max_length=128)
    records: list[SyncRecord] = Field(default_factory=list)


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
async def bulk_sync(
    payload: SyncPayload,
    db: DbSession,
    user: CurrentUser,
) -> dict:
    """
    Ingests a batch of offline-collected data and logs each record
    into the OfflineSyncLog table for auditing and conflict resolution.
    """
    synced = 0
    errors = []

    for record in payload.records:
        try:
            # Compute payload hash for deduplication
            payload_hash = hashlib.sha256(
                json.dumps(record.data, sort_keys=True, default=str).encode()
            ).hexdigest()

            # Check for duplicate (same device, entity, and hash)
            existing_q = await db.execute(
                select(OfflineSyncLog).where(
                    OfflineSyncLog.device_id == payload.device_id,
                    OfflineSyncLog.entity_type == record.entity_type,
                    OfflineSyncLog.entity_id == record.entity_id,
                    OfflineSyncLog.payload_hash == payload_hash,
                ).limit(1)
            )
            if existing_q.scalars().first():
                # Skip duplicate
                continue

            log = OfflineSyncLog(
                device_id=payload.device_id,
                user_id=user.id,
                operation=record.operation,
                entity_type=record.entity_type,
                entity_id=record.entity_id,
                payload_hash=payload_hash,
                status="synced",
                detail=record.data,
            )
            db.add(log)
            synced += 1
        except Exception as e:
            errors.append({
                "entity_type": record.entity_type,
                "entity_id": record.entity_id,
                "error": str(e),
            })

    if synced > 0:
        await db.commit()

    return {
        "status": "success" if not errors else "partial",
        "synced": synced,
        "skipped_duplicates": len(payload.records) - synced - len(errors),
        "errors": errors,
        "device_id": payload.device_id,
    }


@router.get("/status")
async def sync_status(
    db: DbSession,
    user: CurrentUser,
    limit: int = 50,
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
