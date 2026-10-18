from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from app.infrastructure.models.institution import School

from app.application.services.auth_service import AuthService
from app.deps import DbSession
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenPair

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenPair)
async def register(data: RegisterRequest, db: DbSession) -> TokenPair:
    service = AuthService(db)
    return await service.register(data)


@router.post("/login", response_model=TokenPair)
async def login(data: LoginRequest, db: DbSession) -> TokenPair:
    service = AuthService(db)
    return await service.login(data.email, data.password)


@router.post("/refresh", response_model=TokenPair)
async def refresh_token(data: RefreshRequest, db: DbSession) -> TokenPair:
    service = AuthService(db)
    return await service.refresh(data.refresh_token)


@router.get("/schools")
async def registration_schools(db: DbSession) -> list[dict[str, str]]:
    """Minimal public school directory for student onboarding."""
    result = await db.execute(select(School.id, School.name, School.slug).order_by(School.name).limit(100))
    return [{"id": str(s.id), "name": s.name, "slug": s.slug} for s in result.all()]


class LogoutRequest(BaseModel):
    refresh_token: str


@router.post("/logout", status_code=204)
async def logout(data: LogoutRequest, db: DbSession) -> None:
    await AuthService(db).logout(data.refresh_token)
