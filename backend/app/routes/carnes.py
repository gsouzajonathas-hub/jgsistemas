from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta
from calendar import monthrange
import io, os
from app.database import get_db
from app.models.financial import Carne, Installment, Payment, FinancialContract, FinancialPlan
from app.models.student import Student, Responsible
from app.models.enrollment import Enrollment
from app.models.class_group import ClassGroup
from app.models.course import Course
from app.models.teacher import Teacher
from app.models.settings import SchoolSettings
from app.utils.permissions import require_permission
from app.utils.constants import effective_installment_status
from app.utils.audit import log_audit
from app.utils.security import client_ip

router = APIRouter()


class CarneCreateSchema(BaseModel):
    student_id: int
    enrollment_id: Optional[int] = None
    charge_type: str = "mensalidade"
    description: str = ""
    total_installments: int = 12
    installment_value: float
    discount: float = 0
    late_fee_pct: float = 2.0
    interest_daily_pct: float = 0.033
    first_due_date: str
    interval: str = "monthly"
    payment_methods: str = "PIX,Dinheiro,Cartão"


class PaymentSchema(BaseModel):
    amount: float
    payment_date: str
    payment_method: str
    notes: str = ""


class CarneCustomPdfSchema(BaseModel):
    student_id: int
    installment_ids: list[int]
    segunda_via: bool = False


def _last_day(y, m):
    return monthrange(y, m)[1]


async def _build_course_info(db: AsyncSession, student, contract_override=None):
    enr = (await db.execute(
        select(Enrollment)
        .where(Enrollment.student_id == student.id, Enrollment.status == "active")
        .order_by(Enrollment.created_at.desc()).limit(1)
    )).scalar_one_or_none()
    if not enr:
        return {}
    cg = (await db.execute(
        select(ClassGroup).where(ClassGroup.id == enr.class_group_id))).scalar_one_or_none()
    if not cg:
        return {}
    course = (await db.execute(
        select(Course).where(Course.id == cg.course_id))).scalar_one_or_none()
    teacher = (await db.execute(
        select(Teacher).where(Teacher.id == cg.teacher_id))).scalar_one_or_none()
    schedule = f"{cg.weekdays or ''}"
    if cg.start_time:
        schedule += f" {cg.start_time.strftime('%H:%M')}"
    if cg.end_time:
        schedule += f" às {cg.end_time.strftime('%H:%M')}"
    period = ""
    contract_row = contract_override
    if contract_row:
        if contract_row.start_date and contract_row.end_date:
            period = f"{contract_row.start_date.strftime('%d/%m/%Y')} a {contract_row.end_date.strftime('%d/%m/%Y')}"
    else:
        fc = (await db.execute(
            select(FinancialContract)
            .where(FinancialContract.student_id == student.id)
            .order_by(FinancialContract.id.desc()).limit(1)
        )).scalar_one_or_none()
        if fc:
            contract_row = fc
            if fc.start_date and fc.end_date:
                period = f"{fc.start_date.strftime('%d/%m/%Y')} a {fc.end_date.strftime('%d/%m/%Y')}"
    if not period and enr.enrollment_date:
        period = f"a partir de {enr.enrollment_date.strftime('%d/%m/%Y')}"
    plan_name = ""
    if contract_row:
        plan = (await db.execute(
            select(FinancialPlan).where(FinancialPlan.id == contract_row.plan_id))).scalar_one_or_none()
        plan_name = plan.name if plan else ""
    return {
        "course": course.name if course else "",
        "level": cg.level or (course.level if course else ""),
        "group": cg.name,
        "teacher": teacher.full_name if teacher else "",
        "schedule": schedule.strip(),
        "unit": cg.unit or "",
        "period": period,
        "plan": plan_name,
        "duration_hours": course.duration_hours if course else 0,
    }



