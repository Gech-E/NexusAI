from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import Float, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.infrastructure.models.assessment import Quiz
    from app.infrastructure.models.institution import School
    from app.infrastructure.models.user import User


class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    school_id: Mapped[UUID] = mapped_column(ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    teacher_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(128), default="General", nullable=False)
    code: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    description: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    syllabus: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    school: Mapped["School"] = relationship(back_populates="courses")
    teacher: Mapped["User | None"] = relationship()
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    quizzes: Mapped[list["Quiz"]] = relationship(back_populates="course")


class Enrollment(Base, TimestampMixin):
    __tablename__ = "enrollments"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    student_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    progress_pct: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    course: Mapped["Course"] = relationship(back_populates="enrollments")
