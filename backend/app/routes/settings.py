from fastapi import APIRouter, Depends, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.models.settings import SchoolSettings
from app.utils.auth import get_current_user, require_role
from app.utils.uploads import validate_and_save, IMAGE_EXTENSIONS
from app.utils.security import client_ip
from app.utils.audit import log_audit
from app.utils import storage

router = APIRouter()


class SettingsSchema(BaseModel):
    school_name: str = "Gestão Escolar"
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    cnpj: str | None = None
    pix_key: str = ""
    slogan: str = ""
    social_media: str = ""
    payment_methods: str = "PIX,Dinheiro,Débito,Crédito"
    primary_color: str = "#3B82F6"
    dark_mode: int = 0
    due_day: int = 5


async def _get_settings(db: AsyncSession) -> SchoolSettings:
    result = await db.execute(select(SchoolSettings).limit(1))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = SchoolSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.get("")
async def get_settings(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    s = await _get_settings(db)
    return {
        "id": s.id, "school_name": s.school_name, "logo_url": storage.display_url(s.logo_url),
        "address": s.address, "phone": s.phone, "email": s.email,
        "cnpj": s.cnpj, "pix_key": s.pix_key or "", "primary_color": s.primary_color, "dark_mode": s.dark_mode,
        "due_day": s.due_day, "slogan": s.slogan or "", "social_media": s.social_media or "",
        "payment_methods": s.payment_methods or "PIX,Dinheiro,Débito,Crédito"
    }


@router.put("")
async def update_settings(data: SettingsSchema, request: Request, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    s = await _get_settings(db)
    for k, v in data.model_dump().items():
        setattr(s, k, v)
    await log_audit(db, current_user, "settings.update", "settings", s.id,
                    ip_address=client_ip(request))
    await db.commit()
    return {"message": "Configurações atualizadas"}


@router.post("/logo")
async def upload_logo(request: Request, file: UploadFile = File(...), current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    filename, content = await validate_and_save(file, allowed_exts=IMAGE_EXTENSIONS)
    ref = storage.save_bytes(storage.BUCKET_LOGOS, filename, content,
                             content_type=file.content_type or "image/png")

    s = await _get_settings(db)
    s.logo_url = ref
    await log_audit(db, current_user, "settings.logo_upload", "settings", s.id,
                    details=filename, ip_address=client_ip(request))
    await db.commit()
    return {"logo_url": storage.display_url(s.logo_url)}