@router.get("")
async def list_carnets(
    search: str = "", status: str = "", month: str = "",
    student_id: int = None, course_id: int = None,
    skip: int = 0, limit: int = 50,
    current_user=Depends(require_permission("financial")), db: AsyncSession = Depends(get_db)
):
    today = date.today()
    q = select(Carne).options(selectinload(Carne.student))
    if student_id:
        q = q.where(Carne.student_id == student_id)
    if status:
        q = q.where(Carne.status == status)
    if search:
        q = q.join(Student, Carne.student_id == Student.id).where(
            or_(
                Student.full_name.ilike(f"%{search}%"),
                Student.cpf.ilike(f"%{search}%"),
            )
        )
    q = q.order_by(Carne.created_at.desc())
    result = await db.execute(q)
    carnets = result.scalars().all()

    if course_id:
        enrollment_ids = []
        enr_r = await db.execute(
            select(Enrollment.id).join(ClassGroup, Enrollment.class_group_id == ClassGroup.id)
            .where(ClassGroup.course_id == course_id, Enrollment.status == "active")
        )
        enrollment_ids = enr_r.scalars().all()
        student_ids_in_course = set()
        for eid in enrollment_ids:
            enr = await db.execute(select(Enrollment).where(Enrollment.id == eid))
            e = enr.scalar_one_or_none()
            if e:
                student_ids_in_course.add(e.student_id)
        carnets = [c for c in carnets if c.student_id in student_ids_in_course]

    carnet_ids = [c.id for c in carnets]
    all_installments = {}
    if carnet_ids:
        inst_result = await db.execute(
            select(Installment).where(Installment.carnet_id.in_(carnet_ids)).order_by(Installment.installment_number)
        )
        for inst in inst_result.scalars().all():
            all_installments.setdefault(inst.carnet_id, []).append(inst)

    out = []
    for c in carnets:
        installments = all_installments.get(c.id, [])
        for inst in installments:
            eff = effective_installment_status(inst, today)
            if inst.status != eff:
                inst.status = eff
        total_amount = sum(i.amount for i in installments)
        total_paid = sum(i.amount for i in installments if i.status == "paid")
        total_overdue = sum(i.amount for i in installments if i.status == "overdue")
        total_pending = sum(i.amount for i in installments if i.status == "pending")
        paid_count = sum(1 for i in installments if i.status == "paid")
        overdue_count = sum(1 for i in installments if i.status == "overdue")
        pending_count = sum(1 for i in installments if i.status == "pending")

        if month:
            y, m = int(month[:4]), int(month[5:7])
            installments = [i for i in installments
                           if (i.due_date and i.due_date.month == m and i.due_date.year == y)
                           or (i.status == "overdue")]
            total_amount = sum(i.amount for i in installments)
            total_paid = sum(i.amount for i in installments if i.status == "paid")
            total_overdue = sum(i.amount for i in installments if i.status == "overdue")
            total_pending = sum(i.amount for i in installments if i.status == "pending")
            paid_count = sum(1 for i in installments if i.status == "paid")
            overdue_count = sum(1 for i in installments if i.status == "overdue")
            pending_count = sum(1 for i in installments if i.status == "pending")

        out.append({
            "id": c.id,
            "student_id": c.student_id,
            "student_name": c.student.full_name if c.student else "",
            "student_cpf": c.student.cpf if c.student else "",
            "enrollment_id": c.enrollment_id,
            "charge_type": c.charge_type,
            "description": c.description or f"Carnê {c.charge_type}",
            "total_installments": c.total_installments,
            "installment_value": c.installment_value,
            "discount": c.discount,
            "first_due_date": c.first_due_date.isoformat(),
            "interval": c.interval,
            "status": c.status,
            "total_amount": total_amount,
            "total_paid": total_paid,
            "total_overdue": total_overdue,
            "total_pending": total_pending,
            "paid_count": paid_count,
            "overdue_count": overdue_count,
            "pending_count": pending_count,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })

    if status == "active":
        out = [o for o in out if o["pending_count"] + o["overdue_count"] > 0]
    if status == "paid":
        out = [o for o in out if o["paid_count"] == o["total_installments"]]
    if status == "overdue":
        out = [o for o in out if o["overdue_count"] > 0]

    total = len(out)
    items = out[skip:skip + limit] if limit else out
    await db.commit()
    return {"carnets": items, "total": total}


