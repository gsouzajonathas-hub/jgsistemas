import io
import os

from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
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
from reportlab.pdfbase.pdfmetrics import stringWidth

from app.services.receipt_service import (
    _school_logo,
    valor_por_extenso,
    _brl,
    _SLATE_50,
    _SLATE_100,
    _SLATE_200,
    _SLATE_300,
    _SLATE_400,
    _SLATE_500,
    _SLATE_600,
    _SLATE_700,
    _SLATE_800,
    _BLUE_50,
    _BLUE_100,
    _BLUE_600,
    _BLUE_700,
    _BLUE_800,
    _BLUE_900,
    _GREEN_50,
    _GREEN_500,
    _GREEN_600,
    _GREEN_700,
    _RED_500,
    _AMBER_500,
)


def _material_decorations(school, cnpj, subtitle, logo_path, issue_date, receipt_number):
    def draw(canvas_obj, doc):
        canvas_obj.saveState()
        w, h = doc.pagesize

        band_h = 70
        navy_bottom = colors.HexColor(_BLUE_800)
        navy_top = colors.HexColor(_BLUE_900)
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

        canvas_obj.setFillColor(colors.HexColor(_SLATE_400))
        canvas_obj.setFont("Helvetica", 7)
        canvas_obj.drawString(30, 16, f"Emitido em {issue_date}  |  {school}")
        canvas_obj.drawRightString(w - 30, 16, f"Recibo {receipt_number}")

        canvas_obj.restoreState()
    return draw


def build_material_receipt_pdf(sale, material, student, settings) -> bytes:
    school = settings.school_name if settings and settings.school_name else "Gestão Escolar"
    cnpj = settings.cnpj if settings and settings.cnpj else ""
    school_phone = settings.phone if settings and settings.phone else ""
    school_email = settings.email if settings and settings.email else ""
    issue_date = date.today().strftime("%d/%m/%Y")
    logo_path = _school_logo(settings)
    receipt_number = f"MAT-{sale.id:06d}"

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
            onPage=_material_decorations(school, cnpj, "Recibo de Material Didático", logo_path, issue_date, receipt_number),
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
    extenso_style = ParagraphStyle(
        "Extenso", parent=styles['Normal'], fontSize=8.5, alignment=TA_CENTER,
        textColor=colors.HexColor(_SLATE_500), spaceAfter=12,
    )
    right_style = ParagraphStyle("Right", parent=cell_style, alignment=TA_RIGHT)
    center_small = ParagraphStyle("CenterSmall", parent=styles['Normal'], fontSize=8, alignment=TA_CENTER, textColor=colors.HexColor(_SLATE_400))

    total_style = ParagraphStyle(
        "Total", parent=styles['Normal'], fontSize=11, fontName='Helvetica-Bold',
        alignment=TA_CENTER, textColor=colors.HexColor(_GREEN_700), spaceBefore=10, spaceAfter=6,
    )

    elements = []

    elements.append(Paragraph("RECIBO DE MATERIAL DIDÁTICO", title_style))
    elements.append(Paragraph(
        f"Recibo nº <b>{receipt_number}</b>  &nbsp;|&nbsp;  Emissão: <b>{issue_date}</b>",
        subtitle_style
    ))

    intro_text = (
        f"Recebemos de <b>{student.full_name}</b>"
        f"{f', CPF {student.cpf}' if student.cpf else ''}, "
        f"o valor referente à venda de material didático conforme detalhado abaixo."
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
            Paragraph("<b>Data:</b>", cell_style),
            Paragraph(
                sale.created_at.strftime("%d/%m/%Y") if sale.created_at else issue_date,
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

    itens_rows = [
        [
            Paragraph("<b>Item</b>", ParagraphStyle("hdr", fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, leading=10)),
            Paragraph("<b>Qtd</b>", ParagraphStyle("hdr", fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, alignment=TA_CENTER, leading=10)),
            Paragraph("<b>Valor Unit.</b>", ParagraphStyle("hdr", fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, alignment=TA_RIGHT, leading=10)),
            Paragraph("<b>Subtotal</b>", ParagraphStyle("hdr", fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, alignment=TA_RIGHT, leading=10)),
        ],
        [
            Paragraph(material.name, cell_style),
            Paragraph(str(sale.quantity), ParagraphStyle("c", fontSize=9, alignment=TA_CENTER, leading=11)),
            Paragraph(_brl(float(sale.unit_price)), right_style),
            Paragraph(f"<b>{_brl(float(sale.total_price))}</b>", right_style),
        ],
    ]
    it = Table(itens_rows, colWidths=[280, 50, 90, 90])
    it.setStyle(TableStyle([
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
    elements.append(it)
    elements.append(Spacer(1, 8))

    if sale.payment_method:
        pm = Table(
            [[
                Paragraph("<b>Forma de pagamento:</b>", cell_style),
                Paragraph(f"<b>{sale.payment_method}</b>", cell_bold),
            ]],
            colWidths=[150, 330]
        )
        pm.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(_SLATE_50)),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor(_SLATE_200)),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(pm)
        elements.append(Spacer(1, 8))

    total_box = Table(
        [[
            Paragraph("VALOR TOTAL", ParagraphStyle("tl", fontSize=10, fontName='Helvetica-Bold', textColor=colors.HexColor(_BLUE_800), leading=13)),
            Paragraph(f"<b>{_brl(float(sale.total_price))}</b>", ParagraphStyle("tv", fontSize=14, fontName='Helvetica-Bold', textColor=colors.HexColor(_GREEN_700), alignment=TA_RIGHT, leading=17)),
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

    extenso_text = valor_por_extenso(float(sale.total_price))
    elements.append(Paragraph(f"<i>({extenso_text})</i>", extenso_style))

    if sale.notes:
        notes_box = Table(
            [[Paragraph(f"<b>Observações:</b> {sale.notes}", cell_style)]],
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
        "Este recibo comprova o pagamento referente ao material didático indicado acima. "
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
    if logo_path:
        try:
            os.unlink(logo_path)
        except OSError:
            pass
    return stream.getvalue()
