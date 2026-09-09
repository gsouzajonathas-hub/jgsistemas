import json
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import text, inspect
from sqlalchemy.ext.asyncio import AsyncSession


def _to_jsonable(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, (Decimal, UUID)):
        return str(obj)
    if isinstance(obj, bytes):
        return obj.decode("utf-8", errors="replace")
    return obj


async def export_database(db: AsyncSession) -> dict:
    """Serializa todas as tabelas do banco para um dicionário JSON (backup portátil)."""

    # inspect() não funciona na Session nem no AsyncEngine. Precisamos da connection:
    # conn.run_sync passa a conexão sync para o callable, onde inspect() funciona.
    async with db.bind.connect() as conn:
        tables = await conn.run_sync(
            lambda sync_conn: inspect(sync_conn).get_table_names()
        )

    result = {}
    for table in sorted(tables):
        if table == "users":
            rows = (await db.execute(text(f'SELECT * FROM "{table}"'))).all()
            if not rows:
                result[table] = []
                continue
            columns = [c for c in rows[0]._mapping.keys() if c != "password_hash"]
            result[table] = [
                {col: _to_jsonable(row._mapping[col]) for col in columns}
                for row in rows
            ]
        else:
            rows = (await db.execute(text(f'SELECT * FROM "{table}"'))).all()
            if not rows:
                result[table] = []
                continue
            columns = list(rows[0]._mapping.keys())
            result[table] = [
                {col: _to_jsonable(row._mapping[col]) for col in columns}
                for row in rows
            ]
    return result


def _fallback(obj):
    # Última rede de segurança: converte qualquer objeto não serializável.
    return str(obj)


def build_pretty_json(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2, default=_fallback)
