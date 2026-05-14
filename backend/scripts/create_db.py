import asyncio
import asyncpg
from urllib.parse import urlparse

async def create_db():
    # Connection string for the postgres superuser database
    # We use this to create our actual application database
    db_url = "DATABASE_URL"
    
    conn = await asyncpg.connect(db_url)
    try:
        # Check if database exists
        exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = 'nexus_learnai'")
        if not exists:
            # We must use a separate connection to run CREATE DATABASE because it cannot run in a transaction
            await conn.execute("CREATE DATABASE nexus_learnai")
            print("Successfully created database: nexus_learnai")
        else:
            print("Database nexus_learnai already exists.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_db())
