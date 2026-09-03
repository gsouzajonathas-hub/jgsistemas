from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.database import get_db
from app.models.lead import Lead
from app.utils.security import is_rate_limited, client_ip

router = APIRouter()


class LeadCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    message: str = Field(..., min_length=5, max_length=4000)


@router.post("", status_code=201)
async def create_lead(data: LeadCreate, request: Request, db: AsyncSession = Depends(get_db)):
    """Captura pública de lead do formulário de contato da landing page.

    Endpoint sem autenticação (é um formulário público de captação de leads),
    portanto é rate-limited por IP e por endereço de e-mail para evitar abuso.
    """
    ip = client_ip(request)
    if is_rate_limited(f"lead:ip:{ip}", limit=5, window_seconds=300) or \
       is_rate_limited(f"lead:email:{data.email.lower()}", limit=3, window_seconds=3600):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde alguns minutos.")

    lead = Lead(
        name=data.name.strip(),
        email=data.email.lower().strip(),
        phone=(data.phone or "").strip() or None,
        message=data.message.strip(),
        source="landing",
        status="new",
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)

    return {"id": lead.id, "status": lead.status, "message": "Recebemos seu contato. Em breve nossa equipe falará com você."}
