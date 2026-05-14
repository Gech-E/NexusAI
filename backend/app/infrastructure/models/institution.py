from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.infrastructure.models.academic import Course
    from app.infrastructure.models.analytics import AnalyticsSnapshot
    from app.infrastructure.models.profile import StudentProfile, TeacherProfile


class School(Base, TimestampMixin):
    __tablename__ = "schools"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    country_code: Mapped[str | None] = mapped_column(String(2), nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), default="UTC", nullable=False)
    settings: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    billing_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    students: Mapped[list["StudentProfile"]] = relationship(back_populates="school")
    teachers: Mapped[list["TeacherProfile"]] = relationship(back_populates="school")
    courses: Mapped[list["Course"]] = relationship(back_populates="school")
    analytics: Mapped[list["AnalyticsSnapshot"]] = relationship(back_populates="school")
