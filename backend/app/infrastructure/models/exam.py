from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.infrastructure.models.assessment import Quiz
    from app.infrastructure.models.user import User


class ExamSession(Base, TimestampMixin):
    __tablename__ = "exam_sessions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    quiz_id: Mapped[UUID] = mapped_column(ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    student_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    proctoring_mode: Mapped[str] = mapped_column(String(32), default="cv_basic", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    quiz: Mapped["Quiz"] = relationship(back_populates="exam_sessions")
    alerts: Mapped[list["CVAlert"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class CVAlert(Base, TimestampMixin):
    __tablename__ = "cv_alerts"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    exam_session_id: Mapped[UUID] = mapped_column(ForeignKey("exam_sessions.id", ondelete="CASCADE"), nullable=False)
    alert_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    session: Mapped["ExamSession"] = relationship(back_populates="alerts")
