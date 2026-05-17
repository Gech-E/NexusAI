"""AI Tutor API — RAG-powered conversational tutoring with Gemini."""

from uuid import UUID
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.deps import CurrentUser, DbSession
from app.application.services.ai_tutor_service import AITutorService
from app.application.services.ai_analytics_service import AIAnalyticsService

router = APIRouter(prefix="/ai", tags=["ai"])


class TutorQuery(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    conversation_id: str | None = Field(default=None, description="Optional conversation ID to continue a specific thread")


class TopicRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=200)


class QuizGenRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=200)
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")
    count: int = Field(default=5, ge=1, le=10)


@router.post("/tutor/query")
async def tutor_query(payload: TutorQuery, db: DbSession, user: CurrentUser) -> dict:
    """Send a question to the AI Tutor and receive an intelligent RAG-powered response."""
    service = AITutorService(db=db)
    response = await service.get_tutor_response(
        payload.query,
        user_id=user.id,
        conversation_id=payload.conversation_id,
    )
    return {"response": response}


@router.get("/tutor/history")
async def tutor_history(db: DbSession, user: CurrentUser) -> list[dict]:
    """Retrieve the current user's recent AI Tutor conversation history."""
    service = AITutorService(db=db)
    return await service.get_conversation_history(user.id, limit=50)


@router.get("/tutor/conversations")
async def tutor_conversations(db: DbSession, user: CurrentUser) -> list[dict]:
    """List all of the user's AI Tutor conversation sessions."""
    service = AITutorService(db=db)
    return await service.list_conversations(user.id)


@router.delete("/tutor/history")
async def clear_history(db: DbSession, user: CurrentUser) -> dict:
    """Clear the user's AI conversation history."""
    from sqlalchemy import select
    from app.infrastructure.models.ai_data import AIConversation

    convs = await db.execute(
        select(AIConversation.id).where(AIConversation.user_id == user.id)
    )
    conv_ids = [row[0] for row in convs.all()]
    if conv_ids:
        for cid in conv_ids:
            conv = await db.get(AIConversation, cid)
            if conv:
                await db.delete(conv)
        await db.commit()

    return {"status": "cleared", "deleted_conversations": len(conv_ids)}


# ── New AI-Powered Endpoints ────────────────────────────


@router.get("/tutor/study-plan")
async def study_plan(db: DbSession, user: CurrentUser) -> dict:
    """Generate a personalized AI study plan based on the student's performance."""
    service = AIAnalyticsService(db)
    return await service.generate_study_plan(user.id)


@router.post("/tutor/explain-topic")
async def explain_topic(payload: TopicRequest, db: DbSession, user: CurrentUser) -> dict:
    """Get a deep-dive AI explanation of any topic, adjusted to student level."""
    service = AIAnalyticsService(db)
    return await service.explain_topic(payload.topic, user_id=user.id)


@router.post("/tutor/quiz-me")
async def quiz_me(payload: QuizGenRequest, db: DbSession, user: CurrentUser) -> dict:
    """Generate practice quiz questions on any topic using AI."""
    service = AIAnalyticsService(db)
    questions = await service.generate_quiz_questions(
        payload.topic, payload.difficulty, payload.count
    )
    return {"topic": payload.topic, "difficulty": payload.difficulty, "questions": questions}


@router.get("/stats")
async def ai_stats(db: DbSession, user: CurrentUser) -> dict:
    """Get live AI system usage statistics (admin)."""
    service = AIAnalyticsService(db)
    return await service.get_ai_system_stats()


@router.get("/teacher/narrative")
async def teacher_narrative(db: DbSession, user: CurrentUser) -> dict:
    """Generate AI-powered narrative analytics for teachers."""
    service = AIAnalyticsService(db)
    return await service.generate_teacher_narrative()
