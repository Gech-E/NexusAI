from fastapi import APIRouter, Depends

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
