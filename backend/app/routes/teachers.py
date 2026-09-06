from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.teacher import Teacher
from app.utils.permissions import require_permission
from app.utils.audit import log_audit

router = APIRouter()


class TeacherSchema(BaseModel):
    full_name: str
    cpf: str = ""
    phone: str = ""
    whatsapp: str = ""
    email: str = ""
    specialization: str = ""
    hourly_rate: int = 0
    is_active: bool = True
    notes: str = ""


@router.get("")
async def list_teachers(current_user=Depends(require_permission("teachers")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Teacher).where(Teacher.is_active == True).order_by(Teacher.full_name))  # noqa: E712
    return [{"id": t.id, "full_name": t.full_name} for t in result.scalars().all()]


@router.get("/all")
async def list_all_teachers(current_user=Depends(require_permission("teachers")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Teacher).order_by(Teacher.full_name))
    return [{
        "id": t.id, "full_name": t.full_name, "cpf": t.cpf or "", "phone": t.phone or "",
        "email": t.email or "", "specialization": t.specialization or "",
        "hourly_rate": t.hourly_rate, "is_active": t.is_active,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    } for t in result.scalars().all()]


@router.post("")
async def create_teacher(data: TeacherSchema, request: Request,
                         current_user=Depends(require_permission("teachers")), db: AsyncSession = Depends(get_db)):
    if not data.full_name.strip():
        raise HTTPException(status_code=400, detail="Nome do professor é obrigatório")
    if data.cpf:
        existing = await db.execute(select(Teacher).where(Teacher.cpf == data.cpf))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="CPF já cadastrado")
    teacher = Teacher(**data.model_dump())
    db.add(teacher)
    await db.flush()
    await log_audit(db, current_user, "teacher.create", "teacher", teacher.id,
                    details=f"name={teacher.full_name}", ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(teacher)
    return {"id": teacher.id, "message": "Professor cadastrado com sucesso"}


@router.put("/{teacher_id}")
async def update_teacher(teacher_id: int, data: TeacherSchema, request: Request,
                         current_user=Depends(require_permission("teachers")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Teacher).where(Teacher.id == teacher_id))
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    if not data.full_name.strip():
        raise HTTPException(status_code=400, detail="Nome do professor é obrigatório")
    if data.cpf:
        dup = await db.execute(select(Teacher).where(Teacher.cpf == data.cpf, Teacher.id != teacher_id))
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="CPF já cadastrado")
    for k, v in data.model_dump().items():
        setattr(teacher, k, v)
    await log_audit(db, current_user, "teacher.update", "teacher", teacher_id,
                    details=f"name={teacher.full_name}", ip_address=request.client.host if request.client else None)
    await db.commit()
    return {"message": "Professor atualizado com sucesso"}


@router.delete("/{teacher_id}")
async def delete_teacher(teacher_id: int, request: Request,
                         current_user=Depends(require_permission("teachers")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Teacher).where(Teacher.id == teacher_id))
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    from app.models.class_group import ClassGroup
    classes_count = await db.execute(
        select(func.count()).select_from(ClassGroup).where(ClassGroup.teacher_id == teacher_id)
    )
    if (classes_count.scalar() or 0) > 0:
        raise HTTPException(
            status_code=400,
            detail="Professor possui turmas vinculadas. Reatribua as turmas antes de excluir."
        )
    await log_audit(db, current_user, "teacher.delete", "teacher", teacher_id,
                    details=f"name={teacher.full_name}", ip_address=request.client.host if request.client else None)
    await db.delete(teacher)
    await db.commit()
    return {"message": "Professor excluído com sucesso"}
