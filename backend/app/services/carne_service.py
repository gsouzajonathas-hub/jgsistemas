import io
import os

from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF

from app.utils.paths import get_upload_path

MONTHS_PT = [
    "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

NAVY_950 = "#01182F"
NAVY_900 = "#022344"
NAVY_800 = "#0A3059"
NAVY_700 = "#143456"
NAVY_100 = "#DCE6F0"
RED_600 = "#F97316"

RED_700 = "#C2410C"

RED_50 = "#FFF7ED"
GREEN_700 = "#1F7A3F"
GREEN_600 = "#27995C"
GREEN_50 = "#E8F5EC"

SLATE_900 = "#0F172A"
SLATE_800 = "#1E293B"
SLATE_700 = "#334155"
SLATE_600 = "#475569"
SLATE_500 = "#64748B"
SLATE_400 = "#94A3B8"
SLATE_300 = "#CBD5E1"
SLATE_200 = "#E2E8F0"
SLATE_100 = "#F1F5F9"
SLATE_50 = "#F8FAFC"

INTERVAL_LABELS = {
    "monthly": "Mensal",
    "bimonthly": "Bimestral",
    "quarterly": "Trimestral",
    "quadrimestral": "Quadrimestral",
    "semiannual": "Semestral",
    "annual": "Anual",
}

CHARGE_LABELS = {
    "mensalidade": "MENSALIDADE",
    "monthly": "MENSALIDADE",
    "matricula": "MATRÍCULA",
    "enrollment": "MATRÍCULA",
    "material": "MATERIAL DIDÁTICO",
}

PAGE_W, PAGE_H = A4
ML = 9 * mm
MR = 9 * mm
FOOTER_BAND_H = 14 * mm


def _hex(h):
    return colors.HexColor(h)


def _clean_methods(raw):
    methods = []
    for m in str(raw or "").split(","):
        m = m.strip()
        if m and m.lower() != "boleto" and m not in methods:
            methods.append(m)
    return methods or ["PIX", "Dinheiro", "Cartão"]


def _draw_qr(c, data, x, y_bottom, size):
    try:
        qr = QrCodeWidget(data, barLevel="M")
        b = qr.getBounds()
        factor = size / float(max(b[2] - b[0], b[3] - b[1]))
        d = Drawing(size, size, transform=[factor, 0, 0, factor, 0, 0])
        d.add(qr)
        renderPDF.draw(d, c, x, y_bottom)
        return True
    except Exception:
        return False


def _fmt_brl(v):
    return f"R$ {float(v or 0):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _format_date(d):
    if isinstance(d, str):
        parts = d.split("-")
        return f"{parts[2]}/{parts[1]}/{parts[0]}" if len(parts) == 3 else d
    if hasattr(d, "strftime"):
        return d.strftime("%d/%m/%Y")
    return str(d)


def _month_banner(due_str):
    try:
        y, m = int(str(due_str)[:4]), int(str(due_str)[5:7])
        if 1 <= m <= 12:
            return f"{MONTHS_PT[m].upper()}/{y}"
    except (ValueError, IndexError):
        pass
    return "MENSALIDADE"


def _interval_label(iv):
    return INTERVAL_LABELS.get((iv or "").strip().lower(), (iv or "").strip().capitalize())


def _charge_label(ct):
    ct = (ct or "mensalidade").strip().lower()
    return CHARGE_LABELS.get(ct, ct.upper())


def _truncate(c, text, font, size, max_w):
    text = str(text or "")
    if stringWidth(text, font, size) <= max_w:
        return text
    while text and stringWidth(text + "..", font, size) > max_w:
        text = text[:-1]
    return text + ".."


def _student_address(student):
    if not student:
        return ""
    street = " ".join(filter(None, [getattr(student, "street", ""), getattr(student, "number", "")]))
    parts = []
    if street:
        parts.append(street)
    nb = getattr(student, "neighborhood", "")
    if nb:
        parts.append(nb)
    city_state = " - ".join(filter(None, [getattr(student, "city", ""), getattr(student, "state", "")]))
    if city_state:
        parts.append(city_state)
    zip_code = getattr(student, "zip_code", "")
    if zip_code:
        parts.append(f"CEP {zip_code}")
    return ", ".join(parts)


def _split_schedule(schedule):
    s = str(schedule or "").strip()
    if not s:
        return "", ""
    import re
    m = re.search(r"(\d{1,2}[:h]\d{2}.*)$", s)
    if m:
        days = s[:m.start()].strip(" -,")
        times = m.group(1).strip()
        return days, times
    return s, ""


def _compute_summary(installments):
    paid = pending = late = 0.0
    total_net = 0.0
    for i in installments:
        net = float(i.get("amount", 0)) - float(i.get("discount", 0) or 0)
        total_net += net
        st = i.get("status")
        if st == "paid":
            paid += net
        elif st == "overdue":
            late += net
        elif st != "cancelled":
            pending += net
    return {"paid": paid, "pending": pending, "late": late, "total_net": total_net}


def _kv(c, x, y, label, value, lsize=6.4, vsize=7.2, lw=None, vw=None,
        bold=True, vcolor=None, indent_v=None):
    c.setFillColor(_hex(SLATE_500))
    c.setFont("Helvetica-Bold", lsize)
    c.drawString(x, y, label)
    vx = x + (indent_v if indent_v is not None else stringWidth(label, "Helvetica-Bold", lsize) + 1.2 * mm)
    v = str(value if value not in (None, "") else "—")
    avail = vw if vw else (c._pagesize[0] - MR - vx)
    c.setFillColor(vcolor or _hex(SLATE_800))
    c.setFont("Helvetica-Bold" if bold else "Helvetica", vsize)
    c.drawString(vx, y, _truncate(c, v, "Helvetica-Bold" if bold else "Helvetica", vsize, avail))


def _checkbox_row(c, x, y_baseline, methods, color=SLATE_600, max_x=None):
    cur = x
    for m in methods:
        step_est = 4.2 * mm + stringWidth(m, "Helvetica", 6.2) + 5 * mm
        if max_x and cur + step_est > max_x:
            break
        c.setStrokeColor(_hex(SLATE_400))
        c.setLineWidth(0.7)
        c.rect(cur, y_baseline - 0.6 * mm, 2.6 * mm, 2.6 * mm, fill=0, stroke=1)
        c.setFillColor(_hex(color))
        c.setFont("Helvetica", 6.2)
        c.drawString(cur + 3.8 * mm, y_baseline, m)
        cur += step_est


def _card_header(c, x, y_top, card_w, title, accent=RED_600):
    hh = 7.6 * mm
    bottom = y_top - hh
    c.setFillColor(colors.white)
    c.setStrokeColor(_hex(SLATE_200))
    c.setLineWidth(0.8)
    c.roundRect(x, bottom, card_w, hh, 2.2 * mm, fill=1, stroke=1)
    c.setFillColor(_hex(accent))
    c.rect(x + 4 * mm, y_top - 5.4 * mm, 1.6 * mm, 1.6 * mm, fill=1, stroke=0)
    c.setFillColor(_hex(NAVY_900))
    c.setFont("Helvetica-Bold", 7.8)
    c.drawString(x + 7 * mm, y_top - 5.5 * mm, title)
    return y_top - 11 * mm


def _draw_emblem(c, settings, x, y_top, size):
    logo_path = None
    if settings and getattr(settings, "logo_url", None):
        p = get_upload_path(settings.logo_url)
        if os.path.exists(p):
            logo_path = p
    if logo_path:
        try:
            c.drawImage(logo_path, x, y_top - size, width=size, height=size,
                        preserveAspectRatio=True, mask='auto')
            return
        except Exception:
            pass
    c.setFillColor(_hex(NAVY_900))
    c.roundRect(x, y_top - size, size, size, 4 * mm, fill=1, stroke=0)
    c.setFillColor(_hex(RED_600))
    c.rect(x, y_top - size, size, 2.2 * mm, fill=1, stroke=0)
    name = (settings.school_name if settings and settings.school_name else "ESCOLA").upper()
    words = [w for w in name.split() if w]
    n = min(3, len(words))
    if n == 0:
        words, n = ["ESCOLA"], 1
    step = len(words) // n
    lines = [" ".join(words[i * step:(i + 1) * step]) for i in range(n - 1)]
    lines.append(" ".join(words[(n - 1) * step:]))
    fs = 15 if n <= 2 else 12
    ly = y_top - size * 0.52 + ((n - 1) * fs * 0.36) * mm / 2
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", fs)
    for ln in lines:
        c.drawCentredString(x + size / 2, ly, _truncate(c, ln, "Helvetica-Bold", fs, size - 8 * mm))
        ly -= fs * 0.42 * mm


def _draw_band_footer(c, settings, ref_label="", page_num=None, total_pages=None):
    c.setFillColor(_hex(NAVY_900))
    c.rect(0, 0, PAGE_W, FOOTER_BAND_H, fill=1, stroke=0)
    c.setFillColor(_hex(RED_600))
    c.rect(0, FOOTER_BAND_H, PAGE_W, 1.2 * mm, fill=1, stroke=0)

    school_name = settings.school_name if settings and settings.school_name else "Escola"
    slogan = getattr(settings, "slogan", "") or ""
    social = getattr(settings, "social_media", "") or ""

    ty = FOOTER_BAND_H * 0.58
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(ML, ty, _truncate(c, school_name, "Helvetica-Bold", 8, 62 * mm))

    mid_x = PAGE_W / 2
    if slogan:
        c.setFont("Helvetica-Oblique", 6.4)
        c.setFillColor(_hex(NAVY_100))
        quote = f'"{slogan}"'
        c.drawCentredString(mid_x, ty, _truncate(c, quote, "Helvetica-Oblique", 6.4, 74 * mm))
    if social:
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 6.8)
        c.drawRightString(PAGE_W - MR, ty, social)

    sub_bits = [b for b in (
        ref_label,
        f"Pág. {page_num}/{total_pages}" if page_num else "",
    ) if b]
    if sub_bits:
        c.setFont("Helvetica", 5.8)
        c.setFillColor(_hex("#8FA6BF"))
        c.drawString(ML, FOOTER_BAND_H - 3.4 * mm, "  |  ".join(sub_bits))


