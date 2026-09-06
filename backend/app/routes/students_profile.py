from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.student import Student
from app.models.enrollment import Enrollment
from app.models.financial import Installment, Payment
from app.models.file_upload import FileUpload
from app.models.settings import SchoolSettings
from app.utils.permissions import require_permission
from app.utils.constants import effective_installment_status

router = APIRouter()


@router.get("/{student_id}")
async def get_student_profile(student_id: int, current_user=Depends(require_permission("students")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Student).where(Student.id == student_id).options(selectinload(Student.responsible))
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    enrollments = await db.execute(
        select(Enrollment).where(Enrollment.student_id == student_id).order_by(Enrollment.created_at.desc())
    )

    installments = await db.execute(
        select(Installment).where(Installment.student_id == student_id).order_by(Installment.due_date.desc())
    )

    from datetime import date
    today = date.today()
    inst_rows = installments.scalars().all()
    changed = False
    for i in inst_rows:
        eff = effective_installment_status(i, today)
        if i.status != eff:
            i.status = eff
            changed = True
    if changed:
        await db.commit()

    pay_map = {}
    if inst_rows:
        pay_result = await db.execute(
            select(Payment).where(Payment.installment_id.in_([i.id for i in inst_rows]))
        )
        for p in pay_result.scalars().all():
            pay_map[p.installment_id] = p

    files = await db.execute(
        select(FileUpload).where(FileUpload.student_id == student_id).order_by(FileUpload.created_at.desc())
    )

    return {
        "student": {
            "id": student.id, "full_name": student.full_name, "cpf": student.cpf,
            "rg": student.rg, "birth_date": student.birth_date.isoformat() if student.birth_date else None,
            "gender": student.gender,
            "phone": student.phone, "whatsapp": student.whatsapp, "email": student.email,
            "zip_code": student.zip_code, "street": student.street, "number": student.number,
            "neighborhood": student.neighborhood, "city": student.city, "state": student.state,
            "english_level": student.english_level, "status": student.status or "",
            "notes": student.notes, "photo_url": student.photo_url,
            "unit": student.unit, "monthly_fee": student.monthly_fee, "due_day": student.due_day
        },
        "responsible": {
            "full_name": student.responsible.full_name if student.responsible else "",
            "cpf": student.responsible.cpf if student.responsible else "",
            "phone": student.responsible.phone if student.responsible else "",
            "email": student.responsible.email if student.responsible else "",
            "relationship": student.responsible.parentesco if student.responsible else ""
        },
        "enrollments": [{
            "id": e.id, "class_group_id": e.class_group_id,
            "enrollment_date": e.enrollment_date.isoformat() if e.enrollment_date else None,
            "status": e.status or "", "notes": e.notes
        } for e in enrollments.scalars().all()],
        "installments": [{
            "id": i.id, "installment_number": i.installment_number,
            "description": i.description, "amount": i.amount,
            "discount": i.discount or 0,
            "due_date": i.due_date.isoformat() if i.due_date else None, "paid_date": i.paid_date.isoformat() if i.paid_date else None,
            "status": i.status or "",
            "payment_id": pay_map[i.id].id if i.id in pay_map else None,
            "receipt_number": pay_map[i.id].receipt_number if i.id in pay_map else None
        } for i in inst_rows],
        "files": [{
            "id": f.id, "file_name": f.file_name, "file_path": f.file_path,
            "category": f.category, "created_at": f.created_at.isoformat() if f.created_at else None
        } for f in files.scalars().all()]
    }


@router.get("/{student_id}/pdf")
async def student_sheet_pdf(student_id: int, current_user=Depends(require_permission("students")), db: AsyncSession = Depends(get_db)):
    import io
    from app.services.student_sheet_service import build_student_sheet_pdf
    from app.services.receipt_service import _school_logo

    result = await db.execute(
        select(Student).where(Student.id == student_id).options(selectinload(Student.responsible))
    )
    student = result.scalar_one_or_none()
    if not student:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    settings = (await db.execute(select(SchoolSettings).order_by(SchoolSettings.id))).scalars().first()
    resp = student.responsible

    from app.models.financial import FinancialContract, FinancialPlan
    plan_name = None
    fc = (await db.execute(
        select(FinancialContract).where(FinancialContract.student_id == student.id)
        .order_by(FinancialContract.id.desc()).limit(1)
    )).scalar_one_or_none()
    if fc and fc.plan_id:
        plan = (await db.execute(select(FinancialPlan).where(FinancialPlan.id == fc.plan_id))).scalar_one_or_none()
        if plan:
            plan_name = plan.name

    data = {
        "school": {
            "name": getattr(settings, "school_name", "") or "Escola",
            "cnpj": getattr(settings, "cnpj", ""), "address": getattr(settings, "address", ""),
            "phone": getattr(settings, "phone", ""), "email": getattr(settings, "email", ""),
            "logo": _school_logo(settings),
        },
        "enrollment_number": f"{student.id:05d}",
        "student": {
            "full_name": student.full_name, "cpf": student.cpf, "rg": student.rg,
            "birth_date": student.birth_date.isoformat() if student.birth_date else None,
            "gender": student.gender, "marital_status": student.marital_status,
            "phone": student.phone, "whatsapp": student.whatsapp, "email": student.email,
            "zip_code": student.zip_code, "street": student.street, "number": student.number,
            "neighborhood": student.neighborhood, "city": student.city, "state": student.state,
            "english_level": student.english_level, "unit": student.unit,
            "status": student.status or "",
            "enrollment_date": student.enrollment_date.isoformat() if student.enrollment_date else None,
            "monthly_fee": float(student.monthly_fee) if student.monthly_fee is not None else None,
            "due_day": student.due_day,
            "plan_name": plan_name,
            "notes": (student.notes or "").strip() or None,
        },
        "responsible": ({
            "full_name": resp.full_name, "cpf": resp.cpf, "phone": resp.phone,
            "email": resp.email, "relationship": resp.parentesco,
        } if resp else {}),
    }

    pdf_bytes = build_student_sheet_pdf(data)
    fname = f"Ficha_{student.full_name.replace(' ', '_')}.pdf"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf",
                             headers={"Content-Disposition": f'inline; filename="{fname}"'})
