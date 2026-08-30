from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from datetime import date
from app.database import get_db
from app.models.certificate import Certificate
from app.models.student import Student
from app.models.enrollment import Enrollment
from app.models.class_group import ClassGroup
from app.models.teacher import Teacher
from app.models.course import Course
from app.models.settings import SchoolSettings
from app.utils.auth import get_current_user, require_role
from app.routes.boletins import get_boletim
from app.utils.security import client_ip
from app.utils.audit import log_audit

router = APIRouter()


class CertificateSchema(BaseModel):
    student_id: int
    class_group_id: int
    level: str = ""


def _next_level(current: str) -> str:
    normalized = (current or "").lower()
    if "básico" in normalized or "basico" in normalized:
        return "Intermediário"
    if "intermediário" in normalized or "intermediario" in normalized:
        return "Avançado"
    if "avançado" in normalized or "avancado" in normalized:
        return "Avançado"
    return current


@router.get("")
async def list_certificates(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Certificate).order_by(Certificate.issue_date.desc()))
    certs = result.scalars().all()

    student_ids = {c.student_id for c in certs}
    students = {}
    if student_ids:
        r = await db.execute(select(Student).where(Student.id.in_(student_ids)))
        students = {s.id: s.full_name for s in r.scalars().all()}

    return [{
        "id": c.id, "student_id": c.student_id,
        "student_name": students.get(c.student_id, ""),
        "class_group_id": c.class_group_id,
        "level": c.level, "course_name": c.course_name or "",
        "teacher_name": c.teacher_name or "",
        "media": c.media, "frequency": c.frequency,
        "workload_hours": c.workload_hours,
        "control_number": c.control_number,
        "issue_date": c.issue_date.isoformat() if c.issue_date else None
    } for c in certs]


@router.get("/student/{student_id}")
async def list_student_certificates(student_id: int, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Certificate).where(Certificate.student_id == student_id).order_by(Certificate.issue_date.desc())
    )
    return [{
        "id": c.id, "class_group_id": c.class_group_id,
        "level": c.level, "course_name": c.course_name or "",
        "teacher_name": c.teacher_name or "",
        "media": c.media, "frequency": c.frequency,
        "workload_hours": c.workload_hours,
        "control_number": c.control_number,
        "issue_date": c.issue_date.isoformat() if c.issue_date else None
    } for c in result.scalars().all()]


