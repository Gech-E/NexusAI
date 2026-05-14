from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    ai_tutor,
    analytics,
    auth,
    courses,
    health,
    quizzes,
    recommendations,
    sync,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(quizzes.router)
api_router.include_router(courses.router)
api_router.include_router(recommendations.router)
api_router.include_router(ai_tutor.router)
api_router.include_router(analytics.router)
api_router.include_router(admin.router)
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
