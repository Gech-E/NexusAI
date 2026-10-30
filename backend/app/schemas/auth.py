from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    school_slug: str = Field(min_length=2, max_length=120, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", description="Code of a school with open student registration")
    role: str | None = Field(default=None, description="Requested role: student, teacher, admin")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    roles: list[str]

    model_config = {"from_attributes": True}
