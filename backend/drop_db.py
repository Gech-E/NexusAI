import asyncio
from app.infrastructure.database import engine
from app.infrastructure.models.base import Base
import app.infrastructure.models

async def run():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

asyncio.run(run())
