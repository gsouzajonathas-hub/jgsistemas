from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.class_group import ClassGroup
from app.models.enrollment import Enrollment
from app.models.teacher import Teacher
from app.models.course import Course
from app.utils.permissions import require_permission
from app.utils.security import client_ip
from app.utils.audit import log_audit

router = APIRouter()


class ClassSchema(BaseModel):
    name: str
    course_id: int
    teacher_id: int
    room: str = ""
    weekdays: str = ""
    start_time: str = "08:00"
    end_time: str = "09:00"
    max_capacity: int = 20
    level: str = ""
    unit: str = "Matriz"


def _class_to_dict(c, teacher_name="", course_name="") -> dict:
    return {
        "id": c.id, "name": c.name, "course_id": c.course_id,
        "teacher_id": c.teacher_id, "room": c.room,
        "weekdays": c.weekdays, "start_time": str(c.start_time) if c.start_time else "",
        "end_time": str(c.end_time) if c.end_time else "",
        "max_capacity": c.max_capacity, "current_count": c.current_count,
        "level": c.level, "unit": c.unit, "is_active": c.is_active,
        "teacher_name": teacher_name, "course_name": course_name,
        "created_at": c.created_at.isoformat() if c.created_at else None
    }


@router.get("/count")
async def count_classes(current_user=Depends(require_permission("classes")), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    result = await db.execute(select(func.count()).select_from(ClassGroup))
    return {"count": result.scalar()}


@router.get("")
async def list_classes(skip: int = 0, limit: int = 50, current_user=Depends(require_permission("classes")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ClassGroup).order_by(ClassGroup.name).offset(skip).limit(limit))
    classes = result.scalars().all()

    teacher_ids = {c.teacher_id for c in classes}
    course_ids = {c.course_id for c in classes}

    teachers = {}
    if teacher_ids:
        r = await db.execute(select(Teacher).where(Teacher.id.in_(teacher_ids)))
        teachers = {t.id: t.full_name for t in r.scalars().all()}

    courses = {}
    if course_ids:
        r = await db.execute(select(Course).where(Course.id.in_(course_ids)))
        courses = {c.id: c.name for c in r.scalars().all()}

    return [_class_to_dict(c, teachers.get(c.teacher_id, ""), courses.get(c.course_id, "")) for c in classes]


@router.post("")
async def create_class(class_data: ClassSchema, request: Request, current_user=Depends(require_permission("classes")), db: AsyncSession = Depends(get_db)):
    data = class_data.model_dump()
    from datetime import time
    data["start_time"] = time.fromisoformat(data["start_time"]) if data.get("start_time") else time(8, 0)
    data["end_time"] = time.fromisoformat(data["end_time"]) if data.get("end_time") else time(9, 0)
    if data["start_time"] >= data["end_time"]:
        raise HTTPException(status_code=400, detail="Horário de início deve ser anterior ao horário de término")
    cg = ClassGroup(**data)
    db.add(cg)
    await db.flush()
    await log_audit(db, current_user, "class.create", "class_group", cg.id,
                    details=f"name={cg.name} course={cg.course_id} teacher={cg.teacher_id}",
                    ip_address=client_ip(request))
    await db.commit()
    await db.refresh(cg)
    return {"id": cg.id, "message": "Turma criada com sucesso"}


@router.put("/{class_id}")
async def update_class(class_id: int, class_data: ClassSchema, request: Request, current_user=Depends(require_permission("classes")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ClassGroup).where(ClassGroup.id == class_id))
    cg = result.scalar_one_or_none()
    if not cg:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    data = class_data.model_dump()
    from datetime import time
    data["start_time"] = time.fromisoformat(data["start_time"]) if data.get("start_time") else time(8, 0)
    data["end_time"] = time.fromisoformat(data["end_time"]) if data.get("end_time") else time(9, 0)
    if data["start_time"] >= data["end_time"]:
        raise HTTPException(status_code=400, detail="Horário de início deve ser anterior ao horário de término")
    for k, v in data.items():
        setattr(cg, k, v)
    await log_audit(db, current_user, "class.update", "class_group", class_id,
                    details=f"name={cg.name} course={cg.course_id} teacher={cg.teacher_id}",
                    ip_address=client_ip(request))
    await db.commit()
    return {"message": "Turma atualizada com sucesso"}


@router.delete("/{class_id}")
async def delete_class(class_id: int, request: Request, current_user=Depends(require_permission("classes")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ClassGroup).where(ClassGroup.id == class_id))
    cg = result.scalar_one_or_none()
    if not cg:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    active = (await db.execute(select(func.count()).select_from(Enrollment).where(
        Enrollment.class_group_id == cg.id, Enrollment.status == "active"
    ))).scalar() or 0
    if active > 0:
        raise HTTPException(status_code=400, detail=f"Turma possui {active} matrícula(s) ativa(s). Desative-as primeiro.")
    await log_audit(db, current_user, "class.delete", "class_group", class_id,
                    details=f"name={cg.name} course={cg.course_id} teacher={cg.teacher_id}",
                    ip_address=client_ip(request))
    await db.delete(cg)
    await db.commit()
    return {"message": "Turma excluída com sucesso"}
