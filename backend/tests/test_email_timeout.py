"""D-14: envio de e-mail via SMTP (fallback) define timeout=30s explicitamente."""

from unittest.mock import AsyncMock, patch


async def test_email_send_define_timeout_30(monkeypatch):
    # Garante que o caminho usado seja o fallback SMTP (sem Resend configurado)
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    monkeypatch.delenv("RESEND_FROM", raising=False)
    monkeypatch.setenv("SMTP_HOST", "smtp.teste.local")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_USER", "user@teste.local")
    monkeypatch.setenv("SMTP_PASS", "segredo")
    monkeypatch.setenv("SMTP_FROM", "remetente@teste.local")

    send_mock = AsyncMock(return_value=None)
    # aiosmtplib é importado dentro de _send_via_smtp; patch no módulo global
    with patch("aiosmtplib.send", send_mock):
        from app.services.email_service import send_email
        result = await send_email("destino@teste.local", "Assunto", "Corpo")

    assert result["success"] is True
    assert send_mock.call_args.kwargs.get("timeout") == 30
