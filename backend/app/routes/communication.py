from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.communication import CommunicationLog
from app.models.student import Student
from app.services.email_service import send_email
from app.services.whatsapp_service import send_whatsapp
from app.utils.auth import get_current_user, require_role
from app.utils.security import is_rate_limited, client_ip

router = APIRouter()


class SendSchema(BaseModel):
    channel: str
    recipient: str
    subject: str = ""
    message: str


@router.get("")
async def list_communications(skip: int = 0, limit: int = 50,
                              current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CommunicationLog).order_by(CommunicationLog.created_at.desc()).offset(skip).limit(limit)
    )
    logs = result.scalars().all()
    return [{"id": l.id, "channel": l.channel or "",
             "recipient": l.recipient, "subject": l.subject,
             "message": l.message, "status": l.status,
             "error_message": l.error_message,
             "created_at": l.created_at.isoformat() if l.created_at else None} for l in logs]


@router.get("/students")
async def list_students_for_communication(
    search: str = "",
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    q = select(Student).where(Student.status == "active")
    if search:
        q = q.where(Student.full_name.ilike(f"%{search}%"))
    q = q.order_by(Student.full_name).limit(50)
    result = await db.execute(q)
    students = result.scalars().all()
    return [
        {
            "id": s.id,
            "full_name": s.full_name,
            "email": s.email or "",
            "whatsapp": s.whatsapp or s.phone or "",
        }
        for s in students
    ]


@router.post("/send")
async def send_message(data: SendSchema, request: Request,
                       current_user=Depends(require_role("admin", "secretary")),
                       db: AsyncSession = Depends(get_db)):
    ip = client_ip(request)
    if is_rate_limited(f"send:user:{current_user.id}", limit=30, window_seconds=900) or \
       is_rate_limited(f"send:ip:{ip}", limit=60, window_seconds=900):
        raise HTTPException(status_code=429, detail="Muitas mensagens enviadas. Aguarde alguns minutos.")
    status = "sent"
    error_msg = None

    if data.channel == "email":
        if not data.recipient or "@" not in data.recipient:
            return {"success": False, "message": "Email inválido"}
        result = await send_email(to=data.recipient, subject=data.subject or "(sem assunto)", body=data.message)
        if not result["success"]:
            status = "failed"
            error_msg = result.get("error")

    elif data.channel == "whatsapp":
        if not data.recipient:
            return {"success": False, "message": "Número de WhatsApp inválido"}
        result = await send_whatsapp(phone=data.recipient, message=data.message)
        if not result["success"]:
            status = "failed"
            error_msg = result.get("error")

    elif data.channel == "sms":
        status = "failed"
        error_msg = "Envio de SMS não configurado"

    else:
        return {"success": False, "message": f"Canal '{data.channel}' não suportado"}

    log = CommunicationLog(
        channel=data.channel,
        recipient=data.recipient,
        subject=data.subject,
        message=data.message,
        sent_by=current_user.id,
        status=status,
        error_message=error_msg,
    )
    db.add(log)
    await db.commit()

    if status == "failed":
        return {"success": False, "message": f"Erro ao enviar: {error_msg}"}

    return {"success": True, "message": "Mensagem enviada com sucesso"}
