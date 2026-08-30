"""Migra os dados de um banco SQLite (escola.db) para um Postgres (ex.: Supabase).

Uso:
    python -m scripts.migrate_sqlite_to_postgres --sqlite backend/escola.db --pg "postgresql://..."  [--tables T1,T2] [--dry-run]

Funcionamento:
1. Importa os modelos SQLAlchemy e roda Base.metadata.create_all no Postgres
   (schema idêntico ao do app -- portanto NÃO depende de o app já ter sido iniciado).
2. Copia as tabelas com modelo na ordem correta de dependência (FK),
   preservando os IDs originais.
3. Converte valores boolean (SQLite usa 0/1) para o tipo boolean do Postgres.
4. Atualiza as sequences (setval) para não colidir com INSERTs futuros.
"""
import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine   # noqa: E402
from sqlalchemy import text                              # noqa: E402
from app.database import Base                            # noqa: E402
import app.models.user                                   # noqa: F401  (registra modelos em Base.metadata)
import app.models.school
import app.models.student
import app.models.teacher
import app.models.course
import app.models.class_group
import app.models.enrollment
import app.models.financial
import app.models.schedule
import app.models.communication
import app.models.settings
import app.models.file_upload
import app.models.audit_log
import app.models.materials
import app.models.attendance
import app.models.evaluation
import app.models.certificate
import app.models.weight_config

TABELAS_COM_MODELO = [
    "users",
    "schools",
    "school_settings",
    "courses",
    "teachers",
    "class_groups",
    "students",
    "responsibles",
    "enrollments",
    "financial_plans",
    "financial_contracts",
    "carnets",
    "installments",
    "payments",
    "discounts",
    "teaching_materials",
    "material_sales",
    "calendar_events",
    "communication_logs",
    "file_uploads",
    "audit_logs",
    "attendances",
    "evaluations",
    "certificates",
    "grade_weight_configs",
]

TABELAS_ORFAS: list = []


def _colunas_sq(sq, tabela: str) -> list:
    cur = sq.execute(f'PRAGMA table_info("{tabela}")')
    return [row[1] for row in cur.fetchall()]


async def _colunas_pg(conn, tabela: str) -> dict:
    """Retorna {coluna: data_type} a partir do information_schema."""
    res = await conn.execute(
        text(
            "SELECT column_name, data_type FROM information_schema.columns "
            "WHERE table_name = :t"
        ),
        {"t": tabela},
    )
    rows = await res.fetchall()
    return {r[0]: r[1] for r in rows}


async def _setval(conn, tabela: str, max_id):
    try:
        await conn.execute(
            text(f"SELECT setval(pg_get_serial_sequence('{tabela}', 'id'), :v, true)"),
            {"v": int(max_id)},
        )
    except Exception as e:
        print(f"      [setval] {tabela}: {e}")


def _converter(valor, pg_type: str):
    if valor is None:
        return None
    if pg_type == "boolean":
        return bool(valor)
    return valor


async def migrar(args):
    import sqlite3

    sqlite_path = Path(args.sqlite)
    if not sqlite_path.exists():
        raise SystemExit(f"SQLite nao encontrado: {sqlite_path}")

    pg_url = args.pg.replace("postgres://", "postgresql+asyncpg://").replace("postgresql://", "postgresql+asyncpg://")
    pg = create_async_engine(pg_url, echo=False)

    sq = sqlite3.connect(str(sqlite_path))
    sq.row_factory = sqlite3.Row

    tabelas = [t.strip() for t in args.tables.split(",") if t.strip()] if args.tables else []
    tabelas_ord = [t for t in TABELAS_COM_MODELO if (not tabelas) or t in tabelas]

    print(f"Migrando {len(tabelas_ord)} tabelas de {sqlite_path} -> Postgres")
    if TABELAS_ORFAS:
        print(f"(orfas NAO migradas: {', '.join(TABELAS_ORFAS)})\n")

    async with pg.begin() as conn:
        if not args.dry_run:
            print("Criando schema (Base.metadata.create_all)...")
            await conn.run_sync(Base.metadata.create_all)

        total = 0
        for tabela in tabelas_ord:
            if args.dry_run:
                n = sq.execute(f'SELECT COUNT(*) FROM "{tabela}"').fetchone()[0]
                print(f"  [dry-run] {tabela}: {n} linhas (nao copiadas)")
                continue

            pg_types = await _colunas_pg(conn, tabela)
            sq_cols = _colunas_sq(sq, tabela)
            comuns = [c for c in sq_cols if c in pg_types]
            if not comuns:
                print(f"  ! {tabela}: sem colunas em comum, pulando")
                continue

            col_lista = ", ".join(f'"{c}"' for c in comuns)
            placeholders = ", ".join(f":{c}" for c in comuns)

            rows = sq.execute(f'SELECT {", ".join(sq_cols)} FROM "{tabela}"').fetchall()
            dados = []
            for r in rows:
                dados.append({c: _converter(r[c], pg_types[c]) for c in comuns})

            if not dados:
                print(f"  {tabela}: 0 linhas")
                continue

            await conn.execute(text(f'TRUNCATE TABLE "{tabela}" RESTART IDENTITY CASCADE'))
            await conn.execute(
                text(f'INSERT INTO "{tabela}" ({col_lista}) VALUES ({placeholders})'),
                dados,
            )

            ids = [r["id"] for r in dados if "id" in r and r["id"] is not None]
            if ids:
                await _setval(conn, tabela, max(ids))
            print(f"  {tabela}: {len(dados)} linhas migradas")
            total += len(dados)

    await pg.dispose()
    sq.close()
    print(f"\nTotal migrado: {total} linhas")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--sqlite", default="backend/escola.db")
    p.add_argument("--pg", required=True, help="URL do Postgres (ex.: postgresql://user:pass@host:5432/db)")
    p.add_argument("--tables", default="", help="Lista de tabelas (virgula). Padrao: todas com modelo.")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    asyncio.run(migrar(args))


if __name__ == "__main__":
    main()