@router.get("/stats")
async def carnet_stats(month: str = "", current_user=Depends(require_permission("financial")), db: AsyncSession = Depends(get_db)):
    today = date.today()
    if not month:
        month = f"{today.year:04d}-{today.month:02d}"

    result = await db.execute(
        select(Carne).where(Carne.status == "active").options(selectinload(Carne.installment_list))
    )
    carnets = result.scalars().unique().all()

    total_carnets = len(carnets)
    total_to_receive = 0.0
    total_received = 0.0
    total_open = 0.0
    total_overdue = 0.0

    for c in carnets:
        for inst in c.installment_list:
            eff = effective_installment_status(inst, today)
            total_to_receive += float(inst.amount or 0)
            if eff == "paid":
                total_received += float(inst.amount or 0)
            elif eff == "overdue":
                total_overdue += float(inst.amount or 0)
            elif eff == "pending":
                total_open += float(inst.amount or 0)

    return {
        "total_carnets": total_carnets,
        "total_to_receive": total_to_receive,
        "total_received": total_received,
        "total_open": total_open,
        "total_overdue": total_overdue,
    }


@router.get("/{carnet_id}/pdf")
async def carnet_pdf(carnet_id: int, current_user=Depends(require_permission("financial")), db: AsyncSession = Depends(get_db)):
    from app.services.carne_service import build_carne_pdf

    result = await db.execute(
        select(Carne).where(Carne.id == carnet_id).options(
            selectinload(Carne.student),
            selectinload(Carne.installment_list)
        )
    )
    carnet = result.scalar_one_or_none()
    if not carnet:
        raise HTTPException(status_code=404, detail="Carnê não encontrado")

    student = carnet.student
    responsible = None
    if student:
        resp_r = await db.execute(select(Responsible).where(Responsible.student_id == student.id))
        responsible = resp_r.scalar_one_or_none()

    settings_result = await db.execute(select(SchoolSettings).limit(1))
    settings = settings_result.scalar_one_or_none()

    today = date.today()
    installments_sorted = sorted(carnet.installment_list, key=lambda i: i.installment_number or 0)

    inst_data = []
    for inst in installments_sorted:
        eff_status = effective_installment_status(inst, today)

        inst_data.append({
            "id": inst.id,
            "installment_number": inst.installment_number,
            "description": inst.description,
            "amount": inst.amount,
            "discount": inst.discount or 0,
            "due_date": inst.due_date.isoformat() if inst.due_date else "",
            "paid_date": inst.paid_date.isoformat() if inst.paid_date else None,
            "status": eff_status,
        })

    first_inst = installments_sorted[0] if installments_sorted else None
    carnet_dict = {
        "id": carnet.id,
        "charge_type": carnet.charge_type,
        "interval": carnet.interval,
        "payment_methods": carnet.payment_methods,
        "installment_value": float(carnet.installment_value or (first_inst.amount if first_inst else 0)),
        "total_value": sum(float(i.amount or 0) - float(i.discount or 0) for i in installments_sorted),
        "first_due_date": carnet.first_due_date.isoformat(),
        "late_fee_pct": carnet.late_fee_pct,
        "interest_daily_pct": carnet.interest_daily_pct,
    }

    course_info = await _build_course_info(db, student)

    contract_info = None
    fc = (await db.execute(
        select(FinancialContract)
        .where(FinancialContract.student_id == student.id)
        .order_by(FinancialContract.id.desc()).limit(1)
    )).scalar_one_or_none()
    if fc:
        contract_info = {
            "gross_total": float(fc.gross_total or 0),
            "discount_amount": float(fc.discount_amount or 0),
            "final_value": float(fc.final_value or 0),
            "total_due": float(fc.total_due or 0),
            "installments_count": int(fc.installments_count or 0),
            "monthly_value": float(fc.monthly_value or 0),
        }

    pdf_bytes = build_carne_pdf(carnet_dict, inst_data, student, responsible, settings,
                                course_info=course_info, contract_info=contract_info)
    student_name = student.full_name if student else "aluno"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=carne_{student_name.replace(' ', '_')}.pdf"}
    )


