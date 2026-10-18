"""Centralized institution-level access policy for learning resources."""
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models.profile import StudentProfile, TeacherProfile
from app.infrastructure.models.user import User, UserRole


def is_platform_admin(user: User) -> bool:
    return any(role.role == UserRole.ADMIN for role in user.roles)


async def user_school_ids(db: AsyncSession, user: User) -> set[UUID]:
    if is_platform_admin(user):
        # Admin access is treated separately to avoid loading all school IDs.
        return set()
    students = await db.scalars(select(StudentProfile.school_id).where(StudentProfile.user_id == user.id))
    teachers = await db.scalars(select(TeacherProfile.school_id).where(TeacherProfile.user_id == user.id))
    return set(students.all()) | set(teachers.all())


async def require_school(db: AsyncSession, user: User, school_id: UUID) -> None:
    if is_platform_admin(user):
        return
    if school_id not in await user_school_ids(db, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this institution",
        )