@router.post("")
async def issue_certificate(data: CertificateSchema, request: Request, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    boletim = await get_boletim(data.student_id, current_user, db)
    if not isinstance(boletim, dict) or "classes" not in boletim:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    block = next((b for b in boletim["classes"] if b["class_group_id"] == data.class_group_id), None)
    if not block:
        raise HTTPException(status_code=400, detail="Matrícula não encontrada para esta turma")

    if block["certificate"]:
        raise HTTPException(status_code=400, detail="Certificado já emitido para esta turma")

    if not block["eligible"]:
        raise HTTPException(status_code=400,
            detail="Aluno não atende aos critérios: média ≥ 70% e frequência ≥ 75%")

    student = boletim["student"]
    level = data.level or block["level"] or student["english_level"] or ""

    year = date.today().year
    count = await db.execute(
        select(func.count()).select_from(Certificate).where(
            func.extract('year', Certificate.issue_date) == year
        )
    )
    control_number = f"CERT-{year}-{(count.scalar() or 0) + 1:04d}"

    certificate = Certificate(
        student_id=data.student_id,
        class_group_id=data.class_group_id,
        level=level,
        course_name=block["course_name"],
        teacher_name=block["teacher_name"],
        media=block["average"],
        frequency=block["frequency"],
        workload_hours=block["workload_hours"],
        control_number=control_number,
        issue_date=date.today()
    )
    db.add(certificate)

    student_row = await db.execute(select(Student).where(Student.id == data.student_id))
    student_row = student_row.scalar_one_or_none()
    if student_row:
        next_level = _next_level(student_row.english_level or level)
        if next_level and student_row.english_level != next_level:
            student_row.english_level = next_level

    enrollment = await db.execute(
        select(Enrollment).where(
            Enrollment.student_id == data.student_id,
            Enrollment.class_group_id == data.class_group_id,
            Enrollment.status == "active"
        ).limit(1)
    )
    enrollment = enrollment.scalar_one_or_none()
    if enrollment:
        enrollment.status = "completed"

    await log_audit(db, current_user, "certificate.issue", "certificate", certificate.id,
                    details=f"student={data.student_id} level={level} control={control_number}",
                    ip_address=client_ip(request))
    await db.commit()
    await db.refresh(certificate)
    return {
        "id": certificate.id,
        "control_number": certificate.control_number,
        "issue_date": certificate.issue_date.isoformat(),
        "level": certificate.level,
        "media": certificate.media,
        "frequency": certificate.frequency,
        "message": "Certificado emitido com sucesso"
    }


@router.get("/{certificate_id}/pdf")
async def certificate_pdf(certificate_id: int, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageTemplate, Frame
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_CENTER
    from fastapi.responses import StreamingResponse
    from PIL import Image as PILImage
    import io, os

    result = await db.execute(select(Certificate).where(Certificate.id == certificate_id))
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificado não encontrado")

    student_result = await db.execute(select(Student).where(Student.id == cert.student_id))
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    settings_result = await db.execute(select(SchoolSettings).limit(1))
    settings = settings_result.scalar_one_or_none()

    stream = io.BytesIO()
    navy = colors.HexColor("#1E3A8A")
    border_color = navy
    ink = colors.HexColor("#0F172A")
    muted = colors.HexColor("#475569")
    faint = colors.HexColor("#94A3B8")

    size = landscape(A4)

    def draw_border(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(border_color)
        canvas.setLineWidth(3)
        canvas.rect(20, 20, doc.pagesize[0] - 40, doc.pagesize[1] - 40)
        canvas.setLineWidth(0.75)
        canvas.rect(28, 28, doc.pagesize[0] - 56, doc.pagesize[1] - 56)
        canvas.restoreState()

    doc = SimpleDocTemplate(stream, pagesize=size,
        topMargin=80, bottomMargin=80, leftMargin=100, rightMargin=100)
    doc.addPageTemplates([PageTemplate(id='certificate',
        frames=[Frame(100, 80, size[0] - 200, size[1] - 160, id='frame')],
        onPage=draw_border)])
    center = ParagraphStyle("Center", alignment=TA_CENTER)

    school = settings.school_name if settings and settings.school_name else "Escola de Inglês"
    cnpj = settings.cnpj if settings and settings.cnpj else ""

    elements = []

    logo_flowable = None
    if settings and settings.logo_url:
        from app.utils.paths import get_upload_path
        logo_path = get_upload_path(settings.logo_url)
        if os.path.exists(logo_path):
            try:
                pil = PILImage.open(logo_path).convert("RGB")
                pil.thumbnail((110, 110))
                img_buf = io.BytesIO()
                pil.save(img_buf, format="PNG")
                img_buf.seek(0)
                logo_flowable = Image(img_buf, width=pil.width, height=pil.height)
                logo_flowable.hAlign = 'CENTER'
            except Exception:
                pass

    if logo_flowable is not None:
        elements.append(logo_flowable)
        elements.append(Spacer(1, 8))

    school_style = ParagraphStyle("School", parent=center, fontSize=22, textColor=border_color, fontName='Helvetica-Bold', spaceAfter=4)
    elements.append(Paragraph(school, school_style))
    if cnpj:
        cnpj_style = ParagraphStyle("Cnpj", parent=center, fontSize=9, textColor=faint, spaceAfter=6)
        elements.append(Paragraph(f"CNPJ: {cnpj}", cnpj_style))

    elements.append(Spacer(1, 20))

    cert_style = ParagraphStyle("CertTitle", parent=center, fontSize=30, textColor=ink, fontName='Helvetica-Bold', spaceAfter=4)
    elements.append(Paragraph("CERTIFICADO", cert_style))
    sub_style = ParagraphStyle("Sub", parent=center, fontSize=12, textColor=colors.HexColor("#64748B"), letterSpacing=3, spaceAfter=20)
    elements.append(Paragraph("DE CONCLUSÃO DE NÍVEL", sub_style))

    text_style = ParagraphStyle("Text", parent=center, fontSize=13, leading=22, textColor=colors.HexColor("#334155"), leftIndent=50, rightIndent=50)
    elements.append(Paragraph(
        "Certificamos que <b>{name}</b> concluiu com êxito o nível <b>{level}</b> "
        "do curso de <b>{course}</b>, na escola <b>{school}</b>, com média de <b>{media}%</b> "
        "e frequência de <b>{frequency}%</b>, totalizando <b>{hours} horas</b> de carga horária.".format(
            name=student.full_name, level=cert.level, course=cert.course_name or "",
            school=school, media=f"{cert.media:.1f}".replace(".", ","),
            frequency=f"{cert.frequency:.1f}".replace(".", ","), hours=cert.workload_hours or 0
        ),
        text_style
    ))
    elements.append(Spacer(1, 16))

    teacher = cert.teacher_name or ""
    if teacher:
        teacher_style = ParagraphStyle("Teacher", parent=center, fontSize=12, textColor=muted)
        elements.append(Paragraph(f"Professor(a): <b>{teacher}</b>", teacher_style))
        elements.append(Spacer(1, 10))

    date_str = cert.issue_date.strftime("%d/%m/%Y") if cert.issue_date else ""
    date_style = ParagraphStyle("Date", parent=center, fontSize=12, textColor=muted)
    elements.append(Paragraph(f"Emitido em <b>{date_str}</b>", date_style))
    elements.append(Spacer(1, 6))

    control_style = ParagraphStyle("Control", parent=center, fontSize=10, textColor=faint)
    elements.append(Paragraph(f"Registro nº {cert.control_number}", control_style))
    elements.append(Spacer(1, 36))

    signatures = [["", "", ""],
                  ["Coordenador(a) Acadêmico(a)", "Direção Geral", "Professor(a)"]]
    sig_table = Table(signatures, colWidths=[220, 220, 220], hAlign='CENTER')
    sig_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 0.75, colors.HexColor("#64748B")),
        ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor("#475569")),
        ('FONTSIZE', (0, 1), (-1, 1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(sig_table)

    doc.build(elements)
    stream.seek(0)
    return StreamingResponse(stream, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=certificado.pdf"})
