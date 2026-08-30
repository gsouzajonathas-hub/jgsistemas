from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import List
from app.database import get_db
from app.models.attendance import Attendance
from app.utils.auth import get_current_user
from app.utils.security import client_ip
from app.utils.audit import log_audit

router = APIRouter()


class AttendanceItem(BaseModel):
    student_id: int
    status: str
    notes: str = ""


class AttendanceBulk(BaseModel):
    class_group_id: int
    date: str
    records: List[AttendanceItem]


@router.get("")
async def list_attendance(class_group_id: int = None, student_id: int = None, date: str = None,
                          current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    q = select(Attendance)
    if class_group_id:
        q = q.where(Attendance.class_group_id == class_group_id)
    if student_id:
        q = q.where(Attendance.student_id == student_id)
    if date:
        from datetime import date as d
        q = q.where(Attendance.date == d.fromisoformat(date))
    q = q.order_by(Attendance.date.desc())
    result = await db.execute(q)
    records = result.scalars().all()
    return [{"id": a.id, "student_id": a.student_id, "class_group_id": a.class_group_id,
             "date": a.date.isoformat(), "status": a.status, "notes": a.notes} for a in records]


@router.post("/bulk")
async def bulk_attendance(data: AttendanceBulk, request: Request, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from datetime import date as d
    att_date = d.fromisoformat(data.date)
    for record in data.records:
        existing = await db.execute(
            select(Attendance).where(
                Attendance.student_id == record.student_id,
                Attendance.class_group_id == data.class_group_id,
                Attendance.date == att_date
            )
        )
        att = existing.scalar_one_or_none()
        if att:
            att.status = record.status
            att.notes = record.notes
        else:
            att = Attendance(
                student_id=record.student_id,
                class_group_id=data.class_group_id,
                date=att_date,
                status=record.status,
                notes=record.notes
            )
            db.add(att)
    await log_audit(db, current_user, "attendance.bulk", "attendance", data.class_group_id,
                    details=f"class_group={data.class_group_id} date={data.date} records={len(data.records)}",
                    ip_address=client_ip(request))
    await db.commit()
    return {"message": "Frequência registrada com sucesso"}


@router.get("/report/{class_group_id}")
async def attendance_report(class_group_id: int, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models.student import Student
    from app.models.enrollment import Enrollment

    enrollments = await db.execute(
        select(Enrollment).where(Enrollment.class_group_id == class_group_id, Enrollment.status == "active")
    )
    student_ids = [e.student_id for e in enrollments.scalars().all()]

    if not student_ids:
        return []

    students = await db.execute(select(Student).where(Student.id.in_(student_ids)))
    student_map = {s.id: s.full_name for s in students.scalars().all()}

    report = []
    for sid in student_ids:
        present = await db.execute(
            select(func.count()).select_from(Attendance).where(
                Attendance.student_id == sid,
                Attendance.class_group_id == class_group_id,
                Attendance.status == "present"
            )
        )
        absent = await db.execute(
            select(func.count()).select_from(Attendance).where(
                Attendance.student_id == sid,
                Attendance.class_group_id == class_group_id,
                Attendance.status == "absent"
            )
        )
        p = present.scalar() or 0
        a = absent.scalar() or 0
        total_st = p + a if (p + a) > 0 else 1
        report.append({
            "student_id": sid, "student_name": student_map.get(sid, ""),
            "present": p, "absent": a,
            "percentage": round((p / total_st) * 100, 1)
        })
    return report
