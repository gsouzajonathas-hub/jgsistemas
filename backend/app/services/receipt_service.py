import io
import os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    PageTemplate,
    Frame,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.graphics.shapes import Drawing, Circle, String
from reportlab.graphics import renderPDF

from app.utils import storage

_BLUE_50 = "#EFF6FF"
_BLUE_100 = "#DBEAFE"
_BLUE_600 = "#2563EB"
_BLUE_700 = "#1D4ED8"
_BLUE_800 = "#1E40AF"
_BLUE_900 = "#1E3A8A"
_SLATE_50 = "#F8FAFC"
_SLATE_100 = "#F1F5F9"
_SLATE_200 = "#E2E8F0"
_SLATE_300 = "#CBD5E1"
_SLATE_400 = "#94A3B8"
_SLATE_500 = "#64748B"
_SLATE_600 = "#475569"
_SLATE_700 = "#334155"
_SLATE_800 = "#1E293B"
_GREEN_50 = "#F0FDF4"
_GREEN_100 = "#DCFCE7"
_GREEN_500 = "#22C55E"
_GREEN_600 = "#16A34A"
_GREEN_700 = "#15803D"
_RED_500 = "#EF4444"
_AMBER_500 = "#F59E0B"

_UNIDADES = (
    "", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
    "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis",
    "dezessete", "dezoito", "dezenove",
)
_DEZENAS = (
    "", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta",
    "setenta", "oitenta", "noventa",
)
_CENTENAS = (
    "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
    "seiscentos", "setecentos", "oitocentos", "novecentos",
)


def _por_extenso_ate_999(n: int) -> str:
    if n == 0:
        return ""
    if n < 20:
        return _UNIDADES[n]
    if n < 100:
        d, u = divmod(n, 10)
        return _DEZENAS[d] + (f" e {_UNIDADES[u]}" if u else "")
    c, resto = divmod(n, 100)
    if n == 100:
        return "cem"
    base = _CENTENAS[c]
    if resto:
        return base + f" e {_por_extenso_ate_999(resto)}"
    return base


def _por_extenso_ate_999999(n: int) -> str:
    if n == 0:
        return "zero"
    mil, resto = divmod(n, 1000)
    partes = []
    if mil:
        if mil == 1:
            partes.append("mil")
        else:
            partes.append(f"{_por_extenso_ate_999(mil)} mil")
    if resto:
        partes.append(_por_extenso_ate_999(resto))
    return " e ".join(partes)


def valor_por_extenso(valor: float) -> str:
    valor = round(valor, 2)
    reais = int(valor)
    centavos = int(round((valor - reais) * 100))
    partes = []
    if reais:
        palavras = _por_extenso_ate_999999(reais)
        partes.append(f"{palavras} {'real' if reais == 1 else 'reais'}")
    if centavos:
        palavras = _por_extenso_ate_999(centavos)
        partes.append(f"{palavras} {'centavo' if centavos == 1 else 'centavos'}")
    return " e ".join(partes) if partes else "zero reais"


def _school_logo(settings):
    if not (settings and settings.logo_url):
        return None
    logo_path = storage.download_logo(settings.logo_url)
    if not logo_path:
        return None
    try:
        from PIL import Image as PILImage
        pil = PILImage.open(logo_path).convert("RGB")
        pil.thumbnail((60, 60))
        buf = io.BytesIO()
        pil.save(buf, format="PNG")
        logo_bytes = buf.getvalue()
        if os.path.exists(logo_path):
            try:
                os.remove(logo_path)
            except Exception:
                pass
        return logo_bytes
    except Exception:
        return None


