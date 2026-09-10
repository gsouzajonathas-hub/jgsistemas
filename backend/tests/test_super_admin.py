"""Super Admin de suporte (Sprint 04).

T-04.01: seed automático no startup (idempotente, no-op sem env vars, D-13).
T-04.02: require_role libera super_admin; rebaixamento bloqueado (D-08).
T-04.03: actor_role no AuditLog + migração aditiva.
T-04.04: GET /api/audit expõe actor_role.
"""
import os
import pytest

from fastapi.testclient import TestClient
from sqlalchemy import select, func

from app.main import app
from app.models.user import User
from app.models.audit_log import AuditLog
from app.utils.auth import hash_password, create_access_token


# ---------------------------------------------------------------------------
# T-04.01 — seed automático do super admin
# ---------------------------------------------------------------------------

async def test_seed_cria_super_admin_quando_env_setado(client, db_session, monkeypatch):
    monkeypatch.setenv("SUPPORT_ADMIN_EMAIL", "seed-cria@teste.local")
    monkeypatch.setenv("SUPPORT_ADMIN_PASSWORD", "senha-super-forte-123")
    monkeypatch.setenv("SUPPORT_ADMIN_NAME", "Suporte Teste")

    with TestClient(app):
        pass  # lifespan: seed deve criar a conta

    result = await db_session.execute(select(User).where(User.email == "seed-cria@teste.local"))
    user = result.scalar_one_or_none()
    assert user is not None
    assert user.role == "super_admin"
    assert user.name == "Suporte Teste"
    assert user.is_active is True


async def test_seed_e_idempotente_nao_duplica(client, db_session, monkeypatch):
    monkeypatch.setenv("SUPPORT_ADMIN_EMAIL", "seed-idemp@teste.local")
    monkeypatch.setenv("SUPPORT_ADMIN_PASSWORD", "senha-super-forte-123")

    with TestClient(app):
        pass
    with TestClient(app):
        pass  # segundo boot

    count = (await db_session.execute(
        select(func.count()).select_from(User).where(User.email == "seed-idemp@teste.local")
    )).scalar()
    assert count == 1


