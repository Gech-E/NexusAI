from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.infrastructure.models.user import User


class AIConversation(Base, TimestampMixin):
    __tablename__ = "ai_conversations"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    context_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    rag_namespace: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)

    messages: Mapped[list["AIMessage"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan"
    )


class AIMessage(Base, TimestampMixin):
    __tablename__ = "ai_messages"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    conversation_id: Mapped[UUID] = mapped_column(ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    metadata_: Mapped[dict[str, Any]] = mapped_column("metadata", JSON, default=dict, nullable=False)

    conversation: Mapped["AIConversation"] = relationship(back_populates="messages")


class Recommendation(Base, TimestampMixin):
    __tablename__ = "recommendations"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=new_uuid)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(64), default="lesson", nullable=False)
    resource_id: Mapped[UUID | None] = mapped_column(nullable=True)
    title: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    reason: Mapped[str] = mapped_column(String(512), default="", nullable=False)
    relevance_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
