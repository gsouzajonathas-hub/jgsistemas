"""Hardening de segurança: headers globais, HSTS em https, CSP em /api,
rate limit global para endpoints públicos e lockout de conta por tentativas falhas.

Observação: a suíte roda com RATE_LIMIT_PER_MINUTE=0 (conftest) para não interferir
nos demais testes; os testes de rate limit reabilitam o limite isoladamente com IPs únicos.
"""
from fastapi.testclient import TestClient

from app.main import app
from app.models.user import User
from app.utils.auth import hash_password
from app.utils.security import (
    register_failed_login, is_account_locked, reset_login_attempts,
)
from tests.fixtures import _get_or_create


def _base_headers_ok(resp) -> bool:
    return (
        resp.headers.get("x-content-type-options") == "nosniff"
        and resp.headers.get("x-frame-options") == "DENY"
        and resp.headers.get("referrer-policy") == "same-origin"
        and "permissions-policy" in resp.headers
    )


def test_headers_globais_presentes_em_http(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert _base_headers_ok(resp)
    # http em ambiente não-prod não recebe HSTS (evita quebrar dev local)
    assert "strict-transport-security" not in resp.headers
    assert "content-security-policy" in resp.headers
    assert "default-src 'none'" in resp.headers["content-security-policy"]


def test_hsts_presente_em_https():
    with TestClient(app, base_url="https://testserver") as https_client:
        resp = https_client.get("/api/health")
        assert resp.status_code == 200
        hsts = resp.headers.get("strict-transport-security", "")
        assert hsts.startswith("max-age=")
        assert "includeSubDomains" in hsts


async def test_rate_limit_global_429_sem_token_e_bypass_com_token(monkeypatch, auth_headers):
    monkeypatch.setenv("RATE_LIMIT_PER_MINUTE", "3")

    # Cliente público (IP único): estoura o limite e recebe 429 com headers de segurança.
    with TestClient(app, client=("203.0.113.10", 40001)) as public_client:
        for _ in range(3):
            resp = public_client.get("/api/health")
            assert resp.status_code == 200
        resp = public_client.get("/api/health")
        assert resp.status_code == 429
        assert resp.headers.get("x-content-type-options") == "nosniff"

    # Cliente autenticado (IP único): token válido não sofre rate limit global.
    with TestClient(app, client=("203.0.113.11", 40002)) as authed_client:
        for _ in range(6):
            resp = authed_client.get("/api/students", headers=auth_headers)
            assert resp.status_code == 200


def test_lockout_unit():
    reset_login_attempts("x@y.zz")
    for _ in range(4):
        assert register_failed_login("x@y.zz") is False
    assert register_failed_login("x@y.zz") is True  # 5ª falha: bloqueia
    assert is_account_locked("x@y.zz")
    assert register_failed_login("x@y.zz") is False  # já bloqueado
    reset_login_attempts("x@y.zz")
    assert not is_account_locked("x@y.zz")


async def test_lockout_conta_apos_5_falhas(db_session, client):
    user = await _get_or_create(
        db_session,
        User,
        filters={"email": "lockout@example.com"},
        defaults={
            "name": "Lockout Teste",
            "email": "lockout@example.com",
            "password_hash": hash_password("senha-correta-123"),
            "role": "secretary",
            "is_active": True,
        },
    )
    reset_login_attempts(user.email)

    with TestClient(app, client=("203.0.113.20", 40010)) as attacker:
        for _ in range(5):
            resp = attacker.post("/api/auth/login", json={"email": user.email, "password": "senha-errada-xyz"})
            assert resp.status_code == 401
            assert resp.json()["detail"] == "Email ou senha incorretos"

        # 6ª tentativa com a senha CORRETA: bloqueado e resposta idêntica (sem enumeração).
        resp = attacker.post("/api/auth/login", json={"email": user.email, "password": "senha-correta-123"})
        assert resp.status_code == 401
        assert resp.json()["detail"] == "Email ou senha incorretos"

    # Após reset (janela expirada ou admin), o login volta a funcionar.
    reset_login_attempts(user.email)
    with TestClient(app, client=("203.0.113.21", 40011)) as victim:
        resp = victim.post("/api/auth/login", json={"email": user.email, "password": "senha-correta-123"})
        assert resp.status_code == 200
        assert resp.json()["access_token"]


def test_conta_inexistente_nao_entra_no_lockout(client):
    # A rota de login não registra falhas para e-mails que não existem (anti-DoS).
    reset_login_attempts("naoexiste@example.com")
    with TestClient(app, client=("203.0.113.30", 40012)) as public_client:
        for _ in range(10):
            resp = public_client.post("/api/auth/login", json={"email": "naoexiste@example.com", "password": "x"})
            assert resp.status_code == 401
            assert resp.json()["detail"] == "Email ou senha incorretos"
    assert not is_account_locked("naoexiste@example.com")