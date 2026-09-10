from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import FileResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.student import Student, Responsible
from app.utils.permissions import require_permission
from app.utils.uploads import validate_and_save
from app.utils.security import client_ip
from app.utils.audit import log_audit
from app.utils.paths import get_upload_path
from app.utils import storage
from urllib.parse import quote
import os, uuid

router = APIRouter()


class ResponsibleSchema(BaseModel):
    full_name: str = ""
    cpf: str = ""
    phone: str = ""
    email: str = ""
    relationship: str = ""


class StudentSchema(BaseModel):
    full_name: str
    cpf: str = ""
    rg: str = ""
    birth_date: Optional[str] = None
    gender: str = ""
    marital_status: str = ""
    phone: str = ""
    whatsapp: str = ""
    email: str = ""
    zip_code: str = ""
    street: str = ""
    number: str = ""
    neighborhood: str = ""
    city: str = ""
    state: str = ""
    english_level: str = ""
    enrollment_date: Optional[str] = None
    status: str = "active"
    notes: str = ""
    unit: str = "Matriz"
    monthly_fee: Optional[float] = None
    due_day: Optional[int] = None
    first_installment_month: str = "next"
    responsible: Optional[ResponsibleSchema] = None


async def _save_upload(file: UploadFile, student_id: int, category: str, db: AsyncSession) -> dict:
    filename, content = await validate_and_save(file)
    ref = storage.save_bytes(storage.BUCKET_STUDENT_FILES, filename, content,
                             content_type=file.content_type or "application/octet-stream")

    from app.models.file_upload import FileUpload
    upload = FileUpload(
        student_id=student_id,
        file_name=file.filename or filename,
        file_type=file.content_type,
        file_path=ref,
        file_size=len(content),
        category=category
    )
    db.add(upload)
    return {"file_name": file.filename, "file_path": ref}


def _file_to_dict(f) -> dict:
    return {
        "id": f.id, "file_name": f.file_name, "file_type": f.file_type,
        "file_path": f"/api/students/{f.student_id}/files/{f.id}/download",
        "category": f.category,
        "created_at": f.created_at.isoformat() if f.created_at else None,
    }


def _resolve_file_path(f) -> str:
    """Resolve o caminho físico local. Para refs Supabase devolve vazio
    (o arquivo não existe em disco; deve ser lido via storage)."""
    if f.file_path and storage.is_supabase_ref(f.file_path):
        return ""
    if f.file_path and f.file_path.startswith("private:"):
        from app.utils.paths import get_student_files_dir
        name = f.file_path[len("private:"):]
        return os.path.join(get_student_files_dir(), os.path.basename(name))
    return get_upload_path(f.file_path or "")


def _student_to_dict(s: Student) -> dict:
    return {
        "id": s.id, "full_name": s.full_name, "cpf": s.cpf, "rg": s.rg,
        "birth_date": s.birth_date.isoformat() if s.birth_date else None,
        "gender": s.gender,
        "marital_status": s.marital_status,
        "phone": s.phone, "whatsapp": s.whatsapp, "email": s.email,
        "zip_code": s.zip_code, "street": s.street, "number": s.number,
        "neighborhood": s.neighborhood, "city": s.city, "state": s.state,
        "english_level": s.english_level,
        "enrollment_date": s.enrollment_date.isoformat() if s.enrollment_date else None,
        "status": s.status or "active",
        "notes": s.notes, "unit": s.unit, "photo_url": s.photo_url,
        "monthly_fee": s.monthly_fee, "due_day": s.due_day,
        "created_at": s.created_at.isoformat() if s.created_at else None
    }


