from fastapi import APIRouter

from app.deps import CurrentUser, DbSession
from app.core.permissions import user_school_ids, is_platform_admin
from app.infrastructure.models.institution import School
from sqlalchemy import select
from app.schemas.auth import UserPublic

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
async def read_me(user: CurrentUser) -> UserPublic:
    roles = [r.role.value for r in user.roles]
    return UserPublic(id=user.id, email=user.email, full_name=user.full_name, roles=roles)


@router.get("/me/schools")
async def my_schools(db: DbSession, user: CurrentUser) -> list[dict[str, str]]:
    query = select(School.id, School.name)
    if not is_platform_admin(user):
        query = query.where(School.id.in_(await user_school_ids(db, user)))
    result = await db.execute(query.order_by(School.name).limit(100))
    return [{"id": str(row.id), "name": row.name} for row in result.all()]