@router.get("/{carnet_id}")
async def get_carnet(carnet_id: int, current_user=Depends(require_permission("financial")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Carne).where(Carne.id == carnet_id).options(
            selectinload(Carne.student),
            selectinload(Carne.installment_list)
        )
    )
    carnet = result.scalar_one_or_none()
    if not carnet:
        raise HTTPException(status_code=404, detail="Carnê não encontrado")

    today = date.today()
    installments = sorted(carnet.installment_list, key=lambda i: i.installment_number or 0)

    enrollments = []
    enr_r = await db.execute(
        select(Enrollment).where(Enrollment.student_id == carnet.student_id, Enrollment.status == "active")
        .options(selectinload(Enrollment.class_group).selectinload(ClassGroup.course))
    )
    for e in enr_r.scalars().all():
        enrollments.append({
            "id": e.id,
            "class_name": e.class_group.name if e.class_group else "",
            "course_name": e.class_group.course.name if e.class_group and e.class_group.course else "",
        })

    inst_data = []
    for inst in installments:
        eff = effective_installment_status(inst, today)
        if inst.status != eff:
            inst.status = eff
        payment = None
        if inst.status == "paid":
            pay_r = await db.execute(
                select(Payment).where(Payment.installment_id == inst.id).order_by(Payment.id.desc()).limit(1)
            )
            payment = pay_r.scalar_one_or_none()
        inst_data.append({
            "id": inst.id,
            "installment_number": inst.installment_number,
            "description": inst.description,
            "amount": inst.amount,
            "discount": inst.discount or 0,
            "late_fee": inst.late_fee or 0,
            "interest": inst.interest or 0,
            "total_paid": inst.total_paid or 0,
            "due_date": inst.due_date.isoformat(),
            "paid_date": inst.paid_date.isoformat() if inst.paid_date else None,
            "status": eff,
            "payment_method": inst.payment_method,
            "receipt_number": payment.receipt_number if payment else None,
            "payment_id": payment.id if payment else None,
        })

    total_paid_amount = sum(i["amount"] for i in inst_data if i["status"] == "paid")
    total_open_amount = sum(i["amount"] for i in inst_data if i["status"] != "paid" and i["status"] != "cancelled")

    await db.commit()
    return {
        "id": carnet.id,
        "student_id": carnet.student_id,
        "student_name": carnet.student.full_name if carnet.student else "",
        "student_cpf": carnet.student.cpf if carnet.student else "",
        "enrollment_id": carnet.enrollment_id,
        "enrollments": enrollments,
        "charge_type": carnet.charge_type,
        "description": carnet.description,
        "total_installments": carnet.total_installments,
        "installment_value": carnet.installment_value,
        "discount": carnet.discount,
        "late_fee_pct": carnet.late_fee_pct,
        "interest_daily_pct": carnet.interest_daily_pct,
        "first_due_date": carnet.first_due_date.isoformat(),
        "interval": carnet.interval,
        "payment_methods": carnet.payment_methods,
        "status": carnet.status,
        "notes": carnet.notes,
        "total_amount": sum(i["amount"] for i in inst_data),
        "total_paid": total_paid_amount,
        "total_open": total_open_amount,
        "installments": inst_data,
        "created_at": carnet.created_at.isoformat() if carnet.created_at else None,
    }


@router.post("")
async def create_carnet(data: CarneCreateSchema, current_user=Depends(require_permission("financial")), db: AsyncSession = Depends(get_db)):
    from datetime import date as date_cls
    parts = data.first_due_date.split("-")
    first_due = date_cls(int(parts[0]), int(parts[1]), int(parts[2]))

    carnet = Carne(
        student_id=data.student_id,
        enrollment_id=data.enrollment_id,
        charge_type=data.charge_type,
        description=data.description,
        total_installments=data.total_installments,
        installment_value=data.installment_value,
        discount=data.discount,
        late_fee_pct=data.late_fee_pct,
        interest_daily_pct=data.interest_daily_pct,
        first_due_date=first_due,
        interval=data.interval,
        payment_methods=data.payment_methods,
        status="active",
    )
    db.add(carnet)
    await db.flush()

    year, month = first_due.year, first_due.month
    day = first_due.day

    for i in range(1, data.total_installments + 1):
        last_day = _last_day(year, month)
        due = date_cls(year, month, min(day, last_day))
        inst = Installment(
            student_id=data.student_id,
            carnet_id=carnet.id,
            installment_number=i,
            description=f"Parcela {i}/{data.total_installments}",
            amount=data.installment_value,
            discount=data.discount,
            due_date=due,
            status="pending",
        )
        db.add(inst)
        month += 1
        if month > 12:
            month = 1
            year += 1

    await db.commit()
    return {"id": carnet.id, "message": "Carnê criado com sucesso"}


