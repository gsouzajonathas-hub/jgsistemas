from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.engine import URL
from app.config import load_env  # noqa: F401  (carrega .env antes de ler variáveis)

load_env()
import os

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()

# Conexão por variáveis separadas (PG*): recomendada para senhas com caracteres
# especiais (ex.: Supabase com `/ ^ *`), que quebram o parsing de uma connection
# string `postgresql://user:senha@host/db`. O `URL.create` mantém a senha crua,
# sem re-parse, então asyncpg a recebe literalmente via kwarg `password`.
PG_HOST = os.getenv("PGHOST", "").strip()
PG_PASSWORD = os.getenv("PGPASSWORD", "").strip()
_has_pg_block = bool(PG_HOST and PG_PASSWORD)

_is_postgres = DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")
_is_sqlite = DATABASE_URL.startswith("sqlite://")

# Um DATABASE_URL explícito (ex.: teste com SQLite, deploy com connection string)
# tem precedência sobre o bloco PG*. O bloco PG* só é usado quando não há
# DATABASE_URL definido — mantém o comportamento de produção no Render.
if _has_pg_block and not DATABASE_URL:
    # Usa o bloco PG* (robusto para senhas especiais).
    try:
        _pg_port = int(os.getenv("PGPORT", "5432").strip())
    except ValueError:
        import logging
        logging.getLogger(__name__).warning("PGPORT inválido, usando 5432")
        _pg_port = 5432
    _pg_url = URL.create(
        drivername="postgresql+asyncpg",
        username=os.getenv("PGUSER", "postgres").strip(),
        password=PG_PASSWORD,
        host=PG_HOST,
        port=_pg_port,
        database=(os.getenv("PGDATABASE", "postgres").strip() or "postgres"),
    )
    async_url = _pg_url
    _is_asyncpg = True
elif _is_postgres:
    # Supabase fornece tanto `postgresql://` quanto `postgres://`; normaliza ambos.
    async_url = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    async_url = async_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    _is_asyncpg = True
elif _is_sqlite:
    path = DATABASE_URL[len("sqlite:///"):]
    async_url = f"sqlite+aiosqlite:///{path}"
    _is_asyncpg = False
else:
    # Sem conexão externa: usa SQLite local SOMENTE em dev/testes.
    # Em produção, cair para SQLite no filesystem efêmero (Render) significaria
    # perda de dados no redeploy — falha rápido em vez de degradar silenciosamente.
    if ENVIRONMENT == "production":
        raise RuntimeError(
            "Conexão de banco ausente/inválida em produção. Configure DATABASE_URL "
            "(Postgres) ou o bloco PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE no Render, "
            "ex.: PGHOST=aws-0-us-west-2.pooler.supabase.com PGPORT=5432 PGUSER=postgres.<ref>"
        )
    from app.utils.paths import get_data_dir
    db_path = os.path.join(get_data_dir(), "escola.db")
    async_url = f"sqlite+aiosqlite:///{db_path}"
    _is_asyncpg = False

if _is_asyncpg:
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
