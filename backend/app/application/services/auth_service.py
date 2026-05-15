from datetime import UTC, datetime, timedelta
from uuid import uuid4

import hashlib
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token_safe,
    hash_password,
    verify_password,
)
from app.infrastructure.models.institution import School
from app.infrastructure.models.profile import StudentProfile
from app.infrastructure.models.user import RefreshToken, User, UserRole, UserRoleAssignment
from app.schemas.auth import RegisterRequest, TokenPair


def _hash_refresh(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def register(self, data: RegisterRequest) -> TokenPair:
        existing = await self.session.execute(select(User).where(User.email == data.email))
        if existing.scalar_one_or_none():
            from fastapi import HTTPException, status

            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
        )
        self.session.add(user)
        await self.session.flush()

        # Assign the requested role, default to STUDENT
        role_map = {"teacher": UserRole.TEACHER, "admin": UserRole.ADMIN}
        assigned_role = role_map.get(data.role, UserRole.STUDENT) if data.role else UserRole.STUDENT
        self.session.add(UserRoleAssignment(user_id=user.id, role=assigned_role))

        if data.school_slug:
            res = await self.session.execute(select(School).where(School.slug == data.school_slug))
            school = res.scalar_one_or_none()
            if school:
                self.session.add(
                    StudentProfile(user_id=user.id, school_id=school.id, metadata_={}),
                )

        await self.session.commit()
        await self.session.refresh(user)
        return await self._issue_tokens(user)

    async def login(self, email: str, password: str) -> TokenPair:
        from fastapi import HTTPException, status

        result = await self.session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user is None or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User disabled")
        return await self._issue_tokens(user)

    async def refresh(self, refresh_token: str) -> TokenPair:
        from fastapi import HTTPException, status

        payload = decode_token_safe(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        jti = payload.get("jti")
        sub = payload.get("sub")
        if not jti or not sub:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed refresh token")

        token_hash = _hash_refresh(refresh_token)
        res = await self.session.execute(
            select(RefreshToken).where(RefreshToken.jti == str(jti), RefreshToken.revoked_at.is_(None))
        )
        row = res.scalar_one_or_none()
        if row is None or row.token_hash != token_hash:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked or unknown")
        if row.expires_at < datetime.now(tz=UTC):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

        user_res = await self.session.execute(select(User).where(User.id == row.user_id))
        user = user_res.scalar_one_or_none()
        if user is None or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User invalid")

        row.revoked_at = datetime.now(tz=UTC)
        await self.session.flush()
        return await self._issue_tokens(user)

    async def _issue_tokens(self, user: User) -> TokenPair:
        role_rows = await self.session.execute(select(UserRoleAssignment).where(UserRoleAssignment.user_id == user.id))
        roles = [r.role.value for r in role_rows.scalars().all()]
        access = create_access_token(user.id, claims={"roles": roles})
        jti = str(uuid4())
        raw_refresh = create_refresh_token(user.id, jti=jti)
        from app.core.config import settings

        expires_at = datetime.now(tz=UTC) + timedelta(days=settings.refresh_token_expire_days)

        self.session.add(
            RefreshToken(
                user_id=user.id,
                jti=jti,
                token_hash=_hash_refresh(raw_refresh),
                expires_at=expires_at,
            )
        )
        await self.session.commit()
        return TokenPair(access_token=access, refresh_token=raw_refresh)