def _brl(valor: float) -> str:
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _make_decorations(school, cnpj, subtitle, logo_path, issue_date, receipt_number):
    def draw(canvas_obj, doc):
        canvas_obj.saveState()
        w, h = doc.pagesize

        band_h = 70
        navy_top = colors.HexColor(_BLUE_900)
        navy_bottom = colors.HexColor(_BLUE_800)
        canvas_obj.setFillColor(navy_top)
        canvas_obj.rect(0, h - band_h, w, band_h, stroke=0, fill=1)
        canvas_obj.setFillColor(navy_bottom)
        canvas_obj.rect(0, h - 4, w, 4, stroke=0, fill=1)

        accent_line = h - band_h - 5
        canvas_obj.setStrokeColor(colors.HexColor(_BLUE_600))
        canvas_obj.setLineWidth(2)
        canvas_obj.line(0, accent_line, w, accent_line)

        if logo_path:
            try:
                canvas_obj.drawImage(logo_path, 30, h - band_h + 12, width=46, height=46, mask='auto')
            except Exception:
                pass

        canvas_obj.setFillColor(colors.white)
        canvas_obj.setFont("Helvetica-Bold", 17)
        canvas_obj.drawCentredString(w / 2, h - 26, school)

        canvas_obj.setFont("Helvetica", 9)
        sub_text = subtitle
        if cnpj:
            sub_text = f"{sub_text}   |   CNPJ: {cnpj}"
        canvas_obj.setFillColor(colors.HexColor("#BFDBFE"))
        canvas_obj.drawCentredString(w / 2, h - 42, sub_text)

        canvas_obj.setFont("Helvetica", 7.5)
        canvas_obj.setFillColor(colors.HexColor("#93C5FD"))
        canvas_obj.drawCentredString(w / 2, h - 54, f"Recibo nº {receipt_number}  |  Emissão: {issue_date}")

        seal_cx = w - 46
        seal_cy = h - band_h + 34
        seal_r = 24
        canvas_obj.setFillColor(colors.HexColor(_GREEN_600))
        canvas_obj.circle(seal_cx, seal_cy, seal_r, stroke=0, fill=1)
        canvas_obj.setStrokeColor(colors.white)
        canvas_obj.setLineWidth(1.5)
        canvas_obj.circle(seal_cx, seal_cy, seal_r - 3.5, stroke=1, fill=0)

        safe_r = seal_r - 5

        def _seal_font_size(text, font, max_size, baseline):
            size = max_size
            while size > 4:
                half_w = stringWidth(text, font, size) / 2.0
                top = baseline + size * 0.72
                if half_w ** 2 + top ** 2 <= safe_r ** 2:
                    break
                size -= 0.25
            return size

        q_baseline = 1
        q_size = _seal_font_size("QUITADO", "Helvetica-Bold", 7.5, q_baseline)
        canvas_obj.setFillColor(colors.white)
        canvas_obj.setFont("Helvetica-Bold", q_size)
        canvas_obj.drawCentredString(seal_cx, seal_cy + q_baseline, "QUITADO")

        p_baseline = -6.5
        p_size = _seal_font_size("PAGO", "Helvetica", 6, p_baseline)
        canvas_obj.setFont("Helvetica", p_size)
        canvas_obj.drawCentredString(seal_cx, seal_cy + p_baseline, "PAGO")

        canvas_obj.setFillColor(colors.HexColor(_SLATE_400))
        canvas_obj.setFont("Helvetica", 7)
        canvas_obj.drawString(30, 16, f"Emitido em {issue_date}  |  {school}")
        canvas_obj.drawRightString(w - 30, 16, f"Recibo {receipt_number}")

        canvas_obj.restoreState()
    return draw


def _make_info_box(label, value, x, y, w_box=170):
    elements = []
    t = Table(
        [[
            Paragraph(f"<b>{label}</b>", ParagraphStyle("lbl", fontSize=7, textColor=colors.HexColor(_SLATE_500), leading=9)),
            Paragraph(f"<b>{value}</b>", ParagraphStyle("val", fontSize=9, textColor=colors.HexColor(_SLATE_800), leading=11)),
        ]],
        colWidths=[w_box * 0.35, w_box * 0.65]
    )
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(_SLATE_50)),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor(_SLATE_200)),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t


def build_receipt_pdf(payment, installment, student, settings) -> bytes:
    school = settings.school_name if settings and settings.school_name else "Gestão Escolar"
    cnpj = settings.cnpj if settings and settings.cnpj else ""
    school_phone = settings.phone if settings and settings.phone else ""
    school_email = settings.email if settings and settings.email else ""
    issue_date = date.today().strftime("%d/%m/%Y")
    logo_bytes = _school_logo(settings)
    logo_path = io.BytesIO(logo_bytes) if logo_bytes else None
    receipt_number = payment.receipt_number or f"REC-{payment.id:06d}"
    paid_date = payment.payment_date.strftime("%d/%m/%Y")
    due_date = installment.due_date.strftime("%d/%m/%Y")

    stream = io.BytesIO()
    doc = SimpleDocTemplate(
        stream,
        pagesize=A4,
        topMargin=90,
        bottomMargin=55,
        leftMargin=35,
        rightMargin=35,
        title=f"Recibo {receipt_number}",
    )
    doc.addPageTemplates([
        PageTemplate(
            id='main',
            frames=[Frame(35, 55, A4[0] - 70, A4[1] - 145, id='frame')],
            onPage=_make_decorations(school, cnpj, "Recibo de Pagamento", logo_path, issue_date, receipt_number),
        )
    ])

    styles = getSampleStyleSheet()
    cell_style = ParagraphStyle("Cell", parent=styles['Normal'], fontSize=9, leading=11)
    cell_bold = ParagraphStyle("CellBold", parent=styles['Normal'], fontSize=9, leading=11, fontName='Helvetica-Bold')

    title_style = ParagraphStyle(
        "ReceiptTitle", parent=styles['Normal'], fontSize=15, fontName='Helvetica-Bold',
        alignment=TA_CENTER, textColor=colors.HexColor(_BLUE_800), spaceAfter=2,
    )
    subtitle_style = ParagraphStyle(
        "ReceiptSub", parent=styles['Normal'], fontSize=9, alignment=TA_CENTER,
        textColor=colors.HexColor(_SLATE_500), spaceAfter=14,
    )
    body_style = ParagraphStyle(
        "Body", parent=styles['Normal'], fontSize=9.5, leading=14,
        textColor=colors.HexColor(_SLATE_700), spaceAfter=10,
    )
    total_style = ParagraphStyle(
        "Total", parent=styles['Normal'], fontSize=11, fontName='Helvetica-Bold',
        alignment=TA_CENTER, textColor=colors.HexColor(_GREEN_700), spaceBefore=10, spaceAfter=6,
    )
    extenso_style = ParagraphStyle(
        "Extenso", parent=styles['Normal'], fontSize=8.5, alignment=TA_CENTER,
        textColor=colors.HexColor(_SLATE_500), spaceAfter=12,
    )
    right_style = ParagraphStyle("Right", parent=cell_style, alignment=TA_RIGHT)
    center_small = ParagraphStyle("CenterSmall", parent=styles['Normal'], fontSize=8, alignment=TA_CENTER, textColor=colors.HexColor(_SLATE_400))

    elements = []

    elements.append(Paragraph("RECIBO DE MENSALIDADE", title_style))
    elements.append(Paragraph(
        f"Recibo nº <b>{receipt_number}</b>  &nbsp;|&nbsp;  Emissão: <b>{issue_date}</b>",
        subtitle_style
    ))

    intro_text = (
        f"Recebemos de <b>{student.full_name}</b>"
        f"{f', CPF {student.cpf}' if student.cpf else ''}, "
        f"o valor referente à mensalidade escolar conforme detalhado abaixo."
    )
    elements.append(Paragraph(intro_text, body_style))
    elements.append(Spacer(1, 6))

    student_data = [
        [
            Paragraph("<b>Aluno(a):</b>", cell_style),
            Paragraph(f"<b>{student.full_name}</b>", cell_bold),
            Paragraph("<b>Unidade:</b>", cell_style),
            Paragraph(student.unit or "—", cell_style),
        ],
        [
            Paragraph("<b>CPF:</b>", cell_style),
            Paragraph(student.cpf or "—", cell_style),
            Paragraph("<b>Nascimento:</b>", cell_style),
            Paragraph(
                student.birth_date.strftime("%d/%m/%Y") if student.birth_date else "—",
                cell_style
            ),
        ],
    ]
    st = Table(student_data, colWidths=[75, 195, 80, 120])
    st.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor(_SLATE_50)),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor(_SLATE_50)),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor(_SLATE_200)),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor(_SLATE_200)),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(st)
    elements.append(Spacer(1, 14))

    payment_rows = [
        [
            Paragraph("<b>Descrição</b>", ParagraphStyle("hdr", fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, leading=10)),
            Paragraph("<b>Vencimento</b>", ParagraphStyle("hdr", fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, alignment=TA_CENTER, leading=10)),
            Paragraph("<b>Pagamento</b>", ParagraphStyle("hdr", fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, alignment=TA_CENTER, leading=10)),
            Paragraph("<b>Forma</b>", ParagraphStyle("hdr", fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, alignment=TA_CENTER, leading=10)),
            Paragraph("<b>Valor</b>", ParagraphStyle("hdr", fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, alignment=TA_RIGHT, leading=10)),
        ],
        [
            Paragraph(installment.description, cell_style),
            Paragraph(due_date, ParagraphStyle("c", fontSize=9, alignment=TA_CENTER, leading=11)),
            Paragraph(paid_date, ParagraphStyle("c", fontSize=9, alignment=TA_CENTER, leading=11)),
            Paragraph(payment.payment_method or "—", ParagraphStyle("c", fontSize=9, alignment=TA_CENTER, leading=11)),
            Paragraph(f"<b>{_brl(payment.amount)}</b>", right_style),
        ],
    ]

    pt = Table(payment_rows, colWidths=[160, 75, 80, 80, 75])
    pt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(_BLUE_700)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, 1), colors.white),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor(_SLATE_200)),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor(_SLATE_200)),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, colors.HexColor(_BLUE_600)),
    ]))
    elements.append(pt)
    elements.append(Spacer(1, 6))

    discount = installment.discount if hasattr(installment, 'discount') and installment.discount else 0
    late_fee = installment.late_fee if hasattr(installment, 'late_fee') and installment.late_fee else 0
    interest = installment.interest if hasattr(installment, 'interest') and installment.interest else 0

    if discount > 0 or late_fee > 0 or interest > 0:
        detail_rows = []
        if discount > 0:
            detail_rows.append([
                Paragraph("Desconto aplicado:", cell_style),
                Paragraph(f"<b>- {_brl(discount)}</b>", ParagraphStyle("r", fontSize=9, textColor=colors.HexColor(_GREEN_600), alignment=TA_RIGHT, leading=11)),
            ])
        if late_fee > 0:
            detail_rows.append([
                Paragraph("Multa por atraso:", cell_style),
                Paragraph(f"<b>+ {_brl(late_fee)}</b>", ParagraphStyle("r", fontSize=9, textColor=colors.HexColor(_RED_500), alignment=TA_RIGHT, leading=11)),
            ])
        if interest > 0:
            detail_rows.append([
                Paragraph("Juros de mora:", cell_style),
                Paragraph(f"<b>+ {_brl(interest)}</b>", ParagraphStyle("r", fontSize=9, textColor=colors.HexColor(_RED_500), alignment=TA_RIGHT, leading=11)),
            ])

        dt = Table(detail_rows, colWidths=[350, 115])
        dt.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(_SLATE_50)),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor(_SLATE_200)),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(dt)
        elements.append(Spacer(1, 6))

    total_box = Table(
        [[
            Paragraph("VALOR TOTAL PAGO", ParagraphStyle("tl", fontSize=10, fontName='Helvetica-Bold', textColor=colors.HexColor(_BLUE_800), leading=13)),
            Paragraph(f"<b>{_brl(payment.amount)}</b>", ParagraphStyle("tv", fontSize=14, fontName='Helvetica-Bold', textColor=colors.HexColor(_GREEN_700), alignment=TA_RIGHT, leading=17)),
        ]],
        colWidths=[260, 205]
    )
    total_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(_GREEN_50)),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor(_GREEN_500)),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(total_box)

    extenso_text = valor_por_extenso(payment.amount)
    elements.append(Paragraph(f"<i>({extenso_text})</i>", extenso_style))

    if payment.notes:
        notes_box = Table(
            [[Paragraph(f"<b>Observações:</b> {payment.notes}", cell_style)]],
            colWidths=[465]
        )
        notes_box.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(_SLATE_50)),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor(_SLATE_200)),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(notes_box)

    elements.append(Spacer(1, 18))

    legal_text = (
        "Este recibo comprova o pagamento referente à mensalidade escolar indicada acima. "
        "Guarde este documento para sua segurança."
    )
    elements.append(Paragraph(legal_text, ParagraphStyle(
        "legal", fontSize=7, textColor=colors.HexColor(_SLATE_400), alignment=TA_CENTER, leading=10, spaceAfter=14,
    )))

    sig_data = [
        [
            Paragraph("_" * 45, center_small),
            Paragraph("_" * 45, center_small),
        ],
        [
            Paragraph("Recebido por: " + school, ParagraphStyle("s", fontSize=8, alignment=TA_CENTER, textColor=colors.HexColor(_SLATE_600), leading=10)),
            Paragraph("Assinatura do Responsável", ParagraphStyle("s", fontSize=8, alignment=TA_CENTER, textColor=colors.HexColor(_SLATE_600), leading=10)),
        ],
    ]
    sig_table = Table(sig_data, colWidths=[232, 233])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(sig_table)

    elements.append(Spacer(1, 10))
    if school_phone or school_email:
        contact_parts = []
        if school_phone:
            contact_parts.append(f"Tel: {school_phone}")
        if school_email:
            contact_parts.append(f"E-mail: {school_email}")
        elements.append(Paragraph("  |  ".join(contact_parts), center_small))

    doc.build(elements)
    return stream.getvalue()
