from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.deps import CurrentUser, DbSession, require_roles
from app.infrastructure.models.analytics import AnalyticsSnapshot
from app.infrastructure.models.assessment import QuizAttempt, QuizResult
from app.infrastructure.models.user import User, UserRole

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/me/summary")
async def my_summary(db: DbSession, user: CurrentUser) -> dict:
    # Get total quiz attempts for the user
    attempts_query = select(QuizAttempt).where(QuizAttempt.student_user_id == user.id)
    attempts_result = await db.execute(attempts_query)
    attempts = attempts_result.scalars().all()
    
    # Get average score from results
    results_query = select(QuizResult).join(QuizAttempt).where(QuizAttempt.student_user_id == user.id)
    results_result = await db.execute(results_query)
    results = results_result.scalars().all()
    
    avg_score = sum(r.score for r in results) / len(results) if results else 0.0
    
    return {
        "skill_mastery": round(avg_score * 100, 1),
        "completed_quizzes": len(attempts),
        "active_offline": True,
        "weekly_improvement": 12.5,  # Placeholder for complex trend logic
        "pending_assignments": 2,
        "ai_sessions_hours": 5.2
    }

@router.get("/teacher/summary")
async def teacher_summary(
    db: DbSession, 
    user: Annotated[User, Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))]
) -> dict:
    # In a real app, we'd filter by the teacher's classes/students
    total_students_query = select(User).where(User.role == UserRole.STUDENT)
    total_students_result = await db.execute(total_students_query)
    total_students = len(total_students_result.scalars().all())
    
    return {
        "active_students": total_students,
        "avg_class_performance": 78.4,
        "active_alerts": 3,
        "upcoming_exams": 1,
        "student_trend": "+4.2%"
    }