@router.post("/{carnet_id}/payments/{installment_id}")
async def register_payment(
    carnet_id: int, installment_id: int,
    data: PaymentSchema,
    current_user=Depends(require_permission("financial")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Installment).where(Installment.id == installment_id, Installment.carnet_id == carnet_id)
    )
    installment = result.scalar_one_or_none()
    if not installment:
        raise HTTPException(status_code=404, detail="Parcela não encontrada")
    if installment.status == "paid":
        raise HTTPException(status_code=400, detail="Esta parcela já está paga")
    if installment.status == "cancelled":
        raise HTTPException(status_code=400, detail="Esta parcela está cancelada")

    pay_date = date.fromisoformat(data.payment_date) if data.payment_date else date.today()
    late_fee = 0.0
    interest = 0.0

    if pay_date > installment.due_date:
        days_late = (pay_date - installment.due_date).days
        carnet_r = await db.execute(select(Carne).where(Carne.id == carnet_id))
        carnet = carnet_r.scalar_one_or_none()
        if carnet:
            late_fee = installment.amount * (carnet.late_fee_pct / 100)
            interest = installment.amount * (carnet.interest_daily_pct / 100) * days_late

    installment.status = "paid"
    installment.paid_date = pay_date
    installment.payment_method = data.payment_method
    installment.late_fee = late_fee
    installment.interest = interest
    installment.total_paid = data.amount

    payment = Payment(
        installment_id=installment_id,
        amount=data.amount,
        payment_date=pay_date,
        payment_method=data.payment_method,
        notes=data.notes,
    )
    db.add(payment)
    await db.flush()

    count = (await db.execute(
        select(func.count()).select_from(Payment).where(Payment.payment_date >= date(pay_date.year, 1, 1))
    )).scalar() or 0
    payment.receipt_number = f"REC-{pay_date.year}-{count:05d}"

    all_r = await db.execute(
        select(Installment).where(Installment.carnet_id == carnet_id)
    )
    all_insts = all_r.scalars().all()
    if all(i.status == "paid" for i in all_insts):
        carnet_up = await db.execute(select(Carne).where(Carne.id == carnet_id))
        carnet_obj = carnet_up.scalar_one_or_none()
        if carnet_obj:
            carnet_obj.status = "completed"

    await db.commit()
    return {
        "message": "Pagamento registrado com sucesso",
        "payment_id": payment.id,
        "receipt_number": payment.receipt_number,
        "late_fee": late_fee,
        "interest": interest,
    }


@router.post("/{carnet_id}/cancel")
async def cancel_carnet(
    carnet_id: int,
    current_user=Depends(require_permission("financial")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Carne).where(Carne.id == carnet_id))
    carnet = result.scalar_one_or_none()
    if not carnet:
        raise HTTPException(status_code=404, detail="Carnê não encontrado")

    inst_r = await db.execute(
        select(Installment).where(Installment.carnet_id == carnet_id, Installment.status != "paid")
    )
    for inst in inst_r.scalars().all():
        inst.status = "cancelled"

    carnet.status = "cancelled"
    await db.commit()
    return {"message": "Carnê cancelado"}


