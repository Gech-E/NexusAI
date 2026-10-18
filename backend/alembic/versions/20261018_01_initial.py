"""Initial NexusAI schema for NEW databases only.

Do not stamp an existing production database with this revision.
Existing data requires a separate verified baseline reconciliation.
"""
from alembic import op
from app.infrastructure.models.base import Base
import app.infrastructure.models  # noqa: F401

revision = "20261018_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = __import__("sqlalchemy").inspect(bind)
    existing = set(inspector.get_table_names()) - {"alembic_version"}
    if existing:
        raise RuntimeError("Initial migration requires an empty database; reconcile existing data separately")
    Base.metadata.create_all(bind=bind, checkfirst=False)


def downgrade():
    raise RuntimeError("Initial schema downgrade is intentionally disabled to protect student records")
