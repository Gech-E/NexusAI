from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserPublic(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool

    model_config = {"from_attributes": True}
