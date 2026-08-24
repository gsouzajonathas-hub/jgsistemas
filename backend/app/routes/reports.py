from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.student import Student
from app.models.enrollment import Enrollment
from app.models.class_group import ClassGroup
from app.models.financial import Installment, Payment
from app.utils.auth import get_current_user
from datetime import date, timedelta

router = APIRouter()


@router.get("/dashboard")
async def dashboard(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    import asyncio
    today = date.today()
    week_later = today + timedelta(days=7)

    total_students_r, active_enrollments_r, inactive_students_r, overdue_r, \
        due_soon_r, birthdays_r, \
        recent_students_r, monthly_income_r, total_expected_r, total_received_r = await asyncio.gather(
        db.execute(select(func.count()).select_from(Student)),
        db.execute(select(func.count()).select_from(Enrollment).where(Enrollment.status == "active")),
        db.execute(select(func.count()).select_from(Student).where(Student.status == "inactive")),
        db.execute(select(func.count()).select_from(Installment).where(Installment.status == "overdue")),
        db.execute(select(func.count()).select_from(Installment).where(
            Installment.status == "pending",
            Installment.due_date <= week_later,
            Installment.due_date >= today)),
        db.execute(select(Student).where(
            func.extract('month', Student.birth_date) == today.month,
            Student.status == "active")),
        db.execute(select(Student).order_by(Student.created_at.desc()).limit(5)),
        db.execute(select(func.sum(Payment.amount)).where(
            func.extract('month', Payment.payment_date) == today.month,
            func.extract('year', Payment.payment_date) == today.year)),
        db.execute(select(func.sum(Installment.amount)).where(Installment.status != "cancelled")),
        db.execute(select(func.sum(Installment.amount)).where(Installment.status == "paid")),
    )

    return {
        "total_students": total_students_r.scalar() or 0,
        "active_enrollments": active_enrollments_r.scalar() or 0,
        "inactive_students": inactive_students_r.scalar() or 0,
        "overdue_count": overdue_r.scalar() or 0,
        "due_soon_count": due_soon_r.scalar() or 0,
        "birthdays": [{"id": s.id, "full_name": s.full_name,
                       "birth_date": s.birth_date.isoformat() if s.birth_date else ""} for s in birthdays_r.scalars().all()],
        "recent_students": [{"id": s.id, "full_name": s.full_name, "photo_url": s.photo_url,
                             "created_at": s.created_at.isoformat() if s.created_at else None}
                            for s in recent_students_r.scalars().all()],
        "monthly_income": monthly_income_r.scalar() or 0,
        "total_expected": total_expected_r.scalar() or 0,
        "total_received": total_received_r.scalar() or 0,
    }


@router.get("/active-students")
async def active_students(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.status == "active").order_by(Student.full_name))
    students = result.scalars().all()
    return [{
        "id": s.id, "full_name": s.full_name, "cpf": s.cpf or "",
        "phone": s.phone or "", "email": s.email or "",
        "city": s.city or "", "english_level": s.english_level or "",
        "birth_date": s.birth_date.isoformat() if s.birth_date else "",
        "status": s.status or ""
    } for s in students]


@router.get("/inactive-students")
async def inactive_students(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.status != "active").order_by(Student.full_name))
    students = result.scalars().all()
    return [{
        "id": s.id, "full_name": s.full_name, "cpf": s.cpf or "",
        "phone": s.phone or "", "email": s.email or "",
        "city": s.city or "", "english_level": s.english_level or "",
        "birth_date": s.birth_date.isoformat() if s.birth_date else "",
        "status": s.status or ""
    } for s in students]


@router.get("/overdue")
async def overdue_report(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Installment).where(Installment.status == "overdue").order_by(Installment.due_date)
    )
    installments = result.scalars().all()

    student_ids = list({i.student_id for i in installments})
    students = {}
    if student_ids:
        r = await db.execute(select(Student).where(Student.id.in_(student_ids)))
        students = {s.id: s for s in r.scalars().all()}

    items = [{
        "id": i.id, "student_id": i.student_id,
        "student_name": students.get(i.student_id, type('', (), {'full_name': ''})()).full_name if i.student_id in students else "",
        "description": i.description or "",
        "amount": i.amount,
        "due_date": i.due_date.isoformat() if i.due_date else "",
        "status": i.status or "overdue",
        "payment_method": i.payment_method or ""
    } for i in installments]
    items.sort(key=lambda x: x["student_name"].lower())
    return items


