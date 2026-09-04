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

    # db.run_sync passa a Session; inspect() numa Session não oferece get_table_names().
    # Para listar tabelas e ler linhas usamos o engine (db.bind) e executamos o SELECT
    # de forma assíncrona pela própria session (que já usa o bind correto).
    def _table_names(sync_session):
        return inspect(db.bind).get_table_names()

    tables = await db.run_sync(_table_names)
    result = {}
    for table in sorted(tables):
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
