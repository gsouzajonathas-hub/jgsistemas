import io
from datetime import date, datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.platypus import Image as RLImage

from app.services.receipt_service import _school_logo


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
    return s[8:10] + "/" + s[5:7] + "/" + s[:4] if len(s) >= 10 else s


def build_contract_pdf(data: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=16 * mm, bottomMargin=18 * mm,
        title="Contrato de Prestação de Serviços Educacionais",
    )
    ss = getSampleStyleSheet()

    st_title = ParagraphStyle("cTitle", parent=ss["Normal"], fontName="Helvetica-Bold",
                              fontSize=13, leading=17, alignment=TA_CENTER, spaceAfter=2)
    st_sub = ParagraphStyle("cSub", parent=ss["Normal"], fontName="Helvetica",
                            fontSize=9.5, leading=13, alignment=TA_CENTER,
                            textColor=colors.HexColor("#334155"))
    st_h = ParagraphStyle("cH", parent=ss["Normal"], fontName="Helvetica-Bold",
                          fontSize=10, leading=14, spaceBefore=10, spaceAfter=3)
    st_body = ParagraphStyle("cBody", parent=ss["Normal"], fontName="Helvetica",
                             fontSize=9.5, leading=14, alignment=TA_JUSTIFY)
    st_small = ParagraphStyle("cSmall", parent=ss["Normal"], fontName="Helvetica",
                              fontSize=8, leading=11, alignment=TA_CENTER,
                              textColor=colors.HexColor("#64748B"))
    st_sig = ParagraphStyle("cSig", parent=ss["Normal"], fontName="Helvetica",
                            fontSize=9.5, leading=14, alignment=TA_CENTER)

    story = []

    school = data.get("school", {})

    logo = data.get("school", {}).get("logo")
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
    story.append(Paragraph("CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS", st_title))

    # 1. Partes
    stu = data.get("student", {})
    guard = data.get("guardian") or {}
    story.append(Paragraph("1. DAS PARTES", st_h))
    esc = ("<b>CONTRATADA:</b> " + " — ".join(x for x in [
        school.get("name") or "",
        f"CNPJ {school['cnpj']}" if school.get("cnpj") else "",
        school.get("address") or "",
    ] if x))
    aluno_line = f"<b>{stu.get('name', '')}</b>"
    for lbl, key in (("CPF", "cpf"), ("nasc.", "birth_date"), ("fone", "phone"), ("e-mail", "email")):
        if stu.get(key):
            aluno_line += f" — {lbl}: {stu[key]}"
    if stu.get("address"):
        aluno_line += f" — Endereço: {stu['address']}"
    story.append(Paragraph(esc, st_body))
    story.append(Paragraph(f"<b>CONTRATANTE/ALUNO:</b> {aluno_line}", st_body))
    if guard.get("name"):
        g = f"<b>{guard['name']}</b>"
        for lbl, key in (("CPF", "cpf"), ("fone", "phone"), ("e-mail", "email")):
            if guard.get(key):
                g += f" — {lbl}: {guard[key]}"
        story.append(Paragraph(
            f"<b>RESPONSÁVEL LEGAL</b> (na forma dos arts. 166 e 168 do Código Civil): {g}", st_body))

    # 2. Objeto
    c = data.get("contract", {})
    p = data.get("plan", {})
    curso = data.get("course_name") or "Curso de idiomas"
    story.append(Paragraph("2. DO OBJETO E DA VIGÊNCIA", st_h))
    story.append(Paragraph(
        f"O presente contrato tem por objeto a prestação de serviços educacionais no curso de "
        f"<b>{curso}</b>, com carga horária e metodologia definidos pela CONTRATADA, pelo período de "
        f"<b>{p.get('duration_months', 1)} mês(es)</b>, iniciando em <b>{_d(c.get('start_date'))}</b> e "
        f"terminando em <b>{_d(c.get('end_date'))}</b>. A modalidade das aulas será informada pela "
        f"CONTRATADA na grade de horários vigente.", st_body))

    # 3. Plano
    story.append(Paragraph("3. DO PLANO CONTRATADO E VALORES", st_h))
    desc_txt = "Isento"
    if float(p.get("discount_amount") or 0) > 0:
        if (p.get("discount_type") or "").lower() == "percent":
            desc_txt = f"Desconto de {p.get('discount_value')}% ({_brl(p.get('discount_amount'))})"
        else:
            desc_txt = f"Desconto fixo de {_brl(p.get('discount_amount'))}"
    rows = [
        ["Plano contratado", str(p.get("name", ""))],
        ["Valor mensal de referência", _brl(p.get("monthly_value"))],
        ["Total sem desconto", _brl(p.get("gross_total"))],
        ["Desconto do plano", desc_txt],
        ["VALOR CONTRATADO", _brl(p.get("final_value"))],
    ]
    t = Table(rows, colWidths=[70 * mm, 100 * mm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F8FAFC")),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#EFF6FF")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)

    # 4. Pagamento
    story.append(Paragraph("4. DA FORMA DE PAGAMENTO", st_h))
    n = int(c.get("installments_count") or 1)
    modo = "à vista" if c.get("mode") == "upfront" else f"{n} parcela(s)"
    txt = f"O valor contratado será pago na forma <b>{modo}</b>, conforme quadro abaixo:"
    if c.get("upfront_discount_amount") and float(c["upfront_discount_amount"]) > 0:
        txt += (f" optando pelo pagamento à vista, foi concedido desconto adicional de "
                f"{_brl(c['upfront_discount_amount'])}.")
    story.append(Paragraph(txt, st_body))
    story.append(Spacer(1, 3))
    head = [["Parcela", "Vencimento", "Valor"]]
    for parc in data.get("parcels", []):
        head.append([f"{parc['number']}/{n}", _d(parc["due_date"]), _brl(parc["amount"])])
    pt = Table(head, colWidths=[40 * mm, 65 * mm, 65 * mm])
    pt.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
    ]))
    story.append(pt)
    story.append(Paragraph(
        "Os pagamentos poderão ser realizados pelos meios indicados pela CONTRATADA, considerando-se "
        "quite a parcela mediante a confirmação do respectivo recebimento.", st_body))

    # 5. Material didático
    story.append(Paragraph("5. DO MATERIAL DIDÁTICO", st_h))
    story.append(Paragraph(
        "O material didático não está incluído no valor do plano, salvo se expressamente acordado entre "
        "as partes, podendo ser adquirido separadamente junto à CONTRATADA.", st_body))

    # 6. Faltas
    story.append(Paragraph("6. DAS FALTAS E REPOSIÇÕES", st_h))
    story.append(Paragraph(
        "A ausência do aluno às aulas não altera o valor devido. A reposição de aulas dependerá da "
        "disponibilidade de turma compatível e deverá ser solicitada com antecedência. Aulas "
        "canceladas pela CONTRATADA serão repostas.", st_body))

    # 7. Inadimplência
    story.append(Paragraph("7. DA INADIMPLÊNCIA", st_h))
    story.append(Paragraph(
        "Parcelas em atraso estarão sujeitas à multa não compensatória de 2% (dois por cento) e juros "
        "de mora de 1% (um por cento) ao mês, pro rata die, nos termos do art. 389 do Código Civil e "
        "da legislação consumerista aplicável. O não pagamento poderá ensejar as medidas previstas em "
        "lei, sendo vedada a suspensão de aulas sem prévia comunicação e observância da legislação "
        "vigente.", st_body))

    # 8. Cancelamento
    story.append(Paragraph("8. DO CANCELAMENTO", st_h))
    story.append(Paragraph(
        "O cancelamento antes do término do período contratado deverá ser comunicado por escrito. "
        "São devidas as parcelas correspondentes aos meses decorridos e/ou aulas ministradas até a "
        "data da efetivação, aplicando-se o Código de Defesa do Consumidor, inclusive o direito de "
        "arrependimento em contratações fora do estabelecimento comercial (art. 49).", st_body))

    # 9. Renovação
    story.append(Paragraph("9. DA RENOVAÇÃO", st_h))
    story.append(Paragraph(
        "Não há renovação automática. A continuidade dos estudos após o término da vigência dependerá "
        "de novo contrato ou aditivo, nas condições então vigentes.", st_body))

    # 10. Certificação
    story.append(Paragraph("10. DA CONCLUSÃO", st_h))
    story.append(Paragraph(
        "Ao término do período, o aluno terá direito à declaração de conclusão do nível cursado, "
        "condicionada à frequência mínima de 75% (setenta e cinco por cento) e à quitação das "
        "obrigações financeiras.", st_body))

    # 11. LGPD
    story.append(Paragraph("11. DA PROTEÇÃO DE DADOS PESSOAIS (LGPD)", st_h))
    story.append(Paragraph(
        "As partes tratarão os dados pessoais fornecidos exclusivamente para fins de gestão acadêmica, "
        "financeira e de comunicação institucional, observados a Lei nº 13.709/2018 (LGPD) e demais "
        "normas aplicáveis, garantidos os direitos do titular previstos em lei.", st_body))

    # 12. Geral
    story.append(Paragraph("12. DISPOSIÇÕES GERAIS", st_h))
    story.append(Paragraph(
        "Este contrato expressa toda a avença entre as partes, ficando sem efeito acordos verbais "
        "anteriores não formalizados por escrito. Fica eleito o foro do domicílio do consumidor para "
        "dirimir questões oriundas deste instrumento, com renúncia a qualquer outro, por mais "
        "privilegiado que seja.", st_body))

    # Assinaturas
    story.append(Spacer(1, 18))
    city_date = f"{data.get('city') or ''}{', ' if data.get('city') else ''}{_d(datetime.now())}"
    story.append(Paragraph(city_date, st_sig))
    story.append(Spacer(1, 24))
    sig_t = Table(
        [[Paragraph("_________________________________<br/><b>CONTRATADA</b><br/>" + str(school.get("name") or ""), st_sig),
          Paragraph("_________________________________<br/><b>" +
                    ("ALUNO(A)" if not guard.get("name") else "ALUNO(A), ASSINANDO COMO RESPONSÁVEL LEGAL O MENOR") +
                    "</b><br/>" + str(stu.get("name", "")), st_sig)]],
        colWidths=[85 * mm, 85 * mm])
    sig_t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(sig_t)
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        f"Documento gerado eletronicamente pelo sistema {school.get('name') or 'de gestão escolar'} em "
        f"{datetime.now().strftime('%d/%m/%Y %H:%M')} · Contrato nº {data.get('contract_number', '')} · "
        "Sugere-se revisão jurídica previamente ao uso oficial.", st_small))

    doc.build(story)
    return buf.getvalue()
