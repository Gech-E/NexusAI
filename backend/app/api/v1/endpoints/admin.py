from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select, func

from app.deps import CurrentUser, DbSession, require_roles
from app.infrastructure.models.user import User, UserRole, UserRoleAssignment
from app.infrastructure.models.institution import School
from app.infrastructure.models.assessment import Quiz, QuizAttempt
from app.infrastructure.models.analytics import AnalyticsEvent

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get(
    "/stats",
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
async def admin_stats(db: DbSession) -> dict:
    users_count = await db.execute(select(func.count(User.id)))
    schools_count = await db.execute(select(func.count(School.id)))
    quizzes_count = await db.execute(select(func.count(Quiz.id)))
    attempts_count = await db.execute(select(func.count(QuizAttempt.id)))

    role_counts = {}
    for role in UserRole:
        count_q = await db.execute(
            select(func.count(UserRoleAssignment.id)).where(
                UserRoleAssignment.role == role
            )
        )
        role_counts[role.value] = count_q.scalar() or 0

    return {
        "total_users": users_count.scalar() or 0,
        "total_institutions": schools_count.scalar() or 0,
        "total_quizzes": quizzes_count.scalar() or 0,
        "total_attempts": attempts_count.scalar() or 0,
        "users_by_role": role_counts,
        "system_health": {
            "api": "healthy",
            "database": "connected",
            "ai_engine": "standby",
            "cv_module": "standby",
        },
    }


@router.get(
    "/users",
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
async def list_users(
    db: DbSession,
    skip: int = 0,
    limit: int = 50,
) -> list[dict]:
    result = await db.execute(
        select(User)
        .options()
        .offset(skip)
        .limit(limit)
        .order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]
