"""Async Celery tasks for Nexus LearnAI."""

import logging
from app.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="generate_recommendations_task", bind=True, max_retries=3)
def generate_recommendations_task(self, user_id: str):
    """Async task: regenerate AI recommendations for a student."""
    import asyncio
    from app.infrastructure.database import async_session_factory
    from app.application.services.recommendation_service import RecommendationService
    from uuid import UUID

    async def _run():
        async with async_session_factory() as db:
            service = RecommendationService(db)
            count = await service.generate_recommendations(UUID(user_id))
            logger.info(f"Generated {count} recommendations for user {user_id}")
            return count

    try:
        return asyncio.run(_run())
    except Exception as exc:
        logger.error(f"Recommendation task failed: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="analytics_snapshot_task")
def analytics_snapshot_task():
    """Periodic task: capture platform analytics snapshot."""
    import asyncio
    from app.infrastructure.database import async_session_factory
    from sqlalchemy import select, func
    from app.infrastructure.models.assessment import QuizResult, QuizAttempt
    from app.infrastructure.models.user import UserRoleAssignment, UserRole
    from app.infrastructure.models.analytics import AnalyticsSnapshot

    async def _run():
        async with async_session_factory() as db:
            avg_q = await db.execute(select(func.avg(QuizResult.score)))
            avg_score = float(avg_q.scalar() or 0)

            student_q = await db.execute(
                select(func.count(UserRoleAssignment.id)).where(
                    UserRoleAssignment.role == UserRole.STUDENT
                )
            )
            total_students = student_q.scalar() or 0

            snapshot = AnalyticsSnapshot(
                metric_name="daily_summary",
                metric_value=round(avg_score * 100, 1),
                dimension="platform",
                tags={"total_students": total_students},
            )
            db.add(snapshot)
            await db.commit()
            logger.info(f"Analytics snapshot: avg={avg_score*100:.1f}%, students={total_students}")

    try:
        asyncio.run(_run())
    except Exception as e:
        logger.error(f"Analytics snapshot failed: {e}")


@celery_app.task(name="sync_reconciliation_task")
def sync_reconciliation_task():
    """Periodic task: reconcile pending offline sync records."""
    import asyncio
    from app.infrastructure.database import async_session_factory
    from sqlalchemy import select, func
    from app.infrastructure.models.sync import OfflineSyncLog

    async def _run():
        async with async_session_factory() as db:
            pending_q = await db.execute(
                select(func.count(OfflineSyncLog.id)).where(
                    OfflineSyncLog.status == "pending"
                )
            )
            pending = pending_q.scalar() or 0
            logger.info(f"Sync reconciliation: {pending} pending records")

    try:
        asyncio.run(_run())
    except Exception as e:
        logger.error(f"Sync reconciliation failed: {e}")
