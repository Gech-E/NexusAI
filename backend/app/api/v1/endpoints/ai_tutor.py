"""AI Tutor API endpoint with conversation history and streaming support."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.deps import CurrentUser, DbSession
from app.application.services.ai_tutor_service import AITutorService

router = APIRouter(prefix="/ai", tags=["ai"])


class TutorQuery(BaseModel):
    query: str = Field(min_length=1, max_length=2000)


@router.post("/tutor/query")
async def tutor_query(payload: TutorQuery, db: DbSession, user: CurrentUser) -> dict:
    """Send a question to the AI Tutor and receive an intelligent response."""
    service = AITutorService(db=db)
    response = await service.get_tutor_response(payload.query, user_id=user.id)
    return {"response": response}


@router.get("/tutor/history")
async def tutor_history(db: DbSession, user: CurrentUser) -> list[dict]:
    """Retrieve the current user's recent AI Tutor conversation history."""
    service = AITutorService(db=db)
    return await service.get_conversation_history(user.id, limit=50)


@router.delete("/tutor/history")
async def clear_history(db: DbSession, user: CurrentUser) -> dict:
    """Clear the user's AI conversation history."""
    from sqlalchemy import select, delete
    from app.infrastructure.models.ai_data import AIConversation

    # Delete all conversations for this user
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
