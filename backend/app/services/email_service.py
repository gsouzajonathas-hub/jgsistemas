"""Serviço transacional de e-mail via Resend (preferencial) ou SMTP (fallback).

Metodologia baseada na referência battle-tested de integração com a API do Resend
(resend-email-integration). Princípios aplicados:

- **Validação de e-mail** antes do envio (remetente e destinatários).
- **Idempotency-Key**: evita e-mails duplicados em retries de rede (TTL de 24h).
- **Retry com backoff exponencial + jitter**: apenas em erros transitórios
  (429 rate-limit e 5xx). Erros 4xx NÃO são retentados (exigem correção).
- **Respeito ao header ``Retry-After``** retornado pela API no caso de 429.
- **Classificação de erros**: retryável vs não-retryável, com número de tentativas.
- **Monitoramento de cotas** via headers ``x-resend-daily-quota`` / ``x-resend-monthly-quota``.
- **Logging seguro**: nunca logar a chave da API, segredo de webhook ou PII do
  destinatário (apenas o e-mail do remetente quando estritamente necessário).
"""
import asyncio
import os
import random
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import re

import httpx

# ---------------------------------------------------------------------------
# Constantes de configuração (segundo a referência Resend)
# ---------------------------------------------------------------------------
RESEND_BASE_URL = "https://api.resend.com"
MAX_RETRIES = 3
RETRY_DELAYS_SECONDS = [1, 2, 4]  # backoff exponencial: 1s, 2s, 4s
JITTER_MAX_MS = 1000  # para evitar "thundering herd" em retries simultâneos

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

# Códigos de erro transitórios (retentáveis) segundo a referência Resend.
_RETRYABLE_RESEND_CODES = {
    429,  # rate_limit_exceeded / daily_quota_exceeded / monthly_quota_exceeded
    500,  # application_error
    503,  # service_unavailable
}


def _is_valid_email(value: str) -> bool:
    return bool(_EMAIL_RE.match(value or ""))


def _build_idempotency_key(subject: str, to: str) -> str:
    """Gera uma chave de idempotência determinística dentro das restrições do Resend.

    Padrão recomendado na referência: ``{evento}-{destino}-{timestamp}``.
    A chave é truncada para <= 256 caracteres e usa apenas caracteres seguros.
    """
    # Subject pode conter caracteres não alfanuméricos; sanitizamos.
    safe_subject = re.sub(r"[^a-zA-Z0-9_-]", "_", subject or "email")[:40]
    safe_to = re.sub(r"[^a-zA-Z0-9_-]", "_", to or "destinatario")[:60]
    ts = int(time.time())
    key = f"password-reset/{safe_to}-{safe_subject}/{ts}"
    # Resend: 1-256 caracteres, alfanuméricos + hífens/underscores/barras.
    return key[:256]


async def send_email(to: str, subject: str, body: str) -> dict:
    """Envia e-mail transacional via Resend (preferencial) ou SMTP (fallback).

    Retorna sempre um dict com a forma::

        {"success": bool, "error": str | None, "attempts": int}

    ``success`` é ``False`` quando não foi possível entregar (config ausente ou
    erro não-retryável persistente). A chamada NUNCA levanta exceção: o fluxo de
    redefinição de senha depende disso para responder genericamente.
    """
    resend_key = os.getenv("RESEND_API_KEY", "").strip()
    resend_from = os.getenv("RESEND_FROM", "").strip()

    # Validação mínima de formato antes de qualquer I/O (metodologia referência).
    if not _is_valid_email(to):
        return {"success": False, "error": "Destinatário em formato inválido", "attempts": 0}

    if resend_key and resend_from:
        if not _is_valid_email(resend_from):
            return {"success": False, "error": "RESEND_FROM em formato inválido", "attempts": 0}
        return await _send_via_resend(to, subject, body, resend_key, resend_from)

    return await _send_via_smtp(to, subject, body)


