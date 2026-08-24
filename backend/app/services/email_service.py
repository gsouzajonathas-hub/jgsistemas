import os
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


async def send_email(to: str, subject: str, body: str) -> dict:
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
        )
        return {"success": True, "error": None}
    except Exception as e:
        return {"success": False, "error": str(e)}
