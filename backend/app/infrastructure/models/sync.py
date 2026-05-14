from typing import Any
from uuid import UUID

from sqlalchemy import ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.models.base import Base, TimestampMixin, new_uuid


class OfflineSyncLog(Base, TimestampMixin):
    __tablename__ = "offline_sync_logs"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    device_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    operation: Mapped[str] = mapped_column(String(32), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(64), nullable=False)
    payload_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    detail: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