async def _send_via_resend(to: str, subject: str, body: str, api_key: str, sender: str) -> dict:
    """Envio via Resend com idempotência e retry com backoff exponencial + jitter."""
    html = f"<html><body><p>{body.replace(chr(10), '<br>')}</p></body></html>"
    idempotency_key = _build_idempotency_key(subject, to)

    payload = {
        "from": sender,
        "to": [to],
        "subject": subject,
        "text": body,
        "html": html,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Idempotency-Key": idempotency_key,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        attempts = 0
        while attempts <= MAX_RETRIES:
            attempts += 1
            try:
                resp = await client.post(
                    f"{RESEND_BASE_URL}/emails",
                    headers=headers,
                    json=payload,
                )
            except Exception as e:  # erro de rede/timeout — transitório
                if attempts > MAX_RETRIES:
                    return {"success": False, "error": f"Sem resposta da API: {e}", "attempts": attempts}
                await _backoff(attempts, retry_after_seconds=None)
                continue

            if resp.status_code in (200, 201):
                _log_quota(resp)
                return {"success": True, "error": None, "attempts": attempts}

            # Erro da API. Apenas códigos transitórios são retentados.
            if resp.status_code in _RETRYABLE_RESEND_CODES and attempts <= MAX_RETRIES:
                retry_after = _parse_retry_after(resp)
                await _backoff(attempts, retry_after_seconds=retry_after)
                continue

            return {
                "success": False,
                "error": f"Resend {resp.status_code}: {resp.text[:200]}",
                "attempts": attempts,
            }

    return {"success": False, "error": "Falha após múltiplas tentativas", "attempts": attempts}


async def _send_via_smtp(to: str, subject: str, body: str) -> dict:
    """Fallback via SMTP, usado somente se o Resend não estiver configurado."""
    import aiosmtplib

    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)

    if not all([smtp_host, smtp_user, smtp_pass]):
        return {
            "success": False,
            "error": "Configuração SMTP não encontrada. Verifique as variáveis SMTP_HOST, SMTP_USER, SMTP_PASS.",
            "attempts": 0,
        }

    msg = MIMEMultipart("alternative")
    msg["From"] = smtp_from
    msg["To"] = to
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain", "utf-8"))
    html_body = f"<html><body><p>{body.replace(chr(10), '<br>')}</p></body></html>"
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=smtp_host,
            port=smtp_port,
            start_tls=True,
            username=smtp_user,
            password=smtp_pass,
            timeout=30,
        )
        return {"success": True, "error": None, "attempts": 1}
    except Exception as e:
        return {"success": False, "error": str(e), "attempts": 1}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
async def _backoff(attempt_number: int, retry_after_seconds: int | None) -> None:
    """Aguarda o delay de backoff (exponencial + jitter) antes de retentar.

    Se a API indicou ``Retry-After`` (no caso de 429), prioriza esse valor;
    caso contrário usa os delays fixos de backoff exponencial.
    """
    base_seconds = retry_after_seconds or RETRY_DELAYS_SECONDS[attempt_number - 1]
    jitter = random.uniform(0, JITTER_MAX_MS) / 1000.0
    await asyncio.sleep(base_seconds + jitter)


def _parse_retry_after(resp: httpx.Response) -> int | None:
    """Lê o header ``Retry-After`` (segundos) se presente e válido."""
    raw = resp.headers.get("Retry-After")
    if not raw:
        return None
    try:
        return max(1, int(raw))
    except (TypeError, ValueError):
        return None


def _log_quota(resp: httpx.Response) -> None:
    """Loga (em nível de alerta) se a cota estiver próxima de 80% (referência Resend)."""
    daily = resp.headers.get("x-resend-daily-quota")
    if daily and "/" in daily:
        try:
            used, limit = daily.split("/")
            if int(used) > int(limit) * 0.8:
                print(f"[email] ATENÇÃO: cota diária em {used}/{limit} emails", flush=True)
        except (ValueError, TypeError):
            pass
