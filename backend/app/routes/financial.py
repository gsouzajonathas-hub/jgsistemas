from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, update
import asyncio
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime, timezone
from calendar import monthrange
import io
from app.database import get_db
from app.models.financial import FinancialPlan, FinancialContract, Installment, Payment, Discount
from app.models.student import Student
from app.models.settings import SchoolSettings
from app.utils.auth import get_current_user, require_role
from app.utils.constants import effective_installment_status
from app.services.receipt_service import build_receipt_pdf

router = APIRouter()


def _last_day_of_month(year: int, month: int) -> int:
    return monthrange(year, month)[1]



class PlanSchema(BaseModel):
    name: str
    value: float
    description: str = ""
    installments: int = 1
    course_id: Optional[int] = None
    duration_months: int = 1
    discount_type: str = "percent"
    discount_value: float = 0
    upfront_discount_pct: float = 0


class ContractSchema(BaseModel):
    student_id: int
    start_date: str
    first_due_date: str
    mode: str = "installments"
    installments_count: Optional[int] = None
    guardian_name: str = ""
    guardian_cpf: str = ""
    guardian_phone: str = ""
    guardian_email: str = ""


class InstallmentSchema(BaseModel):
    student_id: int
    plan_id: Optional[int] = None
    description: str
    amount: float
    due_date: str
    payment_method: str = ""
    notes: str = ""


class PaymentSchema(BaseModel):
    installment_id: int
    amount: float
    payment_date: str
    payment_method: str
    notes: str = ""


class GenerateMonthSchema(BaseModel):
    month: str


class DiscountSchema(BaseModel):
    student_id: int
    name: str
    percentage: float = 0
    amount: float = 0
    reason: str = ""
    valid_until: Optional[str] = None


def _add_months(d: date, k: int) -> date:
    m = d.month - 1 + k
    y = d.year + m // 12
    m = m % 12 + 1
    return date(y, m, min(d.day, _last_day_of_month(y, m)))


def _plan_calc(p) -> dict:
    months = max(1, int(p.duration_months or 1))
    monthly = float(p.value or 0)
    gross = round(monthly * months, 2)
    dv = float(p.discount_value or 0)
    if (p.discount_type or "percent") == "percent":
        discount = round(gross * min(max(dv, 0), 100) / 100, 2)
    else:
        discount = round(min(max(dv, 0), gross), 2)
    final = round(gross - discount, 2)
    upfront_pct = float(p.upfront_discount_pct or 0)
    upfront_disc = round(final * min(max(upfront_pct, 0), 100) / 100, 2)
    max_inst = int(p.installments or months) or months
    return {
        "duration_months": months,
        "monthly_value": monthly,
        "gross_total": gross,
        "discount_type": p.discount_type or "percent",
        "discount_value": dv,
        "discount_amount": discount,
        "final_value": final,
        "upfront_discount_pct": upfront_pct,
        "upfront_value": round(final - upfront_disc, 2),
        "default_installments": max(1, min(max_inst, months)),
    }


def _plan_dict(p, course_name: str = "") -> dict:
    d = {
        "id": p.id, "name": p.name, "value": p.value, "description": p.description,
        "installments": p.installments, "is_active": p.is_active,
        "course_id": p.course_id, "course_name": course_name,
    }
    d.update(_plan_calc(p))
    return d


