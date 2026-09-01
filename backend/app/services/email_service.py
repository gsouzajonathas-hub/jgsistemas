import os
import httpx


async def send_email(to: str, subject: str, body: str) -> dict:
    """Envia e-mail transacional via Resend (preferencial) ou SMTP (fallback).

    Em produção usa-se Resend: basta configurar RESEND_API_KEY + RESEND_FROM.
    Se não houver key do Resend, tenta SMTP (SMTP_HOST/USER/PASS) como fallback.
    """
    resend_key = os.getenv("RESEND_API_KEY", "").strip()
    resend_from = os.getenv("RESEND_FROM", "").strip()

    if resend_key and resend_from:
        return await _send_via_resend(to, subject, body, resend_key, resend_from)

    return await _send_via_smtp(to, subject, body)


async def _send_via_resend(to: str, subject: str, body: str, api_key: str, sender: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "from": sender,
                    "to": [to],
                    "subject": subject,
                    "text": body,
                    "html": f"<html><body><p>{body.replace(chr(10), '<br>')}</p></body></html>",
                },
            )
        if resp.status_code in (200, 201):
            return {"success": True, "error": None}
        return {"success": False, "error": f"Resend {resp.status_code}: {resp.text[:200]}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def _send_via_smtp(to: str, subject: str, body: str) -> dict:
    import aiosmtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)

    if not all([smtp_host, smtp_user, smtp_pass]):
        return {"success": False, "error": "Configuração SMTP não encontrada. Verifique as variáveis SMTP_HOST, SMTP_USER, SMTP_PASS no .env"}

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
        return {"success": True, "error": None}
    except Exception as e:
        return {"success": False, "error": str(e)}
