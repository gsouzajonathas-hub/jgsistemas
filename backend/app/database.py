from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import load_env  # noqa: F401  (carrega .env antes de ler variáveis)

load_env()
import os

DATABASE_URL = os.getenv("DATABASE_URL", "")

if DATABASE_URL and "postgresql" in DATABASE_URL:
    async_url = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
elif DATABASE_URL.startswith("sqlite"):
    path = DATABASE_URL[len("sqlite:///"):]
    async_url = f"sqlite+aiosqlite:///{path}"
else:
    from app.utils.paths import get_data_dir
    db_path = os.path.join(get_data_dir(), "escola.db")
    async_url = f"sqlite+aiosqlite:///{db_path}"

if "postgresql" in async_url:
    engine = create_async_engine(async_url, echo=False, pool_size=10, max_overflow=20, pool_recycle=3600)
else:
    engine = create_async_engine(async_url, echo=False, connect_args={"check_same_thread": False})
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