@router.get("/plans")
async def list_plans(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models.course import Course
    result = await db.execute(select(FinancialPlan).order_by(FinancialPlan.name))
    plans = result.scalars().all()
    course_ids = {p.course_id for p in plans if p.course_id}
    courses = {}
    if course_ids:
        r = await db.execute(select(Course).where(Course.id.in_(course_ids)))
        courses = {c.id: c.name for c in r.scalars().all()}
    return [_plan_dict(p, courses.get(p.course_id, "")) for p in plans]


@router.post("/plans")
async def create_plan(data: PlanSchema, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    if data.duration_months < 1:
        raise HTTPException(status_code=400, detail="Duração deve ser de pelo menos 1 mês")
    if data.installments < 1:
        raise HTTPException(status_code=400, detail="Quantidade de parcelas deve ser pelo menos 1")
    plan = FinancialPlan(**data.model_dump())
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return {"id": plan.id, "message": "Plano criado com sucesso"}


@router.put("/plans/{plan_id}")
async def update_plan(plan_id: int, data: PlanSchema, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FinancialPlan).where(FinancialPlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    for k, v in data.model_dump().items():
        setattr(plan, k, v)
    await db.commit()
    return {"message": "Plano atualizado com sucesso"}


@router.delete("/plans/{plan_id}")
async def delete_plan(plan_id: int, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FinancialPlan).where(FinancialPlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    used = (await db.execute(
        select(func.count()).select_from(Installment).where(Installment.plan_id == plan_id)
    )).scalar() or 0
    if used > 0:
        raise HTTPException(status_code=400,
                            detail=f"Plano possui {used} parcela(s) vinculada(s). Desative-o em vez de excluir.")
    await db.delete(plan)
    await db.commit()
    return {"message": "Plano excluído com sucesso"}


@router.post("/plans/{plan_id}/toggle")
async def toggle_plan(plan_id: int, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    from app.utils.audit import log_audit
    result = await db.execute(select(FinancialPlan).where(FinancialPlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    plan.is_active = 0 if plan.is_active else 1
    await log_audit(db, current_user, "plan.toggle", "financial_plan", plan.id,
                    f"{plan.name} -> {'ativo' if plan.is_active else 'inativo'}")
    await db.commit()
    return {"is_active": plan.is_active, "message": f"Plano {'ativado' if plan.is_active else 'desativado'}"}


@router.post("/plans/{plan_id}/contract")
async def contract_plan(plan_id: int, data: ContractSchema, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    from app.utils.audit import log_audit
    stu_r = await db.execute(select(Student).where(Student.id == data.student_id))
    student = stu_r.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    plan_r = await db.execute(select(FinancialPlan).where(FinancialPlan.id == plan_id))
    plan = plan_r.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    if not plan.is_active:
        raise HTTPException(status_code=400, detail="Plano está inativo")

    calc = _plan_calc(plan)

    if data.mode == "upfront":
        total = calc["upfront_value"]
        n = 1
        amounts = [total]
    elif data.mode == "installments":
        n = data.installments_count or calc["default_installments"]
        if n < 1 or n > 24:
            raise HTTPException(status_code=400, detail="Quantidade de parcelas deve estar entre 1 e 24")
        base = round(calc["final_value"] / n, 2)
        amounts = [base] * n
        amounts[-1] = round(calc["final_value"] - base * (n - 1), 2)
        total = calc["final_value"]
    else:
        raise HTTPException(status_code=400, detail="Modo inválido. Use 'installments' ou 'upfront'")

    try:
        first_due = date.fromisoformat(data.first_due_date)
        start = date.fromisoformat(data.start_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Datas devem estar no formato AAAA-MM-DD")

    end_date = _add_months(start, calc["duration_months"]) if calc["duration_months"] > 0 else start
    contract_row = FinancialContract(
        student_id=data.student_id,
        plan_id=plan.id,
        start_date=start,
        end_date=end_date,
        mode=data.mode,
        installments_count=n,
        monthly_value=calc["monthly_value"],
        gross_total=calc["gross_total"],
        discount_type=calc["discount_type"],
        discount_value=calc["discount_value"],
        discount_amount=calc["discount_amount"],
        final_value=calc["final_value"],
        upfront_discount_amount=round(calc["final_value"] - total, 2) if data.mode == "upfront" else 0,
        total_due=round(sum(amounts), 2),
        guardian_name=data.guardian_name or None,
        guardian_cpf=data.guardian_cpf or None,
        guardian_phone=data.guardian_phone or None,
        guardian_email=data.guardian_email or None,
        notes=f"Início do curso: {start.isoformat()}",
    )
    db.add(contract_row)
    await db.flush()

    created = []
    for i, amount in enumerate(amounts, start=1):
        due = _add_months(first_due, i - 1)
        desc = f"{plan.name} — Pagamento único" if data.mode == "upfront" else f"{plan.name} — Parcela {i}/{n}"
        inst = Installment(
            student_id=data.student_id,
            plan_id=plan.id,
            contract_id=contract_row.id,
            installment_number=i,
            description=desc,
            amount=amount,
            due_date=due,
            status="pending",
            notes=f"Início do curso: {start.isoformat()}",
        )
        db.add(inst)
        created.append({"number": i, "due_date": due.isoformat(), "amount": amount})

    await log_audit(db, current_user, "plan.contract", "financial_contract", contract_row.id,
                    f"{student.full_name} | {plan.name} | {'à vista' if data.mode == 'upfront' else f'{n}x'} | R$ {total:.2f}")
    await db.commit()

    return {
        "message": f"Contrato realizado: {len(created)} parcela(s) gerada(s)",
        "contract_id": contract_row.id,
        "gross_total": calc["gross_total"],
        "discount_amount": calc["discount_amount"],
        "contract_value": calc["final_value"],
        "upfront_discount_amount": round(calc["final_value"] - total, 2) if data.mode == "upfront" else 0,
        "total_due": round(sum(amounts), 2),
        "installment_count": n,
        "start_date": start.isoformat(),
        "end_date": end_date.isoformat(),
        "installments_created": created,
    }


@router.get("/contracts")
async def list_contracts(status: str = "", current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models.course import Course
    q = select(FinancialContract).order_by(FinancialContract.created_at.desc())
    if status:
        q = q.where(FinancialContract.status == status)
    rows = (await db.execute(q)).scalars().all()
    sids = {r.student_id for r in rows}
    pids = {r.plan_id for r in rows}
    students = {}
    if sids:
        r = await db.execute(select(Student).where(Student.id.in_(sids)))
        students = {s.id: s for s in r.scalars().all()}
    plans = {}
    course_ids = set()
    if pids:
        r = await db.execute(select(FinancialPlan).where(FinancialPlan.id.in_(pids)))
        plans = {pl.id: pl for pl in r.scalars().all()}
        course_ids = {pl.course_id for pl in plans.values() if pl.course_id}
    courses = {}
    if course_ids:
        r = await db.execute(select(Course).where(Course.id.in_(course_ids)))
        courses = {c.id: c.name for c in r.scalars().all()}
    out = []
    for ct in rows:
        st = students.get(ct.student_id)
        pl = plans.get(ct.plan_id)
        out.append({
            "id": ct.id, "student_id": ct.student_id,
            "student_name": st.full_name if st else "",
            "plan_name": pl.name if pl else "",
            "course_name": courses.get(pl.course_id, "") if pl else "",
            "start_date": ct.start_date.isoformat(), "end_date": ct.end_date.isoformat(),
            "mode": ct.mode, "installments_count": ct.installments_count,
            "final_value": float(ct.final_value or 0),
            "total_due": float(ct.total_due or 0),
            "status": ct.status, "signed_at": ct.signed_at.isoformat() if ct.signed_at else None,
            "created_at": ct.created_at.isoformat() if ct.created_at else None,
        })
    return out


@router.post("/contracts/{contract_id}/sign")
async def sign_contract(contract_id: int, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    from app.utils.audit import log_audit
    ct = (await db.execute(select(FinancialContract).where(FinancialContract.id == contract_id))).scalar_one_or_none()
    if not ct:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    ct.status = "signed"
    ct.signed_at = datetime.now(timezone.utc)
    await log_audit(db, current_user, "contract.sign", "financial_contract", ct.id, f"Contrato #{ct.id} assinado")
    await db.commit()
    return {"message": "Contrato assinado", "status": ct.status}


@router.post("/contracts/{contract_id}/cancel")
async def cancel_contract(contract_id: int, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    from app.utils.audit import log_audit
    ct = (await db.execute(select(FinancialContract).where(FinancialContract.id == contract_id))).scalar_one_or_none()
    if not ct:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    ct.status = "cancelled"
    await log_audit(db, current_user, "contract.cancel", "financial_contract", ct.id, f"Contrato #{ct.id} cancelado")
    await db.commit()
    return {"message": "Contrato cancelado", "status": ct.status}


def _contract_duration(ct: FinancialContract) -> int:
    days = (ct.end_date - ct.start_date).days
    return max(1, round(days / 30.44))


@router.get("/contracts/{contract_id}/pdf")
async def contract_pdf(contract_id: int, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.services.contract_service import build_contract_pdf
    from app.models.settings import SchoolSettings
    from app.services.receipt_service import _school_logo

    ct = (await db.execute(select(FinancialContract).where(FinancialContract.id == contract_id))).scalar_one_or_none()
    if not ct:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    stu = (await db.execute(select(Student).where(Student.id == ct.student_id))).scalar_one_or_none()
    plan = (await db.execute(select(FinancialPlan).where(FinancialPlan.id == ct.plan_id))).scalar_one_or_none()

    parcels_q = await db.execute(
        select(Installment).where(Installment.contract_id == ct.id).order_by(Installment.installment_number))
    parcels = [{"number": i.installment_number, "due_date": i.due_date, "amount": float(i.amount)}
               for i in parcels_q.scalars().all()]

    settings = (await db.execute(select(SchoolSettings).order_by(SchoolSettings.id))).scalars().first()
    school_city = ""
    if settings and getattr(settings, "address", ""):
        school_city = [p.strip() for p in str(settings.address).split(",") if p.strip()][-1] if "," in str(settings.address) else ""
    school = {"name": getattr(settings, "school_name", "") or "Escola",
              "cnpj": getattr(settings, "cnpj", ""), "address": getattr(settings, "address", ""),
              "phone": getattr(settings, "phone", ""), "email": getattr(settings, "email", ""),
              "city": school_city, "logo": _school_logo(settings)}

    address_full = ", ".join(p for p in [
        getattr(stu, "street", ""), f"nº {stu.number}" if getattr(stu, "number", None) else "",
        getattr(stu, "neighborhood", ""), getattr(stu, "city", ""), getattr(stu, "state", ""),
        getattr(stu, "zip_code", ""),
    ] if p)

    course_name = ""
    if plan and plan.course_id:
        from app.models.course import Course
        c = (await db.execute(select(Course).where(Course.id == plan.course_id))).scalar_one_or_none()
        course_name = c.name if c else ""

    pdf_bytes = build_contract_pdf({
        "school": school,
        "student": {"name": stu.full_name if stu else "", "cpf": getattr(stu, "cpf", ""),
                    "birth_date": getattr(stu, "birth_date", ""), "phone": getattr(stu, "phone", ""),
                    "email": getattr(stu, "email", ""), "address": address_full},
        "guardian": {"name": ct.guardian_name, "cpf": ct.guardian_cpf,
                     "phone": ct.guardian_phone, "email": ct.guardian_email},
        "course_name": course_name,
        "plan": {"name": plan.name if plan else "", "duration_months": _contract_duration(ct),
                 "monthly_value": float(ct.monthly_value or 0),
                 "gross_total": float(ct.gross_total or 0),
                 "discount_type": ct.discount_type,
                 "discount_value": float(ct.discount_value or 0),
                 "discount_amount": float(ct.discount_amount or 0),
                 "final_value": float(ct.final_value or 0)},
        "contract": {"mode": ct.mode, "installments_count": ct.installments_count,
                     "start_date": ct.start_date, "end_date": ct.end_date,
                     "upfront_discount_amount": float(ct.upfront_discount_amount or 0)},
        "parcels": parcels,
        "contract_number": f"{ct.id}/{ct.created_at.year if ct.created_at else date.today().year}",
    })

    fname = f"Contrato_{(stu.full_name if stu else 'aluno').replace(' ', '_')}_{ct.id}.pdf"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf",
                             headers={"Content-Disposition": f'inline; filename="{fname}"'})


@router.get("/installments")
async def list_installments(student_id: int = None, status: str = "", month: str = "",
                            skip: int = 0, limit: int = 50,
                            current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = date.today()
    q = select(Installment)
    if student_id:
        q = q.where(Installment.student_id == student_id)
    if month:
        y, m = int(month[:4]), int(month[5:7])
        month_start = date(y, m, 1)
        month_end = date(y, m, _last_day_of_month(y, m))
        q = q.where(or_(
            Installment.due_date.between(month_start, month_end),
            and_(Installment.paid_date.is_(None), Installment.due_date < month_start)
        ))
    q = q.order_by(Installment.due_date)
    result = await db.execute(q)
    installments = result.scalars().all()

    pay_result = await db.execute(
        select(Payment).where(Payment.installment_id.in_([i.id for i in installments]))
    )
    payment_map = {p.installment_id: p for p in pay_result.scalars().all()}

    student_ids = list({i.student_id for i in installments})
    student_map = {}
    if student_ids:
        stu_r = await db.execute(select(Student).where(Student.id.in_(student_ids)))
        student_map = {s.id: s.full_name for s in stu_r.scalars().all()}

    out = []
    changed = False
    for i in installments:
        eff = effective_installment_status(i, today)
        if i.status != eff:
            i.status = eff
            changed = True
        if status and eff != status:
            continue
        payment = payment_map.get(i.id)
        out.append({
            "id": i.id, "student_id": i.student_id,
            "student_name": student_map.get(i.student_id, ""),
            "description": i.description,
            "amount": i.amount, "due_date": i.due_date.isoformat(),
            "paid_date": i.paid_date.isoformat() if i.paid_date else None,
            "status": eff,
            "payment_method": i.payment_method, "notes": i.notes,
            "payment_id": payment.id if payment else None,
            "receipt_number": payment.receipt_number if payment else None
        })
    if changed:
        await db.commit()

    total = len(out)
    items = out[skip:skip + limit] if limit else out
    return {"installments": items, "total": total}


@router.post("/generate-month")
async def generate_month(data: GenerateMonthSchema, current_user=Depends(require_role("admin", "secretary")),
                         db: AsyncSession = Depends(get_db)):
    y, m = int(data.month[:4]), int(data.month[5:7])
    last_day = _last_day_of_month(y, m)
    month_start = date(y, m, 1)
    month_end = date(y, m, last_day)

    from app.models.student import Student
    from app.models.settings import SchoolSettings

    students = (await db.execute(
        select(Student).where(
            Student.status == "active",
            Student.monthly_fee.isnot(None),
            Student.monthly_fee > 0
        )
    )).scalars().all()

    existing_ids = set((await db.execute(
        select(Installment.student_id).where(Installment.due_date.between(month_start, month_end))
    )).scalars().all())

    settings = (await db.execute(select(SchoolSettings).limit(1))).scalar_one_or_none()
    default_due_day = settings.due_day if settings and settings.due_day else 5

    created = 0
    for s in students:
        if s.id in existing_ids:
            continue
        due_day = s.due_day or default_due_day
        db.add(Installment(
            student_id=s.id,
            description=f"Mensalidade {m:02d}/{y}",
            amount=s.monthly_fee,
            due_date=date(y, m, min(int(due_day), last_day)),
            status="pending",
        ))
        created += 1
    await db.commit()
    return {"created": created, "month": data.month}


@router.post("/installments")
async def create_installment(data: InstallmentSchema, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    from datetime import date
    d = data.model_dump()
    if d.get("due_date"):
        d["due_date"] = date.fromisoformat(d["due_date"])
    else:
        d["due_date"] = date.today()
    inst = Installment(**d)
    db.add(inst)
    await db.commit()
    return {"id": inst.id, "message": "Mensalidade criada com sucesso"}


@router.post("/payments")
async def register_payment(data: PaymentSchema, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Installment).where(Installment.id == data.installment_id))
    installment = result.scalar_one_or_none()
    if not installment:
        raise HTTPException(status_code=404, detail="Mensalidade não encontrada")
    if installment.status == "paid":
        raise HTTPException(status_code=400, detail="Esta mensalidade já está paga")
    if installment.status == "cancelled":
        raise HTTPException(status_code=400, detail="Esta mensalidade está cancelada")

    pay_date = date.fromisoformat(data.payment_date) if data.payment_date else date.today()
    installment.status = "paid"
    installment.paid_date = pay_date
    installment.payment_method = data.payment_method

    payment = Payment(
        installment_id=data.installment_id,
        amount=data.amount,
        payment_date=pay_date,
        payment_method=data.payment_method,
        notes=data.notes
    )
    db.add(payment)
    await db.flush()

    count = (await db.execute(
        select(func.count()).select_from(Payment).where(Payment.payment_date >= date(pay_date.year, 1, 1))
    )).scalar() or 0
    payment.receipt_number = f"REC-{pay_date.year}-{count:05d}"

    await db.commit()
    return {
        "message": "Pagamento registrado com sucesso",
        "payment_id": payment.id,
        "receipt_number": payment.receipt_number
    }


@router.get("/payments/{payment_id}/receipt")
async def payment_receipt(payment_id: int, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")

    inst_result = await db.execute(select(Installment).where(Installment.id == payment.installment_id))
    installment = inst_result.scalar_one_or_none()
    if not installment:
        raise HTTPException(status_code=404, detail="Mensalidade não encontrada")

    stu_result = await db.execute(select(Student).where(Student.id == installment.student_id))
    student = stu_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    settings_result = await db.execute(select(SchoolSettings).limit(1))
    settings = settings_result.scalar_one_or_none()

    pdf = build_receipt_pdf(payment, installment, student, settings)
    receipt_number = payment.receipt_number or f"REC-{payment.id:06d}"
    return StreamingResponse(
        io.BytesIO(pdf),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="recibo-{receipt_number}.pdf"',
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.get("/dashboard")
async def financial_dashboard(month: str = "", current_user=Depends(get_current_user),
                              db: AsyncSession = Depends(get_db)):
    today = date.today()
    if not month:
        month = f"{today.year:04d}-{today.month:02d}"
    y, m = int(month[:4]), int(month[5:7])
    month_start = date(y, m, 1)
    month_end = date(y, m, _last_day_of_month(y, m))

    await db.execute(
        update(Installment)
        .where(
            Installment.status == "pending",
            Installment.due_date < today,
            Installment.paid_date.is_(None)
        )
        .values(status="overdue")
    )
    await db.commit()

    total_revenue_r, total_received_r, total_to_due_r, total_overdue_r, \
        total_expected_r, count_paid_r, count_pending_r, count_overdue_r = await asyncio.gather(
        db.execute(select(func.sum(Payment.amount))),
        db.execute(select(func.sum(Installment.amount)).where(
            Installment.paid_date >= month_start, Installment.paid_date <= month_end)),
        db.execute(select(func.sum(Installment.amount)).where(
            Installment.status == "pending",
            Installment.due_date >= month_start,
            Installment.due_date <= month_end,
            Installment.due_date >= today)),
        db.execute(select(func.sum(Installment.amount)).where(Installment.status == "overdue")),
        db.execute(select(func.sum(Installment.amount)).where(
            Installment.status != "cancelled",
            Installment.due_date >= month_start,
            Installment.due_date <= month_end)),
        db.execute(select(func.count()).select_from(Installment).where(
            Installment.paid_date >= month_start, Installment.paid_date <= month_end)),
        db.execute(select(func.count()).select_from(Installment).where(
            Installment.status == "pending",
            Installment.due_date >= month_start,
            Installment.due_date <= month_end)),
        db.execute(select(func.count()).select_from(Installment).where(Installment.status == "overdue")),
    )

    return {
        "month": month,
        "total_revenue": total_revenue_r.scalar() or 0,
        "total_received": total_received_r.scalar() or 0,
        "total_to_due": total_to_due_r.scalar() or 0,
        "total_overdue": total_overdue_r.scalar() or 0,
        "total_expected": total_expected_r.scalar() or 0,
        "count_pending": count_pending_r.scalar() or 0,
        "count_overdue": count_overdue_r.scalar() or 0,
        "count_paid": count_paid_r.scalar() or 0
    }


@router.post("/discounts")
async def create_discount(data: DiscountSchema, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    d = data.model_dump()
    if d.get("valid_until"):
        d["valid_until"] = date.fromisoformat(d["valid_until"])
    discount = Discount(**d)
    db.add(discount)
    await db.commit()
    return {"id": discount.id, "message": "Desconto registrado"}
