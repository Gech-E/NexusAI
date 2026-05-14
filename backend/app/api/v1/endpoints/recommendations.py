from fastapi import APIRouter

from app.deps import CurrentUser, DbSession
from app.application.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/me")
async def my_recommendations(db: DbSession, user: CurrentUser) -> list[dict]:
    service = RecommendationService(db)
    return await service.get_recommendations_for_user(user.id)


@router.post("/me/refresh")
async def refresh_recommendations(db: DbSession, user: CurrentUser) -> dict:
    service = RecommendationService(db)
    count = await service.generate_recommendations(user.id)
    return {"status": "generated", "count": count}