@router.get("")
async def list_students(
    skip: int = 0, limit: int = 50, search: str = "",
    status: str = "", current_user=Depends(require_permission("students")),
    db: AsyncSession = Depends(get_db)
):
    q = select(Student)
    if search:
        from sqlalchemy import or_
        q = q.where(or_(
            Student.full_name.ilike(f"%{search}%"),
            Student.cpf.ilike(f"%{search}%"),
            Student.email.ilike(f"%{search}%"),
            Student.phone.ilike(f"%{search}%"),
        ))
    if status:
        q = q.where(Student.status == status)
    q = q.order_by(Student.full_name).offset(skip).limit(limit)
    result = await db.execute(q)
    students = result.scalars().all()

    count_q = select(Student)
    if search:
        from sqlalchemy import or_
        count_q = count_q.where(or_(
            Student.full_name.ilike(f"%{search}%"),
            Student.cpf.ilike(f"%{search}%"),
            Student.email.ilike(f"%{search}%"),
            Student.phone.ilike(f"%{search}%"),
        ))
    if status:
        count_q = count_q.where(Student.status == status)
    from sqlalchemy import func
    count_result = await db.execute(select(func.count()).select_from(count_q.subquery()))
    total = count_result.scalar()

    return {"students": [_student_to_dict(s) for s in students], "total": total}


@router.get("/{student_id}")
async def get_student(student_id: int, current_user=Depends(require_permission("students")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Student).where(Student.id == student_id).options(selectinload(Student.responsible))
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    data = _student_to_dict(student)
    if student.responsible:
        data["responsible"] = {
            "id": student.responsible.id,
            "full_name": student.responsible.full_name,
            "cpf": student.responsible.cpf,
            "phone": student.responsible.phone,
            "email": student.responsible.email,
            "relationship": student.responsible.parentesco
        }
    else:
        data["responsible"] = None
    return data


@router.post("")
async def create_student(
    student_data: StudentSchema,
    request: Request,
    current_user=Depends(require_permission("students")),
    db: AsyncSession = Depends(get_db)
):
    data = student_data.model_dump()
    responsible_data = data.pop("responsible", None)
    first_installment_month = data.pop("first_installment_month", None) or "next"

    if data.get("cpf") == "":
        data["cpf"] = None
    if data.get("birth_date") == "":
        data["birth_date"] = None
    if data.get("enrollment_date") == "":
        data["enrollment_date"] = None

    if data.get("cpf"):
        dup = await db.execute(select(Student).where(Student.cpf == data["cpf"]))
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="CPF já cadastrado para outro aluno")

    student = Student(**{k: v for k, v in data.items() if hasattr(Student, k)})

    from datetime import date
    if data.get("birth_date"):
        student.birth_date = date.fromisoformat(data["birth_date"])
    if data.get("enrollment_date"):
        student.enrollment_date = date.fromisoformat(data["enrollment_date"])

    db.add(student)
    await db.flush()

    if responsible_data and responsible_data.get("full_name"):
        if "relationship" in responsible_data:
            responsible_data["parentesco"] = responsible_data.pop("relationship")
        resp_data = {k: v for k, v in responsible_data.items() if hasattr(Responsible, k)}
        resp = Responsible(student_id=student.id, **resp_data)
        db.add(resp)

    if data.get("monthly_fee"):
        from calendar import monthrange
        from app.models.financial import Installment
        from app.models.settings import SchoolSettings
        settings_result = await db.execute(select(SchoolSettings).limit(1))
        settings = settings_result.scalar_one_or_none()
        due_day = data.get("due_day") or (settings.due_day if settings else None) or 5
        today = date.today()
        year, month = today.year, today.month
        if first_installment_month == "current":
            pass
        else:
            month += 1
            if month > 12:
                month = 1
                year += 1
        last_day = monthrange(year, month)[1]
        db.add(Installment(
            student_id=student.id,
            description=f"Mensalidade {month:02d}/{year}",
            amount=data.get("monthly_fee"),
            due_date=date(year, month, min(int(due_day), last_day)),
            status="pending",
        ))

    await log_audit(db, current_user, "student.create", "student", student.id,
                    details=student.full_name, ip_address=client_ip(request))
    await db.commit()
    await db.refresh(student)
    return {"id": student.id, "message": "Aluno cadastrado com sucesso"}


