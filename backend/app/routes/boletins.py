from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.student import Student
from app.models.enrollment import Enrollment
from app.models.class_group import ClassGroup
from app.models.teacher import Teacher
from app.models.course import Course
from app.models.attendance import Attendance
from app.models.evaluation import Evaluation
from app.models.certificate import Certificate
from app.models.settings import SchoolSettings
from app.utils.permissions import require_permission
from datetime import date

router = APIRouter()


def _fmt_date(value) -> str:
    if not value:
        return ""
    s = str(value)[:10]
    if len(s) == 10 and s[4] == "-" and s[7] == "-":
        return f"{s[8:10]}-{s[5:7]}-{s[0:4]}"
    return s


def _weighted_average(evals) -> float:
    if not evals:
        return 0
    total_weight = sum(e.weight for e in evals)
    if total_weight == 0:
        total_weight = 1
    return round(
        sum((e.score / e.max_score if e.max_score else 0) * e.weight for e in evals)
        / total_weight * 100, 2
    )


def _grade_status(avg: float, has_evals: bool) -> str:
    if not has_evals:
        return "Sem avaliações"
    if avg >= 70:
        return "Aprovado"
    if avg >= 50:
        return "Recuperação"
    return "Reprovado"


def _final_situation(avg: float, freq: float, has_evals: bool) -> str:
    if not has_evals:
        return "Sem avaliações"
    if avg >= 70 and freq >= 75:
        return "Aprovado"
    if avg >= 70:
        return "Reprovado por Frequência"
    if avg >= 50:
        return "Recuperação"
    return "Reprovado"


def _certificate_dict(cert):
    if not cert:
        return None
    return {
        "id": cert.id,
        "control_number": cert.control_number,
        "issue_date": cert.issue_date.isoformat() if cert.issue_date else None
    }


async def _student_class_block(student_id: int, cg, db: AsyncSession, course_info=None, teacher_name: str = "", cert=None, student_level: str = ""):
    course_name, course_level, duration = course_info or ("", "", 0)

    evals_result = await db.execute(
        select(Evaluation).where(
            Evaluation.student_id == student_id,
            Evaluation.class_group_id == cg.id
        ).order_by(Evaluation.date)
    )
    evals = evals_result.scalars().all()

    present = await db.execute(
        select(func.count()).select_from(Attendance).where(
            Attendance.student_id == student_id,
            Attendance.class_group_id == cg.id,
            Attendance.status == "present"
        )
    )
    absent = await db.execute(
        select(func.count()).select_from(Attendance).where(
            Attendance.student_id == student_id,
            Attendance.class_group_id == cg.id,
            Attendance.status == "absent"
        )
    )
    p = present.scalar() or 0
    a = absent.scalar() or 0
    total = p + a
    freq = round((p / total) * 100, 1) if total else 0

    avg = _weighted_average(evals)
    has_evals = len(evals) > 0
    level = cg.level or course_level or student_level or ""

    return {
        "class_group_id": cg.id,
        "class_name": cg.name,
        "course_name": course_name,
        "teacher_name": teacher_name,
        "level": level,
        "weekdays": cg.weekdays or "",
        "start_time": str(cg.start_time) if cg.start_time else "",
        "end_time": str(cg.end_time) if cg.end_time else "",
        "workload_hours": duration or 0,
        "evaluations": [{
            "id": ev.id, "eval_type": ev.eval_type or "",
            "title": ev.title, "date": ev.date.isoformat() if ev.date else None,
            "score": ev.score, "max_score": ev.max_score, "weight": ev.weight
        } for ev in evals],
        "average": avg,
        "status_by_grade": _grade_status(avg, has_evals),
        "present": p, "absent": a, "frequency": freq,
        "situation": _final_situation(avg, freq, has_evals),
        "eligible": has_evals and avg >= 70 and freq >= 75,
        "certificate": _certificate_dict(cert),
    }


@router.get("/students")
async def list_students(current_user=Depends(require_permission("boletins")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).order_by(Student.full_name))
    students = result.scalars().all()
    return [{
        "id": s.id, "full_name": s.full_name, "english_level": s.english_level or "",
        "status": s.status or ""
    } for s in students]


