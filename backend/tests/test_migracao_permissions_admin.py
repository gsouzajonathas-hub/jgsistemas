"""T-02.03 (super-admin-master, D-05): migracao popula permissions dos admins existentes.

Roda a migracao diretamente com o Alembic contra um banco SQLite temporario e isolado deste
teste (nao usa o banco compartilhado do conftest, porque precisa controlar exatamente quais
revisoes ja foram aplicadas antes do upgrade que estamos testando).
"""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest
from sqlalchemy import create_engine, text

BACKEND_DIR = Path(__file__).resolve().parent.parent


@pytest.fixture
def banco_temporario_com_admin_sem_permissions():
    tmp_dir = tempfile.mkdtemp(prefix="migracao_permissions_test_")
    db_path = Path(tmp_dir) / "test_migracao.db"
    db_url = f"sqlite:///{db_path}"

    env = os.environ.copy()
    env["DATABASE_URL"] = db_url
    env["SECRET_KEY"] = "chave-de-teste-migracao-9f8e7d6c5b4a321098"
    env["ENVIRONMENT"] = "test"

    # Sobe o schema ate a revisao ANTERIOR a esta (simula banco existente antes da feature).
    subprocess.run(
        [sys.executable, "-m", "alembic", "-c", str(BACKEND_DIR / "alembic.ini"),
         "upgrade", "892b733803aa"],
        cwd=str(BACKEND_DIR), env=env, check=True, capture_output=True, text=True,
    )

    engine = create_engine(db_url)
    with engine.begin() as conn:
        conn.execute(text(
            "INSERT INTO users (name, email, password_hash, role, permissions, is_active) "
            "VALUES ('Admin Existente', 'admin-existente@teste.local', 'hash-fake', 'admin', NULL, 1)"
        ))
        conn.execute(text(
            "INSERT INTO users (name, email, password_hash, role, permissions, is_active) "
            "VALUES ('Admin Customizado', 'admin-customizado@teste.local', 'hash-fake', 'admin', "
            "'[\"financial\"]', 1)"
        ))
    engine.dispose()

    yield db_url, env


def test_upgrade_head_popula_permissions_de_admin_sem_permissions(banco_temporario_com_admin_sem_permissions):
    db_url, env = banco_temporario_com_admin_sem_permissions

    resultado = subprocess.run(
        [sys.executable, "-m", "alembic", "-c", str(BACKEND_DIR / "alembic.ini"), "upgrade", "head"],
        cwd=str(BACKEND_DIR), env=env, capture_output=True, text=True,
    )
    assert resultado.returncode == 0, resultado.stdout + resultado.stderr

    engine = create_engine(db_url)
    with engine.begin() as conn:
        permissions_existente = conn.execute(text(
            "SELECT permissions FROM users WHERE email = 'admin-existente@teste.local'"
        )).scalar_one()
        permissions_customizado = conn.execute(text(
            "SELECT permissions FROM users WHERE email = 'admin-customizado@teste.local'"
        )).scalar_one()
    engine.dispose()

    modulos = json.loads(permissions_existente)
    assert len(modulos) == 15
    assert "audit" in modulos and "settings" in modulos

    # Quem ja tinha permissions customizado NAO e sobrescrito.
    assert json.loads(permissions_customizado) == ["financial"]