def _draw_cover_page(c, settings, student, responsible, carnet, installments,
                     course_info=None, contract_info=None, segunda_via=False,
                     charge_type="mensalidade"):
    ci = course_info or {}
    contract = contract_info or {}
    school_name = settings.school_name if settings else "Escola"

    carnet_id = carnet.get("id", 0)
    total_n = len(installments)
    first_due = carnet.get("first_due_date") or (installments[0].get("due_date") if installments else "") or ""
    year_letivo = first_due[:4] if first_due else ""
    due_day = first_due[8:10].lstrip("0") if first_due else ""
    methods = _clean_methods(carnet.get("payment_methods"))
    interval_lbl = _interval_label(carnet.get("interval"))

    gross_total = float(contract.get("gross_total") or 0) or sum(float(i.get("amount", 0)) for i in installments)
    discount_total = float(contract.get("discount_amount") or 0) or sum(float(i.get("discount", 0) or 0) for i in installments)
    final_total = float(contract.get("final_value") or contract.get("total_due") or 0) or \
        sum(float(i.get("amount", 0)) - float(i.get("discount", 0) or 0) for i in installments)

    monthly_ref = float(contract.get("monthly_value") or 0) or getattr(student, "monthly_fee", None)
    if not monthly_ref and total_n:
        monthly_ref = gross_total / total_n
    parcela_value = float(contract.get("monthly_value") or 0)
    if not parcela_value and installments:
        first = installments[0]
        parcela_value = float(first.get("amount", 0)) - float(first.get("discount", 0) or 0)

    summary = _compute_summary(installments)

    _draw_emblem(c, settings, 7 * mm, PAGE_H - 7 * mm, 48 * mm)

    ty = PAGE_H - 62 * mm
    c.setFillColor(_hex(NAVY_900))
    c.setFont("Helvetica-Bold", 19)
    c.drawString(ML, ty, "CARNÊ DE MENSALIDADES")
    tw = stringWidth("CARNÊ DE MENSALIDADES", "Helvetica-Bold", 19)
    c.setFillColor(_hex(RED_600))
    c.rect(ML, ty - 2.6 * mm, min(tw, 90 * mm), 1.1 * mm, fill=1, stroke=0)
    c.setFillColor(_hex(SLATE_500))
    c.setFont("Helvetica-Bold", 8.5)
    sub = f"ANO LETIVO {year_letivo}" if year_letivo else "CARNÊ DE PAGAMENTO"
    c.drawString(ML, ty - 7.5 * mm, sub)

    if segunda_via:
        bw, bh = 24 * mm, 6.5 * mm
        bx, by = PAGE_W - MR - bw, ty + 1 * mm
        c.setFillColor(_hex(RED_600))
        c.roundRect(bx, by, bw, bh, 2 * mm, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawCentredString(bx + bw / 2, by + 2 * mm, "2ª VIA")

    col_w = (PAGE_W - ML - MR - 5 * mm) / 2
    col1_x = ML
    col2_x = ML + col_w + 5 * mm
    cur1 = ty - 14 * mm
    cur2 = ty - 14 * mm

    inner1 = _card_header(c, col1_x, cur1, col_w, "DADOS DO ALUNO")
    r = inner1 - 1 * mm
    half_vw = col_w - 24 * mm
    _kv(c, col1_x + 4 * mm, r, "Nome:", student.full_name if student else "—",
        vw=col_w - 17 * mm, bold=True, vsize=7.8)
    r -= 5.2 * mm
    _kv(c, col1_x + 4 * mm, r, "Matrícula:",
        f"{year_letivo}-{getattr(student, 'id', 0):05d}" if student else "—", vw=half_vw)
    _kv(c, col1_x + 4 * mm + col_w / 2, r, "CPF:", getattr(student, "cpf", "") or "—",
        vw=col_w / 2 - 14 * mm)
    r -= 5.2 * mm
    _kv(c, col1_x + 4 * mm, r, "Nascimento:",
        _format_date(student.birth_date) if getattr(student, "birth_date", None) else "—", vw=half_vw)
    _kv(c, col1_x + 4 * mm + col_w / 2, r, "Telefone:", getattr(student, "phone", "") or "—",
        vw=col_w / 2 - 14 * mm)
    r -= 5.2 * mm
    _kv(c, col1_x + 4 * mm, r, "E-mail:", getattr(student, "email", "") or "—",
        vw=col_w - 17 * mm)
    r -= 5.2 * mm
    _kv(c, col1_x + 4 * mm, r, "Endereço:", _student_address(student) or "—",
        vw=col_w - 17 * mm)
    cur1 = inner1 - 5.2 * mm * 5 - 3 * mm

    days_s, time_s = _split_schedule(ci.get("schedule"))
    inner1 = _card_header(c, col1_x, cur1, col_w, "DADOS DO CURSO")
    r = inner1 - 1 * mm
    modalidade = f"{ci.get('course') or ''}{(' - ' + ci['level']) if ci.get('level') else ''}" or "—"
    _kv(c, col1_x + 4 * mm, r, "Modalidade:", modalidade, vw=col_w - 22 * mm)
    r -= 5.2 * mm
    if days_s:
        _kv(c, col1_x + 4 * mm, r, "Dias da semana:", days_s or "—", vw=half_vw)
    if time_s:
        _kv(c, col1_x + 4 * mm + col_w / 2, r, "Horário:", time_s or "—", vw=col_w / 2 - 14 * mm)
    elif days_s:
        pass
    else:
        _kv(c, col1_x + 4 * mm, r, "Horário:", "—", vw=half_vw)
    r -= 5.2 * mm
    _kv(c, col1_x + 4 * mm, r, "Período do curso:", ci.get("period") or "—", vw=col_w - 30 * mm)
    cur1 = inner1 - 5.2 * mm * 3 - 3 * mm

    inner2 = _card_header(c, col2_x, cur2, col_w, "RESPONSÁVEL FINANCEIRO")
    r = inner2 - 1 * mm
    parentesco = getattr(responsible, "parentesco", "") if responsible else ""
    _kv(c, col2_x + 4 * mm, r, "Nome:", getattr(responsible, "full_name", "") or "—",
        vw=col_w - 17 * mm, vsize=7.8)
    r -= 5.2 * mm
    _kv(c, col2_x + 4 * mm, r, "Parentesco:" if parentesco else "CPF:",
        parentesco if parentesco else ((getattr(responsible, "cpf", "") or "—") if responsible else "—"),
        vw=half_vw)
    _kv(c, col2_x + 4 * mm + col_w / 2, r, "Telefone:", getattr(responsible, "phone", "") or "—",
        vw=col_w / 2 - 14 * mm)
    r -= 5.2 * mm
    _kv(c, col2_x + 4 * mm, r, "E-mail:", getattr(responsible, "email", "") or "—",
        vw=col_w - 17 * mm)
    cur2 = inner2 - 5.2 * mm * 3 - 3 * mm

    inner2 = _card_header(c, col2_x, cur2, col_w, "PLANO CONTRATADO")
    r = inner2 - 1 * mm
    plan_name = ci.get("plan") or ""
    if plan_name:
        _kv(c, col2_x + 4 * mm, r, "Plano:", plan_name, vw=col_w - 14 * mm)
        r -= 5.2 * mm
    _kv(c, col2_x + 4 * mm, r, "Valor mensal de referência:", _fmt_brl(monthly_ref),
        vw=col_w - 40 * mm)
    r -= 5.2 * mm
    _kv(c, col2_x + 4 * mm, r, "Valor sem desconto:", _fmt_brl(gross_total), vw=half_vw)
    _kv(c, col2_x + 4 * mm + col_w / 2, r, "Desconto do plano:",
        f"- {_fmt_brl(discount_total)}" if discount_total > 0 else "—", vw=col_w / 2 - 30 * mm,
        vcolor=_hex(GREEN_700) if discount_total > 0 else None)
    r -= 5.2 * mm
    _kv(c, col2_x + 4 * mm, r, "Quantidade de parcelas:",
        f"{total_n}x" + (f" ({interval_lbl})" if interval_lbl else ""), vw=half_vw)
    _kv(c, col2_x + 4 * mm + col_w / 2, r, "Valor da parcela:", _fmt_brl(parcela_value),
        vw=col_w / 2 - 26 * mm)
    r -= 5.2 * mm
    _kv(c, col2_x + 4 * mm, r, "Dia de vencimento:",
        f"dia {due_day} de cada mês" if due_day else "—", vw=half_vw)
    _kv(c, col2_x + 4 * mm + col_w / 2, r, "Forma de pagamento:", " / ".join(methods),
        vw=col_w / 2 - 28 * mm)
    r -= 7.6 * mm

    box_h = 8.5 * mm
    c.setFillColor(_hex(RED_600))
    c.roundRect(col2_x + 4 * mm, r - box_h + 2.4 * mm, col_w - 8 * mm, box_h, 2 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawCentredString(col2_x + col_w / 2, r - box_h + 4.8 * mm,
                        f"VALOR CONTRATADO:  {_fmt_brl(final_total)}")
    cur2 = r - box_h - 3 * mm

    strip_y = min(cur1, cur2) - 2 * mm
    block_gap = 3 * mm
    bw_total = PAGE_W - ML - MR
    bw_each = (bw_total - 3 * block_gap) / 4
    bx = ML
    block_defs = [
        ("INFORMAÇÕES IMPORTANTES", None),
        ("FALE CONOSCO", None),
        ("FORMAS DE PAGAMENTO", None),
        ("RESUMO FINANCEIRO", None),
    ]
    late_fee_pct = carnet.get("late_fee_pct", 2)
    interest_d = carnet.get("interest_daily_pct", 0.033)

    bullets = [
        f"Pagamento após o vencimento será acrescido de multa de {late_fee_pct}% e juros de {interest_d}% ao dia.",
        "Em caso de atraso, o aluno poderá ter o acesso às aulas suspenso até a regularização.",
        "Atenção: guarde seu comprovante de pagamento.",
        "Em caso de dúvidas, entre em contato com a secretaria.",
    ]

    pay_lines_map = {
        "pix": "escaneie o QR Code da via desejada",
        "dinheiro": "pague na secretaria da escola",
        "cartão": "consulte condições e taxas",
        "debito": "consulte condições e taxas",
        "crédito": "consulte condições e taxas",
        "transferência": "entre em contato com a secretaria",
    }

    def draw_block(x, w, title, lines, bullet_mode=False):
        c.setFillColor(_hex(NAVY_900))
        c.setFont("Helvetica-Bold", 6.8)
        c.drawString(x, strip_y, title)
        c.setStrokeColor(_hex(RED_600))
        c.setLineWidth(0.9)
        c.line(x, strip_y - 2 * mm, x + w, strip_y - 2 * mm)
        ly = strip_y - 6 * mm
        if bullet_mode:
            for b in lines:
                c.setFillColor(_hex(SLATE_500))
                c.setFont("Helvetica", 5.6)
                c.drawString(x, ly, "•")
                c.drawString(x + 2.4 * mm, ly,
                             _truncate(c, b, "Helvetica", 5.6, w - 3 * mm))
                ly -= 4.4 * mm
        else:
            for ln in lines:
                c.setFillColor(_hex(SLATE_600))
                c.setFont("Helvetica", 5.8)
                c.drawString(x, ly, _truncate(c, ln, "Helvetica", 5.8, w))
                ly -= 4.4 * mm

    titles = [t for t, _ in block_defs]
    draw_block(bx, bw_each, titles[0], bullets, bullet_mode=True)

    phone_line = f"Tel: {settings.phone}" if settings and settings.phone else ""
    email_line = settings.email if settings and settings.email else ""
    addr_line = settings.address if settings and settings.address else ""
    contact_lines = [b for b in (phone_line, email_line, addr_line) if b]
    draw_block(bx + (bw_each + block_gap), bw_each, titles[1], contact_lines)

    pay_lines = []
    for m in methods:
        key = m.strip().lower()
        pay_lines.append(f"{m}: {pay_lines_map.get(key, 'consulte a secretaria')}")
    draw_block(bx + 2 * (bw_each + block_gap), bw_each, titles[2], pay_lines)

    resumo_lines = [
        f"Valor total contratado: {_fmt_brl(final_total)}",
        f"Total pago: {_fmt_brl(summary['paid'])}",
        f"Total pendente: {_fmt_brl(summary['pending'])}",
        f"Em atraso: {_fmt_brl(summary['late'])}",
    ]
    draw_block(bx + 3 * (bw_each + block_gap), bw_each, titles[3], resumo_lines)

    ref_label = f"Carnê #{str(carnet_id).zfill(4)}" if carnet_id else "Ficha Financeira do Aluno"
    _draw_band_footer(c, settings, ref_label=ref_label)


CARD_H = 118 * mm
CARD_W = 93 * mm
COL_X = [ML, ML + CARD_W + 5 * mm]
ROW_TOPS = None
CUT_ZONE = 7 * mm


def _draw_cut_line(c, x, w, cy):
    label = "DESTAQUE AQUI"
    c.setFillColor(_hex(SLATE_400))
    c.setFont("Helvetica-Bold", 5.6)
    lw = stringWidth(label, "Helvetica-Bold", 5.6)
    cxm = x + w / 2
    c.setStrokeColor(_hex(SLATE_300))
    c.setLineWidth(0.6)
    c.setDash(3, 2)
    c.line(x + 1 * mm, cy, cxm - lw / 2 - 2.5 * mm, cy)
    c.line(cxm + lw / 2 + 2.5 * mm, cy, x + w - 1 * mm, cy)
    c.setDash()
    c.drawString(cxm - lw / 2, cy - 1.6 * mm, label)


def _draw_installment_card(c, x, y_top, inst, via_num, via_total, student,
                           settings, pix_payload="", payment_methods="",
                           course_info=None, contract_info=None,
                           charge_type="mensalidade", interval=""):
    ci = course_info or {}
    status = inst.get("status")
    disc = float(inst.get("discount", 0) or 0)
    net = float(inst.get("amount", 0)) - disc
    due = inst.get("due_date", "")
    banner = _month_banner(due)
    has_qr = bool(pix_payload) and status != "paid"
    methods = _clean_methods(payment_methods)

    body_bottom = y_top - CARD_H

    c.setFillColor(colors.white)
    c.setStrokeColor(_hex(SLATE_200))
    c.setLineWidth(0.8)
    c.roundRect(x, body_bottom, CARD_W, CARD_H, 2.5 * mm, fill=1, stroke=1)

    banner_h = 10.5 * mm
    c.setFillColor(_hex(NAVY_900))
    c.roundRect(x, y_top - banner_h, CARD_W, banner_h, 2.5 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(x + 7 * mm, y_top - 7.3 * mm, banner)

    right_x = x + CARD_W - 5 * mm
    badge_txt, badge_color = None, None
    if status == "paid":
        badge_txt, badge_color = "PAGO", GREEN_600
    elif status == "overdue":
        badge_txt, badge_color = "EM ATRASO", RED_600
    via_txt = f"VIA {via_num}/{via_total}"
    c.setFont("Helvetica-Bold", 6.8)
    via_tw = stringWidth(via_txt, "Helvetica-Bold", 6.8)
    bx_right = right_x
    if badge_txt:
        bw = stringWidth(badge_txt, "Helvetica-Bold", 6) + 4 * mm
        bx = right_x - via_tw - 3 * mm - bw
        c.setFillColor(_hex(badge_color))
        c.roundRect(bx, y_top - 8.6 * mm, bw, 4.2 * mm, 1.8 * mm, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 6)
        c.drawCentredString(bx + bw / 2, y_top - 7.5 * mm, badge_txt)
        bx_right = bx - 2.5 * mm
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 6.8)
    c.drawString(bx_right - via_tw, y_top - 7.3 * mm, via_txt)

    c.setFillColor(_hex(RED_600))
    c.rect(x, body_bottom + 2.5 * mm, 2 * mm, CARD_H - 5 * mm, fill=1, stroke=0)

    lx = x + 7 * mm
    ly = y_top - banner_h - 6.5 * mm
    c.setFillColor(_hex(SLATE_500))
    c.setFont("Helvetica-Bold", 6)
    c.drawString(lx, ly, _charge_label(charge_type))
    c.setFillColor(_hex(SLATE_400))
    c.setFont("Helvetica-Bold", 5.4)
    c.drawString(lx, ly - 4.6 * mm, "ALUNO(A)")
    c.setFillColor(_hex(NAVY_900))
    c.setFont("Helvetica-Bold", 8.2)
    c.drawString(lx, ly - 9.4 * mm,
                 _truncate(c, student.full_name if student else "", "Helvetica-Bold", 8.2, CARD_W * 0.52))

    year_letivo = due[:4] if due else ""
    interval_lbl = _interval_label(interval)
    rows = [
        ("Matrícula: ", f"{year_letivo}-{getattr(student, 'id', 0):05d}" if student else "—"),
        ("Curso: ", f"{ci.get('course') or ''}{(' - ' + ci['level']) if ci.get('level') else ''}" or "—"),
    ]
    if interval_lbl:
        rows.append(("Planejamento: ", interval_lbl))
    if ci.get("period"):
        rows.append(("Período: ", ci.get("period")))
    ry = ly - 15 * mm
    for lbl, val in rows:
        c.setFillColor(_hex(SLATE_500))
        c.setFont("Helvetica-Bold", 6.2)
        c.drawString(lx, ry, lbl)
        off = stringWidth(lbl, "Helvetica-Bold", 6.2) + 0.8 * mm
        c.setFillColor(_hex(SLATE_700))
        c.setFont("Helvetica", 6.2)
        c.drawString(lx + off, ry, _truncate(c, val, "Helvetica", 6.2, CARD_W * 0.52 - off))
        ry -= 4.8 * mm

    rx = x + CARD_W - 6 * mm

    def right_line(y, label_txt, value_txt, vsize, vcolor, lbold=False):
        c.setFillColor(_hex(SLATE_400))
        c.setFont("Helvetica-Bold" if lbold else "Helvetica", 5.4)
        c.drawRightString(rx, y, label_txt)
        c.setFillColor(_hex(vcolor))
        c.setFont("Helvetica-Bold", vsize)
        c.drawRightString(rx, y - 4.6 * mm, value_txt)
        return y - 4.6 * mm - (vsize * 0.42) * mm - 1.6 * mm

    vy = y_top - banner_h - 6.5 * mm
    vy = right_line(vy, "VENCIMENTO", _format_date(due), 10, NAVY_900, lbold=True)
    if disc > 0:
        vy = right_line(vy, "VALOR DA PARCELA", _fmt_brl(float(inst.get("amount", 0))), 8.5, SLATE_800)
        vy = right_line(vy, "DESCONTO ATÉ O VENCIMENTO", f"- {_fmt_brl(disc)}", 7.5, GREEN_700)
        vy = right_line(vy, "VALOR COM DESCONTO", _fmt_brl(net), 11.5, GREEN_700)
    else:
        vy = right_line(vy, "VALOR DA PARCELA", _fmt_brl(net), 11.5, NAVY_900)

    div_y = body_bottom + 33 * mm
    c.setStrokeColor(_hex(SLATE_300))
    c.setLineWidth(0.5)
    c.setDash(3, 2)
    c.line(x + 5 * mm, div_y, x + CARD_W - 5 * mm, div_y)
    c.setDash()

    cb_y = body_bottom + 6.5 * mm
    if has_qr:
        qr_size = 24 * mm
        qr_ok = _draw_qr(c, pix_payload, lx, div_y - 3.5 * mm - qr_size, qr_size)
        if qr_ok:
            c.setFillColor(_hex(SLATE_400))
            c.setFont("Helvetica", 4.8)
            c.drawCentredString(lx + qr_size / 2, div_y - 3.5 * mm - qr_size - 3 * mm, "QR Code PIX")
        tx = lx + qr_size + 5 * mm
        c.setFillColor(_hex(NAVY_900))
        c.setFont("Helvetica-Bold", 7.5)
        c.drawString(tx, div_y - 8 * mm, "PAGUE COM PIX")
        c.setFillColor(_hex(SLATE_500))
        c.setFont("Helvetica", 5.8)
        c.drawString(tx, div_y - 12.5 * mm, "Aponte a câmera do celular para")
        c.drawString(tx, div_y - 15.7 * mm, "o QR Code e pague pelo app do banco")
        _checkbox_row(c, tx, cb_y, methods, max_x=x + CARD_W - 6 * mm)
    elif status == "paid":
        c.setFillColor(_hex(GREEN_700))
        c.setFont("Helvetica-Bold", 9.5)
        c.drawCentredString(x + CARD_W / 2, div_y - 12 * mm, "PARCELA QUITADA")
        c.setFillColor(_hex(SLATE_400))
        c.setFont("Helvetica", 6)
        paid_date = inst.get("paid_date")
        sub = f"Pagamento confirmado em {_format_date(paid_date)}" if paid_date else "Pagamento confirmado"
        c.drawCentredString(x + CARD_W / 2, div_y - 17.5 * mm, sub)
    else:
        c.setFillColor(_hex(NAVY_900))
        c.setFont("Helvetica-Bold", 7.2)
        c.drawString(lx, div_y - 8 * mm, "FORMAS DE PAGAMENTO")
        c.setFillColor(_hex(SLATE_500))
        c.setFont("Helvetica", 5.8)
        c.drawString(lx, div_y - 12.5 * mm, "Escolha uma das opções abaixo e pague")
        c.drawString(lx, div_y - 15.7 * mm, "na secretaria ou pelo aplicativo do banco")
        _checkbox_row(c, lx, cb_y, methods, max_x=x + CARD_W - 6 * mm)

    return body_bottom


def _render_carne(c, carnet_dict, inst_data, student, responsible, settings,
                  course_info=None, contract_info=None, segunda_via=False,
                  charge_type="mensalidade"):
    _draw_cover_page(c, settings, student, responsible, carnet_dict, inst_data,
                     course_info=course_info, contract_info=contract_info,
                     segunda_via=segunda_via, charge_type=charge_type)

    total_vias = len([i for i in inst_data if i.get("status") != "cancelled"])
    school_name = settings.school_name if settings else "Escola"
    payment_methods = carnet_dict.get("payment_methods") or ""

    pix_key = (getattr(settings, "pix_key", "") or "").strip() if settings else ""
    pix_name = settings.school_name if settings else ""
    from app.utils.pix import build_pix_payload, pix_city_from_address
    pix_city = pix_city_from_address(settings.address) if settings else ""

    per_page = 4
    total_paginas = max(1, (total_vias + per_page - 1) // per_page)

    via = 0
    for pagina in range(total_paginas):
        c.showPage()
        row_tops = [PAGE_H - 14 * mm, PAGE_H - 14 * mm - CARD_H - CUT_ZONE]

        for slot in range(per_page):
            idx = pagina * per_page + slot
            if idx >= len(inst_data):
                break
            inst = inst_data[idx]
            if inst.get("status") == "cancelled":
                continue
            via += 1
            row_i = slot // 2
            col_i = slot % 2
            y_top = row_tops[row_i]
            x = COL_X[col_i]
            if col_i == 0:
                _draw_cut_line(c, x, CARD_W * 2 + 5 * mm, y_top + CUT_ZONE - 2.5 * mm)

            pix_payload = ""
            if pix_key and inst.get("status") != "paid":
                try:
                    pix_payload = build_pix_payload(
                        pix_key, pix_name, pix_city,
                        amount=float(inst.get("amount", 0)) - float(inst.get("discount", 0) or 0),
                        txid=f"PARC{inst.get('id', idx)}")
                except Exception:
                    pix_payload = ""

            _draw_installment_card(
                c, x, y_top, inst, via, total_vias, student, settings,
                pix_payload=pix_payload, payment_methods=payment_methods,
                course_info=course_info, contract_info=contract_info,
                charge_type=carnet_dict.get("charge_type", charge_type),
                interval=carnet_dict.get("interval", ""))

        carnet_id = carnet_dict.get("id", 0)
        ref_label = f"Carnê #{str(carnet_id).zfill(4)}" if carnet_id else "Ficha Financeira do Aluno"
        if segunda_via:
            ref_label += " (2ª via)"
        _draw_band_footer(c, settings, ref_label=ref_label,
                          page_num=pagina + 2, total_pages=total_paginas + 1)

    c.save()


def build_carne_pdf(carnet, installments, student, responsible, settings,
                    course_info=None, contract_info=None) -> bytes:
    stream = io.BytesIO()
    c = canvas.Canvas(stream, pagesize=A4)

    _render_carne(c, carnet, installments, student, responsible, settings,
                  course_info=course_info, contract_info=contract_info,
                  charge_type=carnet.get("charge_type", "mensalidade"))
    return stream.getvalue()


def build_carne_pdf_custom(inst_data, student, responsible, settings,
                           course_info=None, contract_info=None, segunda_via=False,
                           charge_type="mensalidade", interval="") -> bytes:
    first = inst_data[0] if inst_data else {}
    carnet_dict = {
        "id": 0,
        "charge_type": charge_type,
        "interval": interval,
        "installment_value": float(first.get("amount", 0)) - float(first.get("discount", 0) or 0),
        "total_value": sum(float(i.get("amount", 0)) - float(i.get("discount", 0) or 0) for i in inst_data),
        "first_due_date": first.get("due_date", ""),
        "payment_methods": first.get("payment_methods", ""),
        "late_fee_pct": first.get("late_fee_pct", 2),
        "interest_daily_pct": first.get("interest_daily_pct", 0.033),
    }

    stream = io.BytesIO()
    c = canvas.Canvas(stream, pagesize=A4)

    _render_carne(c, carnet_dict, inst_data, student, responsible, settings,
                  course_info=course_info, contract_info=contract_info,
                  segunda_via=segunda_via, charge_type=charge_type)
    return stream.getvalue()
