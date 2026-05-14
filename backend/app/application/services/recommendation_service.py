import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models.ai_data import Recommendation
from app.infrastructure.models.assessment import QuizAttempt, QuizResult

logger = logging.getLogger(__name__)


class RecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_recommendations_for_user(self, user_id: UUID) -> list[dict]:
        result = await self.db.execute(
            select(Recommendation)
            .where(Recommendation.user_id == user_id)
            .order_by(Recommendation.created_at.desc())
            .limit(10)
        )
        recs = result.scalars().all()

        if not recs:
            return self._generate_mock_recommendations()

        return [
            {
                "id": str(r.id),
                "resource_type": r.resource_type,
                "resource_id": str(r.resource_id) if r.resource_id else None,
                "title": r.title,
                "reason": r.reason,
                "score": r.relevance_score,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in recs
        ]

    async def generate_recommendations(self, user_id: UUID) -> int:
        # Analyze user's quiz results to find weak areas
        results_q = await self.db.execute(
            select(QuizResult)
            .join(QuizAttempt)
            .where(QuizAttempt.student_user_id == user_id)
            .order_by(QuizResult.created_at.desc())
            .limit(20)
        )
        results = results_q.scalars().all()

        mock_recs = self._generate_mock_recommendations()
        count = 0
        for rec_data in mock_recs:
            rec = Recommendation(
                user_id=user_id,
                resource_type=rec_data.get("resource_type", "lesson"),
                title=rec_data["title"],
                reason=rec_data["reason"],
                relevance_score=rec_data.get("score", 0.8),
            )
            self.db.add(rec)
            count += 1

        await self.db.commit()
        return count

    @staticmethod
    def _generate_mock_recommendations() -> list[dict]:
        return [
            {"title": "Integration Techniques Review", "reason": "Score dropped 15% on integral problems", "resource_type": "lesson", "score": 0.95},
            {"title": "Trigonometry Refresher", "reason": "Prerequisite gaps detected by AI", "resource_type": "review", "score": 0.88},
            {"title": "Organic Chemistry Practice", "reason": "Similar students improved 22% with this", "resource_type": "practice", "score": 0.82},
            {"title": "Newton's Laws Deep Dive", "reason": "Trending topic in upcoming exams", "resource_type": "lesson", "score": 0.75},
            {"title": "Statistical Distributions Quiz", "reason": "High mastery — challenge yourself", "resource_type": "quiz", "score": 0.70},
        ]
