import json
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.deps import CurrentUser

router = APIRouter(prefix="/ai", tags=["ai"])


from pydantic import BaseModel
from app.application.services.ai_tutor_service import AITutorService

class TutorQuery(BaseModel):
    query: str

@router.post("/tutor/query")
async def tutor_query(payload: TutorQuery, user: CurrentUser) -> dict:
    service = AITutorService()
    response = await service.get_tutor_response(payload.query, user_id=user.id)
    return {"response": response}
