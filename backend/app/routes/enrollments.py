from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.enrollment import Enrollment
from app.models.class_group import ClassGroup
from app.models.student import Student
from app.utils.permissions import require_permission

router = APIRouter()


class EnrollmentSchema(BaseModel):
    student_id: int
    class_group_id: int
    enrollment_date: Optional[str] = None
    status: str = "active"
    notes: str = ""


@router.get("")
async def list_enrollments(skip: int = 0, limit: int = 50, status: str = "", class_group_id: int = None,
                           current_user=Depends(require_permission("enrollments")), db: AsyncSession = Depends(get_db)):
    q = select(Enrollment).join(Student, Enrollment.student_id == Student.id)
    if status:
        q = q.where(Enrollment.status == status)
    if class_group_id:
        q = q.where(Enrollment.class_group_id == class_group_id)
    q = q.order_by(Student.full_name, Enrollment.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    enrollments = result.scalars().all()

    student_ids = {e.student_id for e in enrollments}
    students = {}
    if student_ids:
        r = await db.execute(select(Student).where(Student.id.in_(student_ids)))
        students = {s.id: s.full_name for s in r.scalars().all()}

    count_q = select(Enrollment)
    if status:
        count_q = count_q.where(Enrollment.status == status)
    if class_group_id:
        count_q = count_q.where(Enrollment.class_group_id == class_group_id)
    count_result = await db.execute(select(func.count()).select_from(count_q.subquery()))
    total = count_result.scalar()

    return {
        "enrollments": [{
            "id": e.id, "student_id": e.student_id, "class_group_id": e.class_group_id,
            "student_name": students.get(e.student_id, ""),
            "enrollment_date": e.enrollment_date.isoformat() if e.enrollment_date else None,
            "status": e.status or "active", "notes": e.notes,
            "created_at": e.created_at.isoformat() if e.created_at else None
        } for e in enrollments],
        "total": total
    }


@router.post("")
async def create_enrollment(data: EnrollmentSchema, current_user=Depends(require_permission("enrollments")), db: AsyncSession = Depends(get_db)):
    d = data.model_dump()
    if d.get("enrollment_date"):
        d["enrollment_date"] = date.fromisoformat(d["enrollment_date"])
    else:
        d["enrollment_date"] = date.today()

    existing = (await db.execute(select(Enrollment).where(
        Enrollment.student_id == data.student_id,
        Enrollment.class_group_id == data.class_group_id,
        Enrollment.status == "active"
    ))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Aluno já está matriculado nesta turma.")

    result = await db.execute(select(ClassGroup).where(ClassGroup.id == data.class_group_id))
    cg = result.scalar_one_or_none()
    if not cg:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    if cg.max_capacity and cg.current_count >= cg.max_capacity:
        raise HTTPException(status_code=400, detail="Turma atingiu a capacidade máxima")

    enrollment = Enrollment(**d)
    db.add(enrollment)
    cg.current_count += 1

    await db.commit()
    return {"id": enrollment.id, "message": "Matrícula realizada com sucesso"}


@router.put("/{enrollment_id}")
async def update_enrollment(enrollment_id: int, data: EnrollmentSchema, current_user=Depends(require_permission("enrollments")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Matrícula não encontrada")
    d = data.model_dump()
    if d.get("enrollment_date"):
        d["enrollment_date"] = date.fromisoformat(d["enrollment_date"])
    for k, v in d.items():
        setattr(enrollment, k, v)
    await db.commit()
    return {"message": "Matrícula atualizada com sucesso"}


@router.post("/{enrollment_id}/cancel")
async def cancel_enrollment(enrollment_id: int, current_user=Depends(require_permission("enrollments")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Matrícula não encontrada")
    enrollment.status = "cancelled"
    cg_result = await db.execute(select(ClassGroup).where(ClassGroup.id == enrollment.class_group_id))
    cg = cg_result.scalar_one_or_none()
    if cg and cg.current_count > 0:
        cg.current_count -= 1
    await db.commit()
    return {"message": "Matrícula cancelada"}


@router.post("/{enrollment_id}/suspend")
async def suspend_enrollment(enrollment_id: int, current_user=Depends(require_permission("enrollments")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Matrícula não encontrada")
    enrollment.status = "suspended"
    cg_result = await db.execute(select(ClassGroup).where(ClassGroup.id == enrollment.class_group_id))
    cg = cg_result.scalar_one_or_none()
    if cg and cg.current_count > 0:
        cg.current_count -= 1
    await db.commit()
    return {"message": "Matrícula trancada"}


@router.post("/{enrollment_id}/renew")
async def renew_enrollment(enrollment_id: int, current_user=Depends(require_permission("enrollments")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Matrícula não encontrada")

    cg_result = await db.execute(select(ClassGroup).where(ClassGroup.id == enrollment.class_group_id))
    cg = cg_result.scalar_one_or_none()
    if not cg:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    if cg.max_capacity and cg.current_count >= cg.max_capacity:
        raise HTTPException(status_code=400, detail="Turma atingiu a capacidade máxima")

    enrollment.status = "renewed"
    new_enrollment = Enrollment(
        student_id=enrollment.student_id,
        class_group_id=enrollment.class_group_id,
        enrollment_date=date.today(),
        status="active"
    )
    db.add(new_enrollment)
    cg.current_count += 1
    await db.commit()
    return {"message": "Matrícula renovada", "new_id": new_enrollment.id}