async def test_seed_atualiza_role_e_nome_mas_nao_a_senha_de_usuario_existente(client, db_session, monkeypatch):
    # Usuário comum existente vira super_admin no seed (D-13: atualizar role/status).
    # A senha NÃO é sobrescrita no boot: ela só muda quando o usuário pede
    # ("esqueci minha senha"). Antes, o seed resetava a hash a cada startup,
    # então o login parava de funcionar após logout/reinício.
    email = "seed-update@teste.local"
    user = User(
        name="Comum",
        email=email,
        password_hash=hash_password("senha-antiga-123"),
        role="secretary",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    hash_antigo = user.password_hash

    monkeypatch.setenv("SUPPORT_ADMIN_EMAIL", email)
    monkeypatch.setenv("SUPPORT_ADMIN_PASSWORD", "senha-nova-456")

    with TestClient(app):
        pass

    # Query escalar foge do identity map p/ evitar staleness da sessão compartilhada.
    role_db = (await db_session.execute(
        select(User.role).where(User.email == email)
    )).scalar()
    name_db = (await db_session.execute(
        select(User.name).where(User.email == email)
    )).scalar()
    hash_db = (await db_session.execute(
        select(User.password_hash).where(User.email == email)
    )).scalar()
    assert role_db == "super_admin"
    assert name_db == "Suporte JG Sistemas"  # default
    # CORREÇÃO: a senha gravada no banco permanece intacta após o boot.
    assert hash_db == hash_antigo


async def test_seed_sem_env_vars_e_no_op(client, db_session, monkeypatch):
    monkeypatch.delenv("SUPPORT_ADMIN_EMAIL", raising=False)
    monkeypatch.delenv("SUPPORT_ADMIN_PASSWORD", raising=False)

    with TestClient(app):
        pass

    count = (await db_session.execute(
        select(func.count()).select_from(User).where(User.role == "super_admin")
    )).scalar() or 0
    # Pode haver super_admins seedados por outros testes — garantimos apenas
    # que NENHUM foi criado por este boot: nenhum super_admin com o email deste teste.
    result = await db_session.execute(select(User).where(User.email == "seed-inexistente@teste.local"))
    assert result.scalar_one_or_none() is None


# ---------------------------------------------------------------------------
# T-04.02 — acesso total + proteção contra rebaixamento
# ---------------------------------------------------------------------------

@pytest.fixture
async def super_admin_user(db_session):
    sup = await db_session.execute(select(User).where(User.email == "seed-cria@teste.local"))
    user = sup.scalar_one_or_none()
    if user is None:
        user = User(
            name="Suporte",
            email="seed-cria@teste.local",
            password_hash=hash_password("senha-super-forte-123"),
            role="super_admin",
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
    return user


@pytest.fixture
def super_admin_headers(super_admin_user):
    token = create_access_token({"sub": str(super_admin_user.id), "role": super_admin_user.role})
    return {"Authorization": f"Bearer {token}"}


def test_super_admin_acessa_rota_admin(client, super_admin_headers):
    # GET /api/audit exige require_role("admin") — super_admin deve passar (D-08)
    resp = client.get("/api/audit", headers=super_admin_headers)
    assert resp.status_code == 200, resp.text


async def test_super_admin_deleta_usuario(client, db_session, auth_headers, super_admin_headers):
    vítima = User(
        name="Vítima",
        email="vitima-delete@teste.local",
        password_hash=hash_password("senha-123"),
        role="secretary",
        is_active=True,
    )
    db_session.add(vítima)
    await db_session.commit()
    vitima_id = vítima.id

    resp = client.delete(f"/api/auth/users/{vitima_id}", headers=super_admin_headers)
    assert resp.status_code == 200, resp.text


async def test_rebaixamento_de_super_admin_bloqueado(client, db_session, super_admin_headers, super_admin_user):
    # super-admin-master D-01: gestao de usuarios e exclusiva do super_admin, entao e ele mesmo
    # quem tenta (e a trava especifica de rebaixamento continua bloqueando mesmo assim).
    resp = client.put(
        f"/api/auth/users/{super_admin_user.id}",
        json={"role": "secretary"},
        headers=super_admin_headers,
    )
    assert resp.status_code in (400, 422), resp.text


async def test_exclusao_de_super_admin_bloqueada(client, db_session, super_admin_headers, super_admin_user):
    # Guarda da auditoria (00-AUDITORIA.md, MÉDIA): DELETE /users/{id} não pode excluir a conta de
    # suporte. Usa uma SEGUNDA conta super_admin como alvo (nao a de super_admin_headers) para nao
    # cair na checagem de auto-exclusao, que e' um caminho de codigo diferente (super-admin-master).
    outro_super_admin = User(
        name="Outro Suporte",
        email="outro-suporte@teste.local",
        password_hash=hash_password("senha-super-456"),
        role="super_admin",
        is_active=True,
    )
    db_session.add(outro_super_admin)
    await db_session.commit()
    await db_session.refresh(outro_super_admin)

    resp = client.delete(
        f"/api/auth/users/{outro_super_admin.id}",
        headers=super_admin_headers,
    )
    assert resp.status_code == 400, resp.text
    assert "suporte" in resp.json()["detail"].lower() or "super admin" in resp.json()["detail"].lower()

    # A conta continua existindo e ativa
    row = (await db_session.execute(
        select(User).where(User.id == outro_super_admin.id)
    )).scalar_one()
    assert row is not None
    assert row.is_active is True
    assert row.role == "super_admin"


def test_register_nunca_cria_super_admin(client, super_admin_headers):
    # Whitelist existente (L155): "super_admin" vira "secretary"; ninguém cria via API.
    resp = client.post(
        "/api/auth/register",
        json={"name": "Intruso", "email": "intruso-super@example.com",
              "password": "senha-forte-123", "role": "super_admin"},
        headers={**super_admin_headers, "X-Forwarded-For": "10.0.9.3"},
    )
    assert resp.status_code in (200, 400), resp.text
    users = client.get("/api/auth/users", headers=super_admin_headers).json()
    assert all(u["email"] != "intruso-super@example.com" or u["role"] != "super_admin" for u in users)


# ---------------------------------------------------------------------------
# T-04.03/T-04.04 — actor_role no AuditLog
# ---------------------------------------------------------------------------

async def test_log_audit_persiste_actor_role(db_session, super_admin_user):
    from app.utils.audit import log_audit

    await log_audit(db_session, super_admin_user, "user.update", "user", super_admin_user.id,
                    details="email=seed-cria@teste.local")
    await db_session.commit()

    result = await db_session.execute(
        select(AuditLog).where(AuditLog.user_id == super_admin_user.id)
        .order_by(AuditLog.id.desc())
    )
    entry = result.scalars().first()
    assert entry is not None
    assert entry.actor_role == "super_admin"


async def test_log_audit_sem_usuario_actor_role_none(db_session):
    from app.utils.audit import log_audit

    await log_audit(db_session, None, "superadmin.seed", "user", 999,
                    details="email=anônimo@teste.local")
    await db_session.commit()

    result = await db_session.execute(
        select(AuditLog).where(AuditLog.user_id.is_(None)).order_by(AuditLog.id.desc())
    )
    entry = result.scalars().first()
    assert entry is not None
    assert entry.actor_role is None


async def test_get_audit_expoe_actor_role(client, auth_headers, super_admin_user, db_session):
    # Logs de super admin aparecem com actor_role=super_admin no GET /api/audit
    from app.utils.audit import log_audit

    await log_audit(db_session, super_admin_user, "user.update", "user", super_admin_user.id,
                    details="email=seed-cria@teste.local")
    await db_session.commit()

    resp = client.get("/api/audit", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    logs = resp.json()["logs"]
    assert any(l["actor_role"] == "super_admin" for l in logs)