@router.post("/custom-pdf")
async def custom_carne_pdf(data: CarneCustomPdfSchema, request: Request,
                           current_user=Depends(require_permission("financial")),
                           db: AsyncSession = Depends(get_db)):
    from app.services.carne_service import build_carne_pdf_custom

    ids = list(dict.fromkeys(data.installment_ids))
    if not ids:
        raise HTTPException(status_code=400, detail="Nenhuma parcela selecionada")

    result = await db.execute(select(Student).where(Student.id == data.student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    inst_result = await db.execute(select(Installment).where(Installment.id.in_(ids)))
    installments = inst_result.scalars().all()
    if len(installments) != len(ids):
        raise HTTPException(status_code=400, detail="Parcelas inválidas")
    for inst in installments:
        if inst.student_id != data.student_id:
            raise HTTPException(status_code=400, detail="Parcela não pertence ao aluno informado")

    today = date.today()
    installments.sort(key=lambda i: (i.due_date or date.max, i.installment_number or 0))

    responsible = (await db.execute(
        select(Responsible).where(Responsible.student_id == student.id))).scalar_one_or_none()
    settings = (await db.execute(select(SchoolSettings).limit(1))).scalar_one_or_none()

    contract_row = None
    contract_info = None
    contract_id = next((i.contract_id for i in installments if i.contract_id), None)
    if contract_id:
        contract_row = (await db.execute(
            select(FinancialContract).where(FinancialContract.id == contract_id))).scalar_one_or_none()
        if contract_row:
            contract_info = {
                "gross_total": float(contract_row.gross_total or 0),
                "discount_amount": float(contract_row.discount_amount or 0),
                "final_value": float(contract_row.final_value or 0),
                "total_due": float(contract_row.total_due or 0),
                "installments_count": int(contract_row.installments_count or 0),
                "monthly_value": float(contract_row.monthly_value or 0),
            }

    course_info = await _build_course_info(db, student, contract_override=contract_row)

    fee_map = {}
    carnet_ids = {i.carnet_id for i in installments if i.carnet_id}
    if carnet_ids:
        fee_rows = await db.execute(select(Carne).where(Carne.id.in_(carnet_ids)))
        for cn in fee_rows.scalars().all():
            fee_map[cn.id] = cn

    first_carnet = next((fee_map[i.carnet_id] for i in installments if i.carnet_id in fee_map), None)
    charge_type = first_carnet.charge_type if first_carnet else "mensalidade"
    interval = first_carnet.interval if first_carnet else ""

    inst_data = []
    for inst in installments:
        eff_status = effective_installment_status(inst, today)
        cn = fee_map.get(inst.carnet_id) if inst.carnet_id else None
        inst_data.append({
            "id": inst.id,
            "carnet_id": inst.carnet_id,
            "contract_id": inst.contract_id,
            "installment_number": inst.installment_number,
            "description": inst.description,
            "amount": float(inst.amount or 0),
            "discount": float(inst.discount or 0),
            "late_fee_pct": float(cn.late_fee_pct) if cn and cn.late_fee_pct is not None else 2.0,
            "interest_daily_pct": float(cn.interest_daily_pct) if cn and cn.interest_daily_pct is not None else 0.033,
            "payment_methods": cn.payment_methods if cn else "",
            "due_date": inst.due_date.isoformat() if inst.due_date else "",
            "paid_date": inst.paid_date.isoformat() if inst.paid_date else None,
            "status": eff_status,
        })

    pdf_bytes = build_carne_pdf_custom(
        inst_data, student, responsible, settings,
        course_info=course_info, contract_info=contract_info,
        segunda_via=data.segunda_via,
        charge_type=charge_type, interval=interval)

    await log_audit(db, current_user, "carne.custom_pdf", "student", student.id,
                    details=f"parcelas={len(ids)};2via={data.segunda_via}",
                    ip_address=client_ip(request))
    await db.commit()

    filename = f"carne_{student.full_name.replace(' ', '_')}{'_2via' if data.segunda_via else ''}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename={filename}'}
    )


@router.get("/student/{student_id}/installments")
async def student_installments(student_id: int, current_user=Depends(require_permission("financial")), db: AsyncSession = Depends(get_db)):
    today = date.today()
    q = select(Installment).where(Installment.student_id == student_id).order_by(Installment.due_date)
    result = await db.execute(q)
    installments = result.scalars().all()
    out = []
    for i in installments:
        eff = effective_installment_status(i, today)
        if i.status != eff:
            i.status = eff
        out.append({
            "id": i.id, "carnet_id": i.carnet_id,
            "installment_number": i.installment_number,
            "description": i.description, "amount": i.amount,
            "due_date": i.due_date.isoformat(),
            "paid_date": i.paid_date.isoformat() if i.paid_date else None,
            "status": eff, "payment_method": i.payment_method,
        })
    await db.commit()
    return out
