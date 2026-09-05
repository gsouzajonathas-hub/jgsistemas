"""Teste de regressao OC-2026-0002 — exclusao de usuario com historico deve funcionar.

Problema comprovado: DELETE /api/auth/users/{id} falha com 500 (IntegrityError) quando o
usuario tem registros em audit_logs (FK users.id -> audit_logs.user_id sem ondelete)
ou communication_logs (sent_by). Em Postgres (producao), a constraint de FK bloqueia a
exclusao; o SQLite de teste so espelha isso com PRAGMA foreign_keys=ON, ativado abaixo.
"""
import pytest
from sqlalchemy import event, select

from app.database import engine, async_session
from app.models.user import User
from app.models.audit_log import AuditLog
from app.utils.auth import hash_password


@event.listens_for(engine.sync_engine, "connect")
def _fk_on(dbapi_conn, _):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


@pytest.fixture
async def user_com_historico(db_session):
    u = User(
        name="Secretaria Com Historico",
        email="sec-historico@teste.local",
        password_hash=hash_password("senha-forte-123"),
        role="secretary",
        is_active=True,
    )
    db_session.add(u)
    await db_session.flush()
    db_session.add(AuditLog(user_id=u.id, action="login", entity="user", entity_id=u.id))
    await db_session.commit()
    await db_session.refresh(u)
    return u


async def test_delete_usuario_com_historico(client, auth_headers, user_com_historico):
    resp = client.delete(f"/api/auth/users/{user_com_historico.id}", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    async with async_session() as s:
        restante = (
            await s.execute(select(User).where(User.id == user_com_historico.id))
        ).scalar_one_or_none()
    assert restante is None