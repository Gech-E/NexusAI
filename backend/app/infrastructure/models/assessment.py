from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.infrastructure.models.academic import Course
    from app.infrastructure.models.exam import ExamSession
    from app.infrastructure.models.institution import School
    from app.infrastructure.models.user import User


class Quiz(Base, TimestampMixin):
    __tablename__ = "quizzes"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    school_id: Mapped[UUID] = mapped_column(ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[UUID | None] = mapped_column(ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    created_by_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    adaptive_policy: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    school: Mapped["School"] = relationship()
    course: Mapped["Course | None"] = relationship(back_populates="quizzes")
    questions: Mapped[list["Question"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")
    attempts: Mapped[list["QuizAttempt"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")
    exam_sessions: Mapped[list["ExamSession"]] = relationship(back_populates="quiz")


class Question(Base, TimestampMixin):
    __tablename__ = "questions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    quiz_id: Mapped[UUID] = mapped_column(ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    choices: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    correct_index: Mapped[int] = mapped_column(Integer, nullable=False)
    difficulty: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    topic_tags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    quiz: Mapped["Quiz"] = relationship(back_populates="questions")


class QuizAttempt(Base, TimestampMixin):
    __tablename__ = "quiz_attempts"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    quiz_id: Mapped[UUID] = mapped_column(ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    student_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    answers: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    quiz: Mapped["Quiz"] = relationship(back_populates="attempts")
    result: Mapped["QuizResult | None"] = relationship(back_populates="attempt", uselist=False)


class QuizResult(Base, TimestampMixin):
    __tablename__ = "quiz_results"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    attempt_id: Mapped[UUID] = mapped_column(ForeignKey("quiz_attempts.id", ondelete="CASCADE"), unique=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    skill_estimate: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    feedback: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    attempt: Mapped["QuizAttempt"] = relationship(back_populates="result")