@router.get("/{student_id}")
async def get_boletim(student_id: int, current_user=Depends(require_permission("boletins")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    enrollments = await db.execute(
        select(Enrollment).where(
            Enrollment.student_id == student_id,
            Enrollment.status.in_(["active", "completed"])
        ).order_by(Enrollment.enrollment_date.desc())
    )
    enrollments = enrollments.scalars().all()

    class_ids = list({e.class_group_id for e in enrollments})
    classes = {}
    if class_ids:
        r = await db.execute(select(ClassGroup).where(ClassGroup.id.in_(class_ids)))
        for c in r.scalars().all():
            classes[c.id] = c

    teacher_ids = {c.teacher_id for c in classes.values() if c.teacher_id}
    course_ids = {c.course_id for c in classes.values() if c.course_id}
    teachers, courses = {}, {}
    if teacher_ids:
        r = await db.execute(select(Teacher).where(Teacher.id.in_(teacher_ids)))
        teachers = {t.id: t.full_name for t in r.scalars().all()}
    if course_ids:
        r = await db.execute(select(Course).where(Course.id.in_(course_ids)))
        courses = {c.id: (c.name, c.level, c.duration_hours) for c in r.scalars().all()}

    certs = {}
    if class_ids:
        r = await db.execute(
            select(Certificate).where(
                Certificate.student_id == student_id,
                Certificate.class_group_id.in_(class_ids)
            )
        )
        for cert in r.scalars().all():
            certs[cert.class_group_id] = cert

    blocks = []
    for e in enrollments:
        cg = classes.get(e.class_group_id)
        if not cg:
            continue
        blocks.append(await _student_class_block(
            student_id, cg, db,
            course_info=courses.get(cg.course_id),
            teacher_name=teachers.get(cg.teacher_id, ""),
            cert=certs.get(cg.id),
            student_level=student.english_level or "",
        ))

    averages = [b["average"] for b in blocks if b["status_by_grade"] != "Sem avaliações"]
    overall_avg = round(sum(averages) / len(averages), 2) if averages else 0

    return {
        "student": {
            "id": student.id, "full_name": student.full_name, "cpf": student.cpf or "",
            "email": student.email or "", "phone": student.phone or "",
            "birth_date": student.birth_date.isoformat() if student.birth_date else None,
            "english_level": student.english_level or "", "status": student.status or ""
        },
        "classes": blocks,
        "overall_average": overall_avg
    }


@router.get("/turma/{class_group_id}")
async def get_turma_boletim(class_group_id: int, current_user=Depends(require_permission("boletins")), db: AsyncSession = Depends(get_db)):
    cg_result = await db.execute(select(ClassGroup).where(ClassGroup.id == class_group_id))
    cg = cg_result.scalar_one_or_none()
    if not cg:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    course_name, course_level, duration = ("", "", 0)
    if cg.course_id:
        cr = await db.execute(select(Course).where(Course.id == cg.course_id))
        c = cr.scalar_one_or_none()
        if c:
            course_name, course_level, duration = c.name, c.level, c.duration_hours

    teacher_name = ""
    if cg.teacher_id:
        tr = await db.execute(select(Teacher).where(Teacher.id == cg.teacher_id))
        t = tr.scalar_one_or_none()
        if t:
            teacher_name = t.full_name

    enrollments = await db.execute(
        select(Enrollment).where(
            Enrollment.class_group_id == class_group_id,
            Enrollment.status.in_(["active", "completed"])
        ).order_by(Enrollment.student_id)
    )
    enrollments = enrollments.scalars().all()
    student_ids = [e.student_id for e in enrollments]

    students = {}
    if student_ids:
        sr = await db.execute(select(Student).where(Student.id.in_(student_ids)))
        for s in sr.scalars().all():
            students[s.id] = s

    certs = {}
    if student_ids:
        cr = await db.execute(select(Certificate).where(Certificate.class_group_id == class_group_id))
        for cert in cr.scalars().all():
            certs[cert.student_id] = cert

    rows = []
    for e in enrollments:
        s = students.get(e.student_id)
        if not s:
            continue
        block = await _student_class_block(
            s.id, cg, db,
            course_info=(course_name, course_level, duration),
            teacher_name=teacher_name,
            cert=certs.get(s.id),
            student_level=s.english_level or "",
        )
        rows.append({
            "student": {
                "id": s.id, "full_name": s.full_name, "cpf": s.cpf or "",
                "email": s.email or "", "phone": s.phone or "",
                "english_level": s.english_level or "",
            },
            **block,
        })

    rows.sort(key=lambda r: r["student"]["full_name"])

    return {
        "class_group": {
            "id": cg.id, "name": cg.name, "level": cg.level or course_level or "",
            "course_name": course_name, "teacher_name": teacher_name,
            "weekdays": cg.weekdays or "",
            "start_time": str(cg.start_time) if cg.start_time else "",
            "end_time": str(cg.end_time) if cg.end_time else "",
            "workload_hours": duration or 0,
        },
        "students": rows,
    }


def _school_logo(settings):
    import os
    if not (settings and settings.logo_url):
        return None
    from app.utils import storage
    logo_path = storage.download_logo(settings.logo_url)
    if not logo_path:
        return None
    try:
        import tempfile
        import io
        from PIL import Image as PILImage
        pil = PILImage.open(logo_path).convert("RGB")
        pil.thumbnail((44, 44))
        buf = io.BytesIO()
        pil.save(buf, format="PNG")
        buf.seek(0)
        fd, path = tempfile.mkstemp(suffix=".png")
        with os.fdopen(fd, "wb") as f:
            f.write(buf.getvalue())
        if os.path.exists(logo_path) and logo_path != path:
            try:
                os.remove(logo_path)
            except Exception:
                pass
        return path
    except Exception:
        return None


def _make_decorations(school, cnpj, subtitle, logo_path, issue_date):
    from reportlab.lib import colors

    def draw(canvas, doc):
        canvas.saveState()
        w, h = doc.pagesize
        band_h = 58
        navy = colors.HexColor("#1E3A8A")
        canvas.setFillColor(navy)
        canvas.rect(0, h - band_h, w, band_h, stroke=0, fill=1)
        if logo_path:
            try:
                canvas.drawImage(logo_path, 26, h - band_h + 7, width=44, height=44, mask='auto')
            except Exception:
                pass
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica-Bold", 15)
        canvas.drawCentredString(w / 2, h - 24, school)
        canvas.setFont("Helvetica", 8.5)
        sub = subtitle
        if cnpj:
            sub = f"{sub}  |  CNPJ: {cnpj}"
        canvas.drawCentredString(w / 2, h - 40, sub)
        canvas.setStrokeColor(navy)
        canvas.setLineWidth(2)
        canvas.line(0, h - band_h - 3, w, h - band_h - 3)
        canvas.setFillColor(colors.HexColor("#64748B"))
        canvas.setFont("Helvetica", 8)
        canvas.drawString(30, 18, f"Emitido em {issue_date}")
        canvas.drawRightString(w - 30, 18, f"Página {doc.page}")
        canvas.restoreState()
    return draw


_SITUATION_COLORS = {
    "Aprovado": "#059669",
    "Recuperação": "#B45309",
    "Reprovado": "#DC2626",
    "Reprovado por Frequência": "#DC2626",
}


@router.get("/{student_id}/pdf")
async def boletim_pdf(student_id: int, current_user=Depends(require_permission("boletins")), db: AsyncSession = Depends(get_db)):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageTemplate, Frame
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER
    from fastapi.responses import StreamingResponse
    import io, os

    data = await get_boletim(student_id, current_user, db)
    if not isinstance(data, dict) or "student" not in data:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    settings_result = await db.execute(select(SchoolSettings).limit(1))
    settings = settings_result.scalar_one_or_none()
    school = settings.school_name if settings and settings.school_name else "Escola de Inglês"
    cnpj = settings.cnpj if settings and settings.cnpj else ""
    issue_date = date.today().strftime("%d/%m/%Y")
    logo_path = _school_logo(settings)

    stream = io.BytesIO()
    doc = SimpleDocTemplate(stream, pagesize=A4,
        topMargin=80, bottomMargin=50, leftMargin=40, rightMargin=40,
        title=f"Boletim - {data['student']['full_name']}")
    doc.addPageTemplates([PageTemplate(id='main',
        frames=[Frame(40, 50, A4[0] - 80, A4[1] - 130, id='frame')],
        onPage=_make_decorations(school, cnpj, "Boletim Escolar", logo_path, issue_date))])

    styles = getSampleStyleSheet()
    center = ParagraphStyle("Center", parent=styles['Normal'], alignment=TA_CENTER)
    cell = ParagraphStyle("Cell", parent=styles['Normal'], fontSize=9, leading=11)
    hcell = ParagraphStyle("Hcell", parent=cell, textColor=colors.white, fontName='Helvetica-Bold')
    sec = ParagraphStyle("Section", parent=styles['Heading4'], fontSize=12, textColor=colors.HexColor("#1E3A8A"), spaceAfter=2)
    meta = ParagraphStyle("Meta", parent=styles['Normal'], fontSize=9, textColor=colors.HexColor("#475569"), spaceAfter=6)
    legend = ParagraphStyle("Legend", parent=center, fontSize=8.5, textColor=colors.HexColor("#64748B"), spaceAfter=12)
    elements = []

    student = data["student"]
    info = Table([
        [Paragraph("Aluno:", cell), Paragraph(f"<b>{student['full_name']}</b>", cell), Paragraph("Nível atual:", cell), Paragraph(student["english_level"] or "-", cell)],
        [Paragraph("Nascimento:", cell), Paragraph(student["birth_date"] or "-", cell), Paragraph("E-mail:", cell), Paragraph(student["email"] or "-", cell)],
        [Paragraph("Telefone:", cell), Paragraph(student["phone"] or "-", cell), Paragraph("", cell), Paragraph("", cell)],
    ], colWidths=[80, 180, 75, 165])
    info.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(info)
    elements.append(Spacer(1, 16))

    for block in data["classes"]:
        elements.append(Paragraph(f"<b>{block['class_name']}</b> — Nível: {block['level'] or '-'}", sec))
        meta_parts = []
        if block["course_name"]:
            meta_parts.append(f"Curso: {block['course_name']}")
        if block["teacher_name"]:
            meta_parts.append(f"Professor(a): {block['teacher_name']}")
        if block["weekdays"]:
            meta_parts.append(f"Horário: {block['weekdays']} {block['start_time']}-{block['end_time']}".strip())
        if block["workload_hours"]:
            meta_parts.append(f"Carga horária: {block['workload_hours']}h")
        elements.append(Paragraph(" &nbsp;|&nbsp; ".join(meta_parts), meta))
        elements.append(Spacer(1, 4))

        table_data = [
            [Paragraph("Data", hcell), Paragraph("Avaliação", hcell), Paragraph("Tipo", hcell), Paragraph("Nota", hcell)]
        ]
        for ev in block["evaluations"]:
            table_data.append([
                Paragraph(ev["date"] or "-", cell),
                Paragraph(ev["title"], cell),
                Paragraph(ev["eval_type"] or "-", cell),
                Paragraph(f"{ev['score']:.1f}", cell),
            ])
        if not block["evaluations"]:
            table_data.append([Paragraph("", cell), Paragraph("Sem avaliações lançadas", cell), Paragraph("", cell), Paragraph("", cell)])
        avg_style = ParagraphStyle("Avg", parent=cell, alignment=TA_CENTER)
        table_data.append([
            Paragraph("", cell),
            Paragraph("<b>MÉDIA</b>", ParagraphStyle("Media", parent=cell, alignment=TA_CENTER, fontName='Helvetica-Bold')),
            Paragraph("", cell),
            Paragraph(f"<b>{block['average']}%</b>", avg_style),
        ])

        t = Table(table_data, colWidths=[70, 190, 90, 80], repeatRows=1)
        style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#EFF6FF")),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ]
        if block["evaluations"]:
            style.append(('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor("#F1F5F9")]))
        t.setStyle(TableStyle(style))
        elements.append(t)
        elements.append(Spacer(1, 4))

        situation = block["situation"]
        sit_color = _SITUATION_COLORS.get(situation, "#64748B")
        elements.append(Paragraph(
            f"Frequência: <b>{block['frequency']}%</b> ({block['present']} presenças, {block['absent']} faltas) "
            f"&nbsp;|&nbsp; Situação: <font color='{sit_color}'><b>{situation}</b></font>",
            cell
        ))
        if block["certificate"]:
            elements.append(Paragraph(
                f"Certificado de Conclusão emitido: <b>{block['certificate']['control_number']}</b>",
                cell
            ))
        elements.append(Spacer(1, 14))

    if data["classes"]:
        elements.append(Paragraph(
            f"MÉDIA GERAL: <b>{data['overall_average']}%</b>",
            ParagraphStyle("Overall", parent=center, fontSize=12, textColor=colors.HexColor("#1E293B"), spaceBefore=4, spaceAfter=12)
        ))

    elements.append(Paragraph(
        "Escala: <b>Aprovado</b> (média >= 70 e frequência >= 75%)  |  <b>Recuperação</b> (média 50–69)  |  "
        "<b>Reprovado</b> (média &lt; 50 ou frequência &lt; 75%)",
        legend
    ))
    elements.append(Spacer(1, 8))

    sig = Table([
        ["", ""],
        ["Coordenador(a) Acadêmico(a)", "Direção Geral"],
    ], colWidths=[230, 230], hAlign='CENTER')
    sig.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 0.75, colors.HexColor("#64748B")),
        ('FONTSIZE', (0, 1), (-1, 1), 9),
        ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor("#475569")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(sig)

    try:
        doc.build(elements)
    finally:
        if logo_path:
            try:
                os.remove(logo_path)
            except Exception:
                pass

    stream.seek(0)
    return StreamingResponse(stream, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=boletim.pdf"})


@router.get("/turma/{class_group_id}/pdf")
async def turma_boletim_pdf(class_group_id: int, current_user=Depends(require_permission("boletins")), db: AsyncSession = Depends(get_db)):
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageTemplate, Frame
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER
    from fastapi.responses import StreamingResponse
    import io, os

    data = await get_turma_boletim(class_group_id, current_user, db)

    settings_result = await db.execute(select(SchoolSettings).limit(1))
    settings = settings_result.scalar_one_or_none()
    school = settings.school_name if settings and settings.school_name else "Escola de Inglês"
    cnpj = settings.cnpj if settings and settings.cnpj else ""
    issue_date = date.today().strftime("%d/%m/%Y")
    logo_path = _school_logo(settings)

    size = landscape(A4)
    stream = io.BytesIO()
    cg = data["class_group"]
    doc = SimpleDocTemplate(stream, pagesize=size,
        topMargin=80, bottomMargin=50, leftMargin=30, rightMargin=30,
        title=f"Mapa de Notas - {cg['name']}")
    doc.addPageTemplates([PageTemplate(id='main',
        frames=[Frame(30, 50, size[0] - 60, size[1] - 130, id='frame')],
        onPage=_make_decorations(school, cnpj, "Mapa de Notas", logo_path, issue_date))])

    styles = getSampleStyleSheet()
    center = ParagraphStyle("Center", parent=styles['Normal'], alignment=TA_CENTER)
    cell = ParagraphStyle("Cell", parent=styles['Normal'], fontSize=8.5, leading=10.5)
    cell_center = ParagraphStyle("CellC", parent=cell, alignment=TA_CENTER)
    hcell = ParagraphStyle("Hcell", parent=cell, textColor=colors.white, fontName='Helvetica-Bold')
    hcell_center = ParagraphStyle("HcellC", parent=hcell, alignment=TA_CENTER)
    sec = ParagraphStyle("Section", parent=styles['Heading4'], fontSize=12, textColor=colors.HexColor("#1E3A8A"), spaceAfter=2)
    meta = ParagraphStyle("Meta", parent=styles['Normal'], fontSize=9, textColor=colors.HexColor("#475569"), spaceAfter=8)
    legend = ParagraphStyle("Legend", parent=center, fontSize=8.5, textColor=colors.HexColor("#64748B"), spaceAfter=12)
    elements = []

    elements.append(Paragraph(f"<b>{cg['name']}</b> — Nível: {cg['level'] or '-'}", sec))
    meta_parts = []
    if cg["course_name"]:
        meta_parts.append(f"Curso: {cg['course_name']}")
    if cg["teacher_name"]:
        meta_parts.append(f"Professor(a): {cg['teacher_name']}")
    if cg["weekdays"]:
        meta_parts.append(f"Horário: {cg['weekdays']} {cg['start_time']}-{cg['end_time']}".strip())
    if cg["workload_hours"]:
        meta_parts.append(f"Carga horária: {cg['workload_hours']}h")
    elements.append(Paragraph(" &nbsp;|&nbsp; ".join(meta_parts), meta))

    students = data["students"]
    if not students:
        elements.append(Paragraph("Nenhum aluno matriculado nesta turma.", center))
    else:
        ev_keys = []
        seen = set()
        for row in students:
            for ev in row["evaluations"]:
                k = (ev["title"], ev["eval_type"], ev["date"])
                if k not in seen:
                    seen.add(k)
                    ev_keys.append(k)
        ev_keys.sort(key=lambda k: (k[2] or "", k[0]))

        def short_date(d):
            return f"{d[8:10]}/{d[5:7]}" if d and len(d) >= 10 else (d or "")

        usable = size[0] - 60
        n = len(ev_keys)
        eval_w = max(58, (usable - 135 - 55 - 55 - 100) / max(n, 1))
        colWidths = [135] + [eval_w] * n + [55, 55, 100]

        header = [Paragraph("<b>Aluno</b>", hcell)]
        for (title, etype, dt) in ev_keys:
            header.append(Paragraph(f"<b>{title}</b><br/><font size=6.5 color='#DBEAFE'>{short_date(dt)}</font>", hcell_center))
        header += [
            Paragraph("<b>Média</b>", hcell_center),
            Paragraph("<b>Freq.</b>", hcell_center),
            Paragraph("<b>Situação</b>", hcell_center),
        ]

        rows = [header]
        for row in students:
            scores = {k: "" for k in ev_keys}
            for ev in row["evaluations"]:
                k = (ev["title"], ev["eval_type"], ev["date"])
                if k in scores:
                    scores[k] = f"{ev['score']:.1f}"
            cells = [Paragraph(row["student"]["full_name"], cell)]
            cells += [Paragraph(scores[k] or "—", cell_center) for k in ev_keys]
            cells.append(Paragraph(f"<b>{row['average']}%</b>", cell_center))
            cells.append(Paragraph(f"{row['frequency']}%", cell_center))
            situation = row["situation"]
            sit_color = _SITUATION_COLORS.get(situation, "#64748B")
            cells.append(Paragraph(f"<font color='{sit_color}'><b>{situation}</b></font>", cell_center))
            rows.append(cells)

        t = Table(rows, colWidths=colWidths, repeatRows=1)
        style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ]
        if len(students) > 1:
            style.append(('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F1F5F9")]))
        if n > 0:
            style.append(('BACKGROUND', (n + 1, 1), (n + 1, -1), colors.HexColor("#EFF6FF")))
        t.setStyle(TableStyle(style))
        elements.append(t)

    elements.append(Spacer(1, 18))
    elements.append(Paragraph(
        "Escala: <b>Aprovado</b> (média >= 70 e frequência >= 75%)  |  <b>Recuperação</b> (média 50–69)  |  "
        "<b>Reprovado</b> (média &lt; 50 ou frequência &lt; 75%)",
        legend
    ))
    elements.append(Spacer(1, 8))

    sig = Table([
        ["", ""],
        ["Coordenador(a) Acadêmico(a)", "Direção Geral"],
    ], colWidths=[280, 280], hAlign='CENTER')
    sig.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 0.75, colors.HexColor("#64748B")),
        ('FONTSIZE', (0, 1), (-1, 1), 9),
        ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor("#475569")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(sig)

    try:
        doc.build(elements)
    finally:
        if logo_path:
            try:
                os.remove(logo_path)
            except Exception:
                pass

    stream.seek(0)
    return StreamingResponse(stream, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=mapa-de-notas.pdf"})


@router.get("/{student_id}/excel")
async def boletim_excel(student_id: int, current_user=Depends(require_permission("boletins")), db: AsyncSession = Depends(get_db)):
    import openpyxl
    from fastapi.responses import StreamingResponse
    import io

    data = await get_boletim(student_id, current_user, db)
    if not isinstance(data, dict) or "student" not in data:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    student = data["student"]
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Boletim"
    ws.append(["Boletim Escolar"])
    ws.append(["Aluno:", student["full_name"], "", "Nível:", student["english_level"] or ""])
    ws.append([])

    for block in data["classes"]:
        ws.append([f"Turma: {block['class_name']}", "", f"Nível: {block['level'] or '-'}"])
        ws.append([f"Curso: {block['course_name'] or '-'}", "", f"Professor(a): {block['teacher_name'] or '-'}"])
        ws.append([])
        ws.append(["Data", "Avaliação", "Tipo", "Nota"])
        for ev in block["evaluations"]:
            ws.append([_fmt_date(ev["date"]), ev["title"], ev["eval_type"], f"{ev['score']:.1f}"])
        if not block["evaluations"]:
            ws.append(["", "Sem avaliações lançadas", "", ""])
        ws.append(["", "MÉDIA", "", f"{block['average']}%"])
        ws.append([])
        ws.append(["Frequência", f"{block['frequency']}%", "Situação", block["situation"]])
        ws.append([])

    ws.append(["MÉDIA GERAL", f"{data['overall_average']}%"])

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return StreamingResponse(stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=boletim.xlsx"})


@router.get("/turma/{class_group_id}/excel")
async def turma_boletim_excel(class_group_id: int, current_user=Depends(require_permission("boletins")), db: AsyncSession = Depends(get_db)):
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment
    from fastapi.responses import StreamingResponse
    import io

    data = await get_turma_boletim(class_group_id, current_user, db)
    cg = data["class_group"]

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Mapa de Notas"
    ws.append([f"Mapa de Notas - {cg['name']}  (Nível: {cg['level'] or '-'})"])
    ws.append([f"Curso: {cg['course_name'] or '-'}  |  Professor(a): {cg['teacher_name'] or '-'}  |  Horário: {cg['weekdays']} {cg['start_time']}-{cg['end_time']}"])
    ws.append([])

    ev_keys = []
    seen = set()
    for row in data["students"]:
        for ev in row["evaluations"]:
            k = (ev["title"], ev["eval_type"], ev["date"])
            if k not in seen:
                seen.add(k)
                ev_keys.append(k)
    ev_keys.sort(key=lambda k: (k[2] or "", k[0]))

    header = ["Aluno"] + [f"{k[0]} ({_fmt_date(k[2])})" for k in ev_keys] + ["Média", "Frequência", "Situação"]
    ws.append(header)
    for col, _ in enumerate(header, start=1):
        c = ws.cell(row=4, column=col)
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="1E3A8A")
        c.alignment = Alignment(horizontal="center")

    for row in data["students"]:
        scores = {k: "" for k in ev_keys}
        for ev in row["evaluations"]:
            k = (ev["title"], ev["eval_type"], ev["date"])
            if k in scores:
                scores[k] = f"{ev['score']:.1f}"
        line = [row["student"]["full_name"]] + [scores[k] for k in ev_keys] + [
            f"{row['average']}%", f"{row['frequency']}%", row["situation"]
        ]
        ws.append(line)

    if ev_keys:
        media_col = 2 + len(ev_keys)
        for r in range(5, 5 + len(data["students"])):
            ws.cell(row=r, column=media_col).font = Font(bold=True)

    ws.append([])
    ws.append(["Escala: Aprovado (média >= 70 e frequência >= 75%) | Recuperação (média 50-69) | Reprovado (média < 50 ou frequência < 75%)"])

    ws.column_dimensions['A'].width = 28
    for i in range(len(ev_keys)):
        ws.column_dimensions[chr(ord('B') + i)].width = 16

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return StreamingResponse(stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=mapa-de-notas.xlsx"})
