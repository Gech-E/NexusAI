"""Provision the initial platform admin from the server shell (not from public signup).

Usage: cd backend && python -m scripts.bootstrap_admin
"""
import asyncio
import getpass
import os

from sqlalchemy import select

from app.core.security import hash_password
from app.infrastructure.database import AsyncSessionLocal, init_db
from app.infrastructure.models.user import User, UserRole, UserRoleAssignment


async def main() -> None:
    if os.getenv("APP_ENV", "development") == "development":
        print("Warning: bootstrapping in a development environment.")
    email = input("Admin email: ").strip().lower()
    name = input("Admin name: ").strip()
    password = getpass.getpass("New password (min 12 characters): ")
    if "@" not in email or len(name) < 2 or len(password) < 12:
        raise SystemExit("Invalid email, name, or password length.")
    confirm = getpass.getpass("Confirm password: ")
    if password != confirm:
        raise SystemExit("Passwords do not match")
    if os.getenv("APP_ENV", "development") == "development":
        await init_db()

    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
        if existing:
            raise SystemExit("Account already exists. Use the authenticated admin management workflow.")
        user = User(email=email, full_name=name, hashed_password=hash_password(password), is_active=True)
        db.add(user)
        await db.flush()
        db.add(UserRoleAssignment(user_id=user.id, role=UserRole.ADMIN))
        await db.commit()
        print("Admin account created. Rotate the password and configure MFA at the identity layer.")


if __name__ == "__main__":
    asyncio.run(main())
