from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text, UUID as SA_UUID, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

JSONDict = dict[str, Any]


class Base(DeclarativeBase):
    type_annotation_map = {
        dict[str, Any]: JSON,
    }


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


def new_uuid() -> UUID:
    return uuid4()
