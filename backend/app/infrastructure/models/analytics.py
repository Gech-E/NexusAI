from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.infrastructure.models.institution import School
    from app.infrastructure.models.user import User


class AnalyticsSnapshot(Base, TimestampMixin):
    __tablename__ = "analytics_snapshots"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    school_id: Mapped[UUID | None] = mapped_column(ForeignKey("schools.id", ondelete="CASCADE"), nullable=True)
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    metrics: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    grain: Mapped[str] = mapped_column(String(32), default="daily", nullable=False)

    school: Mapped["School | None"] = relationship(back_populates="analytics")


class AnalyticsEvent(Base, TimestampMixin):
    __tablename__ = "analytics_events"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    school_id: Mapped[UUID | None] = mapped_column(ForeignKey("schools.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    properties: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
