import asyncio
from logging.config import fileConfig

from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncEngine

from alembic import context

# Reusa a MESMA engine (e a mesma lógica de resolução de DATABASE_URL/PG*/
# fallback SQLite) que o app já usa em app/database.py — é a fonte única de
# verdade da conexão, tanto para a app quanto para as migrações.
from app.database import engine as app_engine, Base
import app.models  # noqa: F401  (popula Base.metadata com todas as tabelas)

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    context.configure(
        url=app_engine.url.render_as_string(hide_password=False),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    # render_as_batch: obrigatório para autogenerate/ALTER funcionarem no
    # SQLite (usado em dev local), que não suporta ALTER TABLE nativo para a
    # maioria das operações — o Alembic recria a tabela em modo batch. É um
    # no-op inofensivo no Postgres (produção).
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Usa a mesma engine assíncrona da aplicação (app/database.py) em vez de
    montar uma nova a partir do alembic.ini — evita duplicar a lógica de
    resolução de DATABASE_URL/PG*/fallback SQLite."""

    connectable: AsyncEngine = app_engine

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
