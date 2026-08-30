"""Regressão: register deve funcionar no bootstrap (1º usuário, sem crash de audit).

Achado do E2E (T-03.08): `admin` não era definido no caminho sem usuários e o
`log_audit(db, admin, ...)` estourava UnboundLocalError -> todo bootstrap 500.
"""
import pytest
from sqlalchemy import delete

from app.models.user import User


@pytest.fixture
async def estado_bootstrap(db_session):
    """Garante zero usuarios (reproduz o cenario de primeira execucao)."""
    await db_session.execute(delete(User))
    await db_session.commit()
    yield
    await db_session.execute(delete(User))
    await db_session.commit()


async def test_bootstrap_register_primeiro_usuario(client, estado_bootstrap):
    """Sem usuarios no banco, o primeiro register deve retornar 200 e criar o admin."""
    resp = client.post("/api/auth/register", json={
        "name": "Admin Bootstrap",
        "email": "bootstrap@teste.com",
        "password": "SenhaForte@123",
        "role": "admin",
    })
    assert resp.status_code == 200, resp.text
    assert resp.json()["message"] == "Usuário criado com sucesso"


async def test_register_sem_admin_quando_ha_usuarios(client, estado_bootstrap):
    """Bootstrap consumido: register anonimo deve dar 403 (apenas admin cria usuarios)."""
    client.post("/api/auth/register", json={
        "name": "Admin Bootstrap",
        "email": "bootstrap@teste.com",
        "password": "SenhaForte@123",
        "role": "admin",
    })
    resp = client.post("/api/auth/register", json={
        "name": "Segundo",
        "email": "outro@teste.com",
        "password": "SenhaForte@123",
        "role": "secretary",
    })
    assert resp.status_code == 403, resp.text


async def test_login_do_usuario_bootstrap(client, estado_bootstrap):
    """O usuario criado no bootstrap deve conseguir logar (fluxo real: start.ps1 imprime senha)."""
    client.post("/api/auth/register", json={
        "name": "Admin Bootstrap",
        "email": "bootstrap@teste.com",
        "password": "SenhaForte@123",
        "role": "admin",
    })
    resp = client.post("/api/auth/login", json={
        "email": "bootstrap@teste.com",
        "password": "SenhaForte@123",
    })
    assert resp.status_code == 200, resp.text
    assert resp.json()["access_token"]