import io
from datetime import date, datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.platypus import Image as RLImage


def _brl(v) -> str:
    try:
        v = float(v or 0)
    except (TypeError, ValueError):
        v = 0.0
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _d(v) -> str:
    if isinstance(v, datetime):
        return v.strftime("%d/%m/%Y")
    if isinstance(v, date):
        return v.strftime("%d/%m/%Y")
    s = str(v or "")
    return s[8:10] + "/" + s[5:7] + "/" + s[:4] if len(s) >= 10 else s or "—"


def _idade(nasc) -> str:
    try:
        d = nasc if isinstance(nasc, date) else date.fromisoformat(str(nasc)[:10])
        today = date.today()
        years = today.year - d.year - ((today.month, today.day) < (d.month, d.day))
        return f"{_d(d)} ({years} anos)"
    except Exception:
        return _d(nasc)


def build_student_sheet_pdf(data: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=16 * mm, bottomMargin=18 * mm,
        title="Ficha Cadastral do Aluno",
    )
    ss = getSampleStyleSheet()

    st_title = ParagraphStyle("sTitle", parent=ss["Normal"], fontName="Helvetica-Bold",
                              fontSize=13, leading=17, alignment=TA_CENTER, spaceAfter=2)
    st_sub = ParagraphStyle("sSub", parent=ss["Normal"], fontName="Helvetica",
                            fontSize=9.5, leading=13, alignment=TA_CENTER,
                            textColor=colors.HexColor("#334155"))
    st_h = ParagraphStyle("sH", parent=ss["Normal"], fontName="Helvetica-Bold",
                          fontSize=11, leading=15, spaceBefore=14, spaceAfter=4)
    st_small = ParagraphStyle("sSmall", parent=ss["Normal"], fontName="Helvetica",
                              fontSize=8, leading=11, alignment=TA_CENTER,
                              textColor=colors.HexColor("#64748B"))

    def info_table(rows):
        t = Table([[k, v] for k, v in rows], colWidths=[55 * mm, 115 * mm])
        t.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 9.5),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#475569")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F8FAFC")),
            ("ROWBACKGROUNDS", (1, 0), (1, -1), [colors.white, colors.HexColor("#FAFBFC")]),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        return t

    story = []
    school = data.get("school", {})

    logo = school.get("logo")
    if logo:
        try:
            from PIL import Image as PILImage
            with PILImage.open(logo) as im:
                w, h = im.size
            ratio = (w / h) if h else 1.0
            logo_h = 20 * mm
            logo_w = min(logo_h * max(ratio, 0.2), 60 * mm)
            img = RLImage(logo, width=logo_w, height=logo_h)
            img.hAlign = "CENTER"
            story.append(img)
            story.append(Spacer(1, 4))
        except Exception:
            pass

    story.append(Paragraph(str(school.get("name") or "Escola"), st_title))
    line = " — ".join(x for x in [
        f"CNPJ: {school['cnpj']}" if school.get("cnpj") else "",
        school.get("address") or "",
        f"Fone: {school['phone']}" if school.get("phone") else "",
        school.get("email") or "",
    ] if x)
    if line:
        story.append(Paragraph(line, st_sub))
    story.append(Spacer(1, 6))
    story.append(Paragraph("FICHA CADASTRAL DO ALUNO", st_title))
    num = data.get("enrollment_number")
    if num:
        story.append(Paragraph(f"Matrícula nº {num}", st_sub))

    s = data.get("student", {})
    story.append(Paragraph("1. DADOS DO ALUNO", st_h))
    address_full = ", ".join(p for p in [
        s.get("street"), f"nº {s['number']}" if s.get("number") else "",
        s.get("neighborhood"), s.get("city"), s.get("state"),
        f"CEP {s['zip_code']}" if s.get("zip_code") else "",
    ] if p)

    status_labels = {"active": "Ativo", "inactive": "Inativo", "suspended": "Suspenso", "transferred": "Transferido"}
    rows = [
        ("Nome completo", s.get("full_name") or "—"),
        ("CPF", s.get("cpf") or "—"),
        ("RG", s.get("rg") or "—"),
        ("Data de nascimento", _idade(s["birth_date"]) if s.get("birth_date") else "—"),
    ]
    if s.get("gender"):
        g = {"M": "Masculino", "F": "Feminino", "O": "Outro"}.get(s["gender"], s["gender"])
        rows.append(("Gênero", g))
    if s.get("marital_status"):
        rows.append(("Estado civil", s["marital_status"]))
    rows += [
        ("Telefone", s.get("phone") or "—"),
        ("WhatsApp", s.get("whatsapp") or "—"),
        ("E-mail", s.get("email") or "—"),
        ("Endereço", address_full or "—"),
        ("Nível de inglês", s.get("english_level") or "—"),
        ("Unidade", s.get("unit") or "—"),
        ("Situação cadastral", status_labels.get(s.get("status"), s.get("status") or "—")),
        ("Data de matrícula na escola", _d(s["enrollment_date"]) if s.get("enrollment_date") else "—"),
        ("Valor da mensalidade", _brl(s.get("monthly_fee")) if s.get("monthly_fee") else "—"),
        ("Dia de vencimento", f"dia {s['due_day']}" if s.get("due_day") else "—"),
    ]
    if s.get("plan_name"):
        rows.insert(len(rows) - 2, ("Plano contratado", s["plan_name"]))
    story.append(info_table(rows))

    resp = data.get("responsible") or {}
    if any(resp.get(k) for k in ("full_name", "cpf", "phone", "email")):
        story.append(Paragraph("2. RESPONSÁVEL", st_h))
        rrows = [("Nome", resp.get("full_name") or "—")]
        if resp.get("relationship"):
            rrows.append(("Parentesco", resp["relationship"]))
        rrows += [
            ("CPF", resp.get("cpf") or "—"),
            ("Telefone", resp.get("phone") or "—"),
            ("E-mail", resp.get("email") or "—"),
        ]
        story.append(info_table(rrows))

    if s.get("notes"):
        story.append(Paragraph("3. OBSERVAÇÕES", st_h))
        nt = Table([[Paragraph(str(s["notes"]), ParagraphStyle(
            "notes", parent=ss["Normal"], fontName="Helvetica", fontSize=9.5, leading=14))]],
            colWidths=[170 * mm])
        nt.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FAFBFC")),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(nt)

    story.append(Spacer(1, 26))
    city_date = f"{data.get('city') or ''}{', ' if data.get('city') else ''}{datetime.now().strftime('%d/%m/%Y')}"
    sig = Table([[
        Paragraph("_______________________________________<br/>Assinatura da Secretaria / Direção", st_small),
        Paragraph("_______________________________________<br/>Assinatura do Aluno / Responsável", st_small),
    ]], colWidths=[85 * mm, 85 * mm])
    story.append(sig)
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        f"Ficha gerada eletronicamente pelo sistema {school.get('name') or 'de gestão escolar'} em "
        f"{datetime.now().strftime('%d/%m/%Y %H:%M')} · Documento de controle interno.", st_small))

    doc.build(story)
    return buf.getvalue()