@router.put("/{student_id}")
async def update_student(
    student_id: int, student_data: StudentSchema,
    request: Request,
    current_user=Depends(require_permission("students")), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Student).where(Student.id == student_id).options(selectinload(Student.responsible))
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    data = student_data.model_dump()
    responsible_data = data.pop("responsible", None)

    if data.get("cpf") == "":
        data["cpf"] = None
    if data.get("birth_date") == "":
        data["birth_date"] = None
    if data.get("enrollment_date") == "":
        data["enrollment_date"] = None

    if data.get("cpf"):
        dup = await db.execute(
            select(Student).where(Student.cpf == data["cpf"], Student.id != student_id)
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="CPF já cadastrado para outro aluno")

    from datetime import date
    for k, v in data.items():
        if hasattr(student, k):
            if k == "birth_date" and v:
                v = date.fromisoformat(v)
            elif k == "enrollment_date" and v:
                v = date.fromisoformat(v)
            setattr(student, k, v)

    if responsible_data:
        if "relationship" in responsible_data:
            responsible_data["parentesco"] = responsible_data.pop("relationship")
        if student.responsible:
            for k, v in responsible_data.items():
                if hasattr(student.responsible, k):
                    setattr(student.responsible, k, v)
        else:
            resp = Responsible(student_id=student.id, **responsible_data)
            db.add(resp)

    await log_audit(db, current_user, "student.update", "student", student_id,
                    details=student.full_name, ip_address=client_ip(request))
    await db.commit()
    return {"message": "Aluno atualizado com sucesso"}