@router.get("/enrollments")
async def enrollments_report(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enrollment).order_by(Enrollment.created_at.desc()))
    enrollments = result.scalars().all()

    student_ids = list({e.student_id for e in enrollments})
    class_ids = list({e.class_group_id for e in enrollments})
    student_map, class_map = {}, {}
    if student_ids:
        r = await db.execute(select(Student).where(Student.id.in_(student_ids)))
        student_map = {s.id: s.full_name for s in r.scalars().all()}
    if class_ids:
        r = await db.execute(select(ClassGroup).where(ClassGroup.id.in_(class_ids)))
        class_map = {c.id: c.name for c in r.scalars().all()}

    status_labels = {"active": "Ativa", "cancelled": "Cancelada", "completed": "Concluída", "transferred": "Transferida"}
    items = [{
        "id": e.id, "student_name": student_map.get(e.student_id, ""),
        "class_name": class_map.get(e.class_group_id, ""),
        "enrollment_date": e.enrollment_date.isoformat() if e.enrollment_date else "",
        "status": status_labels.get(e.status or "", e.status or ""),
        "notes": e.notes or ""
    } for e in enrollments]
    items.sort(key=lambda x: x["student_name"].lower())
    return items


@router.get("/financial")
async def financial_report(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    total_expected = await db.execute(
        select(func.sum(Installment.amount)).where(Installment.status != "cancelled")
    )
    total_received = await db.execute(
        select(func.sum(Installment.amount)).where(Installment.status == "paid")
    )
    total_overdue = await db.execute(
        select(func.sum(Installment.amount)).where(Installment.status == "overdue")
    )
    count_pending = await db.execute(
        select(func.count()).select_from(Installment).where(Installment.status == "pending")
    )
    count_overdue = await db.execute(
        select(func.count()).select_from(Installment).where(Installment.status == "overdue")
    )
    count_paid = await db.execute(
        select(func.count()).select_from(Installment).where(Installment.status == "paid")
    )

    today = date.today()
    monthly_income = await db.execute(
        select(func.sum(Payment.amount)).where(
            func.extract('month', Payment.payment_date) == today.month,
            func.extract('year', Payment.payment_date) == today.year
        )
    )

    return {
        "total_expected": total_expected.scalar() or 0,
        "total_received": total_received.scalar() or 0,
        "total_overdue": total_overdue.scalar() or 0,
        "count_pending": count_pending.scalar() or 0,
        "count_overdue": count_overdue.scalar() or 0,
        "count_paid": count_paid.scalar() or 0,
        "monthly_income": monthly_income.scalar() or 0
    }


@router.get("/students-excel")
async def students_excel(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    import openpyxl
    from fastapi.responses import StreamingResponse
    import io

    result = await db.execute(select(Student).where(Student.status == "active").order_by(Student.full_name))
    students = result.scalars().all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Alunos Ativos"
    headers = ["Nº", "Nome", "CPF", "Telefone", "Email", "Cidade", "Nivel"]
    ws.append(headers)
    for n, s in enumerate(students, start=1):
        ws.append([n, s.full_name, s.cpf, s.phone, s.email, s.city, s.english_level or ""])

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return StreamingResponse(stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=alunos_ativos.xlsx"})


@router.get("/students-pdf")
async def students_pdf(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageTemplate, Frame
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT
    from fastapi.responses import StreamingResponse
    from app.models.settings import SchoolSettings
    from datetime import date
    import io

    result = await db.execute(select(Student).where(Student.status == "active").order_by(Student.full_name))
    students = result.scalars().all()

    settings_r = await db.execute(select(SchoolSettings).limit(1))
    settings = settings_r.scalar_one_or_none()
    school_name = settings.school_name if settings else "Escola"
    school_cnpj = settings.cnpj if settings and settings.cnpj else ""
    today_str = date.today().strftime("%d/%m/%Y")

    NAVY_900 = "#022344"
    RED_600 = "#CA2122"
    SLATE_50 = "#F8FAFC"
    SLATE_200 = "#E2E8F0"

    from app.services.report_style import draw_report_header, draw_report_footer

    def _on_page(canvas_obj, doc):
        w, h = doc.pagesize
        draw_report_header(canvas_obj, w, h, settings, "Relatório de Alunos Ativos")
        draw_report_footer(canvas_obj, w, h, settings,
                           f"Emitido em {today_str}",
                           f"{school_name}  |  Total: {len(students)} aluno(s)")

    stream = io.BytesIO()
    doc = SimpleDocTemplate(stream, pagesize=A4, topMargin=65, bottomMargin=40, leftMargin=30, rightMargin=30)
    doc.addPageTemplates([
        PageTemplate(id='main', frames=[Frame(30, 40, A4[0] - 60, A4[1] - 105, id='frame')], onPage=_on_page)
    ])

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("RTitle", parent=styles['Normal'], fontSize=15, fontName='Helvetica-Bold',
        alignment=TA_CENTER, textColor=colors.HexColor(NAVY_900), spaceAfter=4)
    subtitle_style = ParagraphStyle("RSub", parent=styles['Normal'], fontSize=9, alignment=TA_CENTER,
        textColor=colors.HexColor(SLATE_500), spaceAfter=16)
    cell_style = ParagraphStyle("RCell", parent=styles['Normal'], fontSize=8, leading=10)
    hdr_style = ParagraphStyle("RHdr", parent=styles['Normal'], fontSize=8, fontName='Helvetica-Bold',
        textColor=colors.white, leading=10)
    hdr_center = ParagraphStyle("RHdrC", parent=hdr_style, alignment=TA_CENTER)
    cell_center = ParagraphStyle("RCC", parent=cell_style, alignment=TA_CENTER)

    elements = []
    elements.append(Paragraph("RELATÓRIO DE ALUNOS ATIVOS", title_style))
    elements.append(Paragraph(f"Gerado em <b>{today_str}</b>  |  Total: <b>{len(students)}</b> aluno(s) ativo(s)", subtitle_style))

    header_row = [
        Paragraph("#", hdr_center),
        Paragraph("Nome", hdr_style),
        Paragraph("CPF", hdr_center),
        Paragraph("Telefone", hdr_center),
        Paragraph("Email", hdr_style),
        Paragraph("Nível", hdr_center),
    ]
    data = [header_row]
    for n, s in enumerate(students, start=1):
        data.append([
            Paragraph(str(n), cell_center),
            Paragraph(s.full_name or "", cell_style),
            Paragraph(s.cpf or "—", cell_center),
            Paragraph(s.phone or "—", cell_center),
            Paragraph(s.email or "—", cell_style),
            Paragraph(s.english_level or "—", cell_center),
        ])

    t = Table(data, colWidths=[25, 160, 90, 80, 140, 70])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(NAVY_900)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor(SLATE_200)),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor(SLATE_200)),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor(SLATE_50)]),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, colors.HexColor(RED_600)),
    ]))
    elements.append(t)

    doc.build(elements)
    stream.seek(0)
    return StreamingResponse(stream, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=alunos_ativos.pdf"})


@router.get("/overdue-excel")
async def overdue_excel(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    import openpyxl
    from fastapi.responses import StreamingResponse
    import io

    result = await db.execute(select(Installment).where(Installment.status == "overdue").order_by(Installment.due_date))
    installments = result.scalars().all()

    student_ids = list({i.student_id for i in installments})
    students = {}
    if student_ids:
        r = await db.execute(select(Student).where(Student.id.in_(student_ids)))
        students = {s.id: s.full_name for s in r.scalars().all()}
    installments.sort(key=lambda i: students.get(i.student_id, "").lower())

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Inadimplentes"
    headers = ["Nº", "Aluno", "Descrição", "Valor", "Vencimento", "Status"]
    ws.append(headers)
    for n, i in enumerate(installments, start=1):
        ws.append([n, students.get(i.student_id, ""), i.description or "", i.amount,
                   i.due_date.strftime("%d/%m/%Y") if i.due_date else "", i.status or ""])

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return StreamingResponse(stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=inadimplentes.xlsx"})


@router.get("/overdue-pdf")
async def overdue_pdf(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageTemplate, Frame
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT
    from fastapi.responses import StreamingResponse
    from app.models.settings import SchoolSettings
    from datetime import date
    import io

    result = await db.execute(select(Installment).where(Installment.status == "overdue").order_by(Installment.due_date))
    installments = result.scalars().all()

    student_ids = list({i.student_id for i in installments})
    students = {}
    if student_ids:
        r = await db.execute(select(Student).where(Student.id.in_(student_ids)))
        students = {s.id: s.full_name for s in r.scalars().all()}
    installments.sort(key=lambda i: students.get(i.student_id, "").lower())

    settings_r = await db.execute(select(SchoolSettings).limit(1))
    settings = settings_r.scalar_one_or_none()
    school_name = settings.school_name if settings else "Escola"
    school_cnpj = settings.cnpj if settings and settings.cnpj else ""
    today_str = date.today().strftime("%d/%m/%Y")

    total_overdue = sum(i.amount for i in installments)

    RED_600 = "#CA2122"
    RED_700 = "#A81B1C"
    RED_50 = "#FDECEC"
    SLATE_50 = "#F8FAFC"
    SLATE_200 = "#E2E8F0"

    from app.services.report_style import draw_report_header, draw_report_footer

    def _on_page(canvas_obj, doc):
        w, h = doc.pagesize
        draw_report_header(canvas_obj, w, h, settings, "Relatório de Inadimplentes")
        draw_report_footer(canvas_obj, w, h, settings,
                           f"Emitido em {today_str}",
                           f"{school_name}  |  Total: {len(installments)} parcela(s) em atraso")

    stream = io.BytesIO()
    doc = SimpleDocTemplate(stream, pagesize=A4, topMargin=65, bottomMargin=40, leftMargin=30, rightMargin=30)
    doc.addPageTemplates([
        PageTemplate(id='main', frames=[Frame(30, 40, A4[0] - 60, A4[1] - 105, id='frame')], onPage=_on_page)
    ])

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("RTitle", parent=styles['Normal'], fontSize=15, fontName='Helvetica-Bold',
        alignment=TA_CENTER, textColor=colors.HexColor(RED_600), spaceAfter=4)
    subtitle_style = ParagraphStyle("RSub", parent=styles['Normal'], fontSize=9, alignment=TA_CENTER,
        textColor=colors.HexColor(SLATE_500), spaceAfter=16)
    cell_style = ParagraphStyle("RCell", parent=styles['Normal'], fontSize=8, leading=10)
    hdr_style = ParagraphStyle("RHdr", parent=styles['Normal'], fontSize=8, fontName='Helvetica-Bold',
        textColor=colors.white, leading=10)
    hdr_center = ParagraphStyle("RHdrC", parent=hdr_style, alignment=TA_CENTER)
    hdr_right = ParagraphStyle("RHdrR", parent=hdr_style, alignment=TA_RIGHT)
    cell_center = ParagraphStyle("RCC", parent=cell_style, alignment=TA_CENTER)
    cell_right = ParagraphStyle("RCR", parent=cell_style, alignment=TA_RIGHT)
    total_style = ParagraphStyle("RTotal", parent=styles['Normal'], fontSize=11, fontName='Helvetica-Bold',
        alignment=TA_RIGHT, textColor=colors.HexColor(RED_600), spaceBefore=10)

    def _brl(valor):
        return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    elements = []
    elements.append(Paragraph("RELATÓRIO DE INADIMPLÊNCIA", title_style))
    elements.append(Paragraph(
        f"Gerado em <b>{today_str}</b>  |  <b>{len(installments)}</b> parcela(s) em atraso  |  Total: <b>{_brl(total_overdue)}</b>",
        subtitle_style
    ))

    header_row = [
        Paragraph("#", hdr_center),
        Paragraph("Aluno", hdr_style),
        Paragraph("Descrição", hdr_style),
        Paragraph("Valor (R$)", hdr_right),
        Paragraph("Vencimento", hdr_center),
        Paragraph("Dias em atraso", hdr_center),
    ]
    data = [header_row]
    today = date.today()
    for n, i in enumerate(installments, start=1):
        student_name = students.get(i.student_id, "—")
        days_overdue = (today - i.due_date).days if i.due_date else 0
        data.append([
            Paragraph(str(n), cell_center),
            Paragraph(student_name, cell_style),
            Paragraph(i.description or "—", cell_style),
            Paragraph(_brl(i.amount), cell_right),
            Paragraph(i.due_date.strftime("%d/%m/%Y") if i.due_date else "—", cell_center),
            Paragraph(f"{days_overdue} dia(s)", cell_center),
        ])

    t = Table(data, colWidths=[25, 130, 130, 80, 75, 75])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(RED_600)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor(SLATE_200)),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor(SLATE_200)),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor(RED_50)]),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, colors.HexColor(RED_600)),
    ]))
    elements.append(t)

    elements.append(Paragraph(f"TOTAL EM ATRASO:  {_brl(total_overdue)}", total_style))

    doc.build(elements)
    stream.seek(0)
    return StreamingResponse(stream, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=inadimplentes.pdf"})
