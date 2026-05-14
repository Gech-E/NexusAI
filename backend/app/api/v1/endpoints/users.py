from fastapi import APIRouter

from app.deps import CurrentUser
from app.schemas.auth import UserPublic

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
async def read_me(user: CurrentUser) -> UserPublic:
    roles = [r.role.value for r in user.roles]
    return UserPublic(id=user.id, email=user.email, full_name=user.full_name, roles=roles)