@router.delete("/{student_id}")
async def delete_student(student_id: int, request: Request, current_user=Depends(require_permission("students")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    from sqlalchemy import delete as sa_delete, or_
    from app.models.financial import Carne, Installment, Payment, Discount, FinancialContract
    from app.models.materials import MaterialSale
    from app.models.evaluation import Evaluation
    from app.models.attendance import Attendance
    from app.models.certificate import Certificate
    from app.models.enrollment import Enrollment

    await db.execute(sa_delete(Evaluation).where(Evaluation.student_id == student_id))
    await db.execute(sa_delete(Attendance).where(Attendance.student_id == student_id))
    await db.execute(sa_delete(Certificate).where(Certificate.student_id == student_id))
    await db.execute(sa_delete(Enrollment).where(Enrollment.student_id == student_id))

    carnet_ids = select(Carne.id).where(Carne.student_id == student_id)
    inst_filter = or_(
        Installment.student_id == student_id,
        Installment.carnet_id.in_(carnet_ids)
    )
    inst_ids = select(Installment.id).where(inst_filter)
    await db.execute(sa_delete(Payment).where(Payment.installment_id.in_(inst_ids)))
    await db.execute(sa_delete(Installment).where(inst_filter))
    await db.execute(sa_delete(Carne).where(Carne.student_id == student_id))
    await db.execute(sa_delete(Discount).where(Discount.student_id == student_id))
    await db.execute(sa_delete(MaterialSale).where(MaterialSale.student_id == student_id))
    await db.execute(sa_delete(FinancialContract).where(FinancialContract.student_id == student_id))

    await log_audit(db, current_user, "student.delete", "student", student_id,
                    details=student.full_name, ip_address=client_ip(request))
    await db.delete(student)
    await db.commit()
    return {"message": "Aluno excluído com sucesso"}


@router.post("/{student_id}/upload")
async def upload_file(
    request: Request, student_id: int, file: UploadFile = File(...), category: str = "other",
    current_user=Depends(require_permission("students")), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Student).where(Student.id == student_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    info = await _save_upload(file, student_id, category, db)
    await log_audit(db, current_user, "student.upload", "student", student_id,
                    details=info["file_name"], ip_address=client_ip(request))
    await db.commit()
    return {"message": "Arquivo enviado com sucesso", **info}


@router.get("/{student_id}/files")
async def list_files(student_id: int, current_user=Depends(require_permission("students")), db: AsyncSession = Depends(get_db)):
    from app.models.file_upload import FileUpload
    result = await db.execute(
        select(FileUpload).where(FileUpload.student_id == student_id).order_by(FileUpload.created_at.desc())
    )
    files = result.scalars().all()
    return [_file_to_dict(f) for f in files]


@router.get("/{student_id}/files/{file_id}/download")
async def download_file(student_id: int, file_id: int, current_user=Depends(require_permission("students")), db: AsyncSession = Depends(get_db)):
    from app.models.file_upload import FileUpload
    result = await db.execute(select(FileUpload).where(FileUpload.id == file_id, FileUpload.student_id == student_id))
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    filepath = _resolve_file_path(f)
    filename = f.file_name or os.path.basename(f.file_path or "")
    safe_name = quote(filename)

    is_supabase = bool(f.file_path and storage.is_supabase_ref(f.file_path))
    if is_supabase:
        # Leitura do Supabase Storage — entrega como resposta de download.
        try:
            content = storage.read_bytes(f.file_path)
        except Exception:
            raise HTTPException(status_code=404, detail="Arquivo não encontrado")
        return Response(
            content=content,
            media_type=f.file_type or "application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{safe_name}",
                "X-Content-Type-Options": "nosniff",
            },
        )

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return FileResponse(
        filepath,
        media_type=f.file_type or "application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{safe_name}",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.delete("/{student_id}/files/{file_id}")
async def delete_file(student_id: int, file_id: int, request: Request, current_user=Depends(require_permission("students")), db: AsyncSession = Depends(get_db)):
    from app.models.file_upload import FileUpload
    result = await db.execute(select(FileUpload).where(FileUpload.id == file_id, FileUpload.student_id == student_id))
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    filepath = _resolve_file_path(f)
    if f.file_path and storage.is_supabase_ref(f.file_path):
        storage.delete(f.file_path)
    elif os.path.exists(filepath):
        os.remove(filepath)
    await log_audit(db, current_user, "student.file_delete", "file", file_id,
                    details=f.file_name, ip_address=client_ip(request))
    await db.delete(f)
    await db.commit()
    return {"message": "Arquivo excluído com sucesso"}


@router.get("/{student_id}/carne-pdf")
async def carne_pdf(student_id: int, current_user=Depends(require_permission("students")), db: AsyncSession = Depends(get_db)):
    from fastapi.responses import StreamingResponse
    from app.models.settings import SchoolSettings
    from app.models.financial import Installment
    from app.services.carne_service import build_carne_pdf, MONTHS_PT
    from calendar import monthrange

    result = await db.execute(select(Student).where(Student.id == student_id).options(selectinload(Student.responsible)))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    settings_result = await db.execute(select(SchoolSettings).limit(1))
    settings = settings_result.scalar_one_or_none()

    monthly_fee = student.monthly_fee
    if not monthly_fee:
        inst_result = await db.execute(
            select(Installment).where(Installment.student_id == student_id).order_by(Installment.due_date).limit(1)
        )
        first_inst = inst_result.scalar_one_or_none()
        if first_inst:
            monthly_fee = first_inst.amount
    if not monthly_fee:
        monthly_fee = 0

    due_day = student.due_day or (settings.due_day if settings else 5) or 5

    from datetime import date
    today = date.today()
    year, month = today.year, today.month
    month += 1
    if month > 12:
        month = 1
        year += 1

    parcelas = []
    for i in range(6):
        last_day = monthrange(year, month)[1]
        due_date = date(year, month, min(due_day, last_day))
        parcelas.append({
            "installment_number": i + 1,
            "amount": monthly_fee,
            "discount": 0,
            "due_date": due_date,
            "status": "pending",
            "description": f"Mensalidade {MONTHS_PT[month]}/{year}",
            "carnet_id": 0,
        })
        month += 1
        if month > 12:
            month = 1
            year += 1

    first_due = parcelas[0]["due_date"].isoformat() if parcelas else ""
    last_due = parcelas[-1]["due_date"].isoformat() if parcelas else ""

    carnet = {
        "id": 0,
        "installment_value": monthly_fee,
        "total_value": monthly_fee * len(parcelas),
        "first_due_date": first_due,
        "late_fee_pct": settings.late_fee_pct if settings and hasattr(settings, 'late_fee_pct') and settings.late_fee_pct else 2,
        "interest_daily_pct": settings.interest_daily_pct if settings and hasattr(settings, 'interest_daily_pct') and settings.interest_daily_pct else 0.033,
        "payment_methods": (settings.payment_methods if settings and settings.payment_methods else "PIX,Dinheiro,Cartão"),
    }

    pdf_bytes = build_carne_pdf(carnet, parcelas, student, student.responsible, settings)
    student_name = student.full_name or "aluno"

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=carne_{student_name.replace(' ', '_')}.pdf"}
    )
