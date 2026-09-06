from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.course import Course
from app.utils.permissions import require_permission
from app.utils.audit import log_audit

router = APIRouter()


class CourseSchema(BaseModel):
    name: str
    level: str = ""
    description: str = ""
    duration_hours: int = 0
    price: float = 0


def _course_to_dict(c) -> dict:
    return {
        "id": c.id, "name": c.name, "level": c.level or "",
        "description": c.description or "", "duration_hours": c.duration_hours,
        "price": c.price,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


@router.get("")
async def list_courses(current_user=Depends(require_permission("courses")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).order_by(Course.name))
    return [_course_to_dict(c) for c in result.scalars().all()]


@router.post("")
async def create_course(data: CourseSchema, request: Request,
                        current_user=Depends(require_permission("courses")), db: AsyncSession = Depends(get_db)):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Nome do curso é obrigatório")
    course = Course(**data.model_dump())
    db.add(course)
    await db.flush()
    await log_audit(db, current_user, "course.create", "course", course.id,
                    details=f"name={course.name}", ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(course)
    return {"id": course.id, "message": "Curso criado com sucesso"}


@router.put("/{course_id}")
async def update_course(course_id: int, data: CourseSchema, request: Request,
                        current_user=Depends(require_permission("courses")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Nome do curso é obrigatório")
    for k, v in data.model_dump().items():
        setattr(course, k, v)
    await log_audit(db, current_user, "course.update", "course", course_id,
                    details=f"name={course.name}", ip_address=request.client.host if request.client else None)
    await db.commit()
    return {"message": "Curso atualizado com sucesso"}


@router.delete("/{course_id}")
async def delete_course(course_id: int, request: Request,
                        current_user=Depends(require_permission("courses")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    from sqlalchemy import func
    from app.models.class_group import ClassGroup
    classes_count = await db.execute(
        select(func.count()).select_from(ClassGroup).where(ClassGroup.course_id == course_id)
    )
    if (classes_count.scalar() or 0) > 0:
        raise HTTPException(
            status_code=400,
            detail="Curso possui turmas vinculadas. Exclua ou reatribua as turmas antes de excluir o curso."
        )
    await log_audit(db, current_user, "course.delete", "course", course_id,
                    details=f"name={course.name}", ip_address=request.client.host if request.client else None)
    await db.delete(course)
    await db.commit()
    return {"message": "Curso excluído com sucesso"}
