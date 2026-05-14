from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.infrastructure.models.institution import School
    from app.infrastructure.models.user import User


class StudentProfile(Base, TimestampMixin):
    __tablename__ = "students"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    school_id: Mapped[UUID] = mapped_column(ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    grade_level: Mapped[str | None] = mapped_column(String(32), nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    metadata_: Mapped[dict[str, Any]] = mapped_column("metadata", JSON, default=dict, nullable=False)

    user: Mapped["User"] = relationship(back_populates="student_profile")
    school: Mapped["School"] = relationship(back_populates="students")


class TeacherProfile(Base, TimestampMixin):
    __tablename__ = "teachers"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    school_id: Mapped[UUID] = mapped_column(ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    department: Mapped[str | None] = mapped_column(String(128), nullable=True)
    title: Mapped[str | None] = mapped_column(String(128), nullable=True)
    metadata_: Mapped[dict[str, Any]] = mapped_column("metadata", JSON, default=dict, nullable=False)

    user: Mapped["User"] = relationship(back_populates="teacher_profile")
    school: Mapped["School"] = relationship(back_populates="teachers")
