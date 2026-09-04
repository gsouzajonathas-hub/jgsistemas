"""Metodologia de integração Resend (resend-email-integration).

Cobre os padrões battle-tested aplicados ao email_service:
- Validação de e-mail antes de qualquer I/O.
- Retry com backoff exponencial APENAS em erros transitórios (429/5xx),
  nunca em 4xx (que exigem correção).
- Idempotency-Key enviada no header de cada request.
- Sucesso em 200/201.
"""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


def _resend_env(monkeypatch):
    monkeypatch.setenv("RESEND_API_KEY", "re_test_key")
    monkeypatch.setenv("RESEND_FROM", "no-reply@jgsistemas.com.br")
    monkeypatch.delenv("SMTP_HOST", raising=False)


def _resp(status_code, text="", headers=None):
    resp = MagicMock()
    resp.status_code = status_code
    resp.text = text
    resp.headers = headers or {}
    return resp


class _FakeAsyncClient:
    """AsyncClient fake que devolve respostas sequenciais de uma side_effect list."""

    def __init__(self, responses):
        self._responses = list(responses)
        self.post_calls = []
        self.posted_headers = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def post(self, url, headers=None, json=None):
        self.post_calls.append({"url": url, "headers": headers, "json": json})
        self.posted_headers = headers
        return self._responses.pop(0)


@pytest.mark.asyncio
async def test_email_invalido_falha_sem_io(monkeypatch):
    """E-mail de destino inválido falha imediatamente, sem chamar a API."""
    _resend_env(monkeypatch)

    from app.services import email_service

    with patch.object(email_service.httpx, "AsyncClient") as m:
        result = await email_service.send_email("sem-arroba", "Assunto", "Corpo")

    assert result["success"] is False
    assert "Destinatário" in result["error"]
    m.assert_not_called()


@pytest.mark.asyncio
async def test_sucesso_200(monkeypatch):
    """200 → sucesso e Idempotency-Key presente no header."""
    _resend_env(monkeypatch)

    from app.services import email_service

    fake = _FakeAsyncClient([_resp(200)])

    with patch.object(email_service.httpx, "AsyncClient", return_value=fake):
        result = await email_service.send_email("cliente@escola.com.br", "Assunto", "Corpo")

    assert result["success"] is True
    assert result["attempts"] == 1
    # Garante idempotência na primeira chamada
    assert "Idempotency-Key" in fake.posted_headers
    assert fake.posted_headers["Idempotency-Key"]


@pytest.mark.asyncio
async def test_erro_400_nao_retenta(monkeypatch):
    """Erro 4xx (validação) NÃO é retentado (metodologia: exige correção)."""
    _resend_env(monkeypatch)

    from app.services import email_service

    fake = _FakeAsyncClient([_resp(400, '{"message":"validation_error"}')])

    with patch.object(email_service.httpx, "AsyncClient", return_value=fake):
        result = await email_service.send_email("cliente@escola.com.br", "Assunto", "Corpo")

    assert result["success"] is False
    assert result["attempts"] == 1  # sem retry
    assert len(fake.post_calls) == 1


@pytest.mark.asyncio
async def test_rate_limit_429_retenta_com_backoff(monkeypatch):
    """429 (rate limit) → retry com backoff; após esgotar tentativas, falha controlada."""
    _resend_env(monkeypatch)

    from app.services import email_service

    # Reduce retries so test is fast & deterministic: 429 + 429 + 200 -> success on attempt 3
    monkeypatch.setattr(email_service, "MAX_RETRIES", 3)
    monkeypatch.setattr(email_service, "RETRY_DELAYS_SECONDS", [0.01, 0.01, 0.01])
    monkeypatch.setattr(email_service, "JITTER_MAX_MS", 0)  # jitter off

    responses = [_resp(429, headers={"Retry-After": "1"}), _resp(429, headers={"Retry-After": "1"}), _resp(200)]
    fake = _FakeAsyncClient(responses)

    with patch.object(email_service.httpx, "AsyncClient", return_value=fake):
        result = await email_service.send_email("cliente@escola.com.br", "Assunto", "Corpo")

    assert result["success"] is True
    assert result["attempts"] == 3  # 429, 429, 200 (2 retries)
    assert len(fake.post_calls) == 3


@pytest.mark.asyncio
async def test_429_esgota_e_falha(monkeypatch):
    """429 persistente → após MAX_RETRIES tentativas, falha sem levantar exceção."""
    _resend_env(monkeypatch)

    from app.services import email_service

    monkeypatch.setattr(email_service, "MAX_RETRIES", 2)
    monkeypatch.setattr(email_service, "RETRY_DELAYS_SECONDS", [0.01, 0.01])
    monkeypatch.setattr(email_service, "JITTER_MAX_MS", 0)

    responses = [_resp(429), _resp(429), _resp(429)]  # tentativa 1,2,3; MAX_RETRIES=2 -> falha na 3ª
    fake = _FakeAsyncClient(responses)

    with patch.object(email_service.httpx, "AsyncClient", return_value=fake):
        result = await email_service.send_email("cliente@escola.com.br", "Assunto", "Corpo")

    assert result["success"] is False
    assert "Resend" in result["error"]
    assert result["attempts"] == 3
    assert len(fake.post_calls) == 3
