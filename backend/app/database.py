from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import load_env  # noqa: F401  (carrega .env antes de ler variáveis)

load_env()
import os

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()

_is_postgres = DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")
_is_sqlite = DATABASE_URL.startswith("sqlite://")

if _is_postgres:
    # Supabase fornece tanto `postgresql://` quanto `postgres://`; normaliza ambos.
    async_url = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    async_url = async_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _is_sqlite:
    path = DATABASE_URL[len("sqlite:///"):]
    async_url = f"sqlite+aiosqlite:///{path}"
else:
    # Sem DATABASE_URL externa: usa SQLite local SOMENTE em dev/testes.
    # Em produção, cair para SQLite no filesystem efêmero (Render) significaria
    # perda de dados no redeploy — falha rápido em vez de degradar silenciosamente.
    if ENVIRONMENT == "production":
        raise RuntimeError(
            "DATABASE_URL ausente ou inválida em produção. Configure a connection string "
            "PostgreSQL (Supabase) no Render, ex.: postgresql://postgres.<ref>:<pass>@..."
        )
    from app.utils.paths import get_data_dir
    db_path = os.path.join(get_data_dir(), "escola.db")
    async_url = f"sqlite+aiosqlite:///{db_path}"

if "postgresql+asyncpg" in async_url:
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
