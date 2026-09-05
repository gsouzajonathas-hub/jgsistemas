"""Testes extras OC-2026-0002 — casos de borda da exclusao de usuarios.

Cobre alem da regressao (test_user_delete_regression.py):
- usuario sem historico e excluido normalmente;
- registros de comunicacao e auditoria sao PRESERVADOS com user_id/sent_by NULL;
- exclusao do ultimo administrador ativo e bloqueada (400);
- auto-exclusao continua bloqueada (400) e usuario inexistente retorna 404.
"""
import pytest
from sqlalchemy import event, select

from app.database import engine, async_session
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.communication import CommunicationLog
from app.utils.auth import hash_password, create_access_token


@event.listens_for(engine.sync_engine, "connect")
def _fk_on(dbapi_conn, _):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


async def _criar_usuario(db_session, email, role="secretary", is_active=True):
    u = User(
        name=f"Usuario {email}",
        email=email,
        password_hash=hash_password("senha-forte-123"),
        role=role,
        is_active=is_active,
    )
    db_session.add(u)
    await db_session.flush()
    return u


async def test_delete_usuario_sem_historico(client, auth_headers, db_session):
    u = await _criar_usuario(db_session, "sem-historico@teste.local")
    await db_session.commit()
    await db_session.refresh(u)

    resp = client.delete(f"/api/auth/users/{u.id}", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    async with async_session() as s:
        restante = (
            await s.execute(select(User).where(User.id == u.id))
        ).scalar_one_or_none()
    assert restante is None


async def test_delete_preserva_communication_log_com_sent_by_nulo(
    client, auth_headers, db_session
):
    u = await _criar_usuario(db_session, "com-comunicacao@teste.local")
    await db_session.flush()
    comm = CommunicationLog(
        channel="email",
        recipient="destino@teste.local",
        subject="Aviso",
        message="Mensagem enviada pelo usuario excluido",
        sent_by=u.id,
    )
    audit_alvo = AuditLog(user_id=u.id, action="login", entity="user", entity_id=u.id)
    db_session.add_all([comm, audit_alvo])
    await db_session.commit()
    await db_session.refresh(comm)
    await db_session.refresh(audit_alvo)

    resp = client.delete(f"/api/auth/users/{u.id}", headers=auth_headers)
    assert resp.status_code == 200, resp.text

    async with async_session() as s:
        log = (
            await s.execute(
                select(CommunicationLog).where(CommunicationLog.id == comm.id)
            )
        ).scalar_one_or_none()
        audit = (
            await s.execute(
                select(AuditLog).where(AuditLog.id == audit_alvo.id)
            )
        ).scalar_one_or_none()
    assert log is not None, "registro de comunicacao deve permanecer"
    assert log.sent_by is None, "sent_by deve virar NULL, preservando o historico"
    assert audit is not None, "trilha de auditoria do alvo deve permanecer"
    assert audit.user_id is None, "user_id da trilha do alvo deve virar NULL"


async def test_delete_admin2_permitido_quando_existe_outro_ativo(
    client, auth_headers, db_session
):
    # admin_user (fixture) e' o admin ativo da sessao; admin2 ativo = 2 admins ativos
    admin2 = await _criar_usuario(db_session, "admin2@teste.local", role="admin")
    await db_session.commit()
    await db_session.refresh(admin2)

    resp = client.delete(f"/api/auth/users/{admin2.id}", headers=auth_headers)
    assert resp.status_code == 200, resp.text


async def test_delete_ultimo_admin_ativo_bloqueado(client, auth_headers, db_session):
    # administrador inativo: excluir deixaria o sistema sem segundo admin ativo
    admin_inativo = await _criar_usuario(
        db_session, "admin-inativo@teste.local", role="admin", is_active=False
    )
    await db_session.commit()
    await db_session.refresh(admin_inativo)

    resp = client.delete(f"/api/auth/users/{admin_inativo.id}", headers=auth_headers)
    assert resp.status_code == 400, resp.text
    assert "último administrador" in resp.json()["detail"].lower()

    async with async_session() as s:
        restante = (
            await s.execute(select(User).where(User.id == admin_inativo.id))
        ).scalar_one_or_none()
    assert restante is not None, "usuario protegido nao pode ser excluido"


async def test_delete_auto_exclusao_bloqueada(client, auth_headers, admin_user):
    resp = client.delete(f"/api/auth/users/{admin_user.id}", headers=auth_headers)
    assert resp.status_code == 400, resp.text
    assert "própria conta" in resp.json()["detail"].lower()


async def test_delete_usuario_inexistente_retorna_404(client, auth_headers):
    resp = client.delete("/api/auth/users/999999", headers=auth_headers)
    assert resp.status_code == 404, resp.text


async def test_delete_sem_permissao_retorna_403(client, db_session):
    secretaria = await _criar_usuario(db_session, "secretaria@teste.local")
    await db_session.commit()
    await db_session.refresh(secretaria)
    token = create_access_token({"sub": str(secretaria.id)})

    resp = client.delete(
        f"/api/auth/users/{secretaria.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403, resp.text