import os

from reportlab.lib import colors

from app.utils.paths import get_upload_path

NAVY_900 = "#022344"
NAVY_100 = "#DCE6F0"
RED_600 = "#CA2122"


def draw_report_header(c, w, h, settings, subtitle):
    c.saveState()
    band_h = 56
    c.setFillColor(colors.HexColor(NAVY_900))
    c.rect(0, h - band_h, w, band_h, stroke=0, fill=1)
    c.setFillColor(colors.HexColor(RED_600))
    c.rect(0, h - band_h, w, 3, stroke=0, fill=1)

    name = settings.school_name if settings and settings.school_name else "Escola"
    x0 = 30
    logo_path = None
    if settings and getattr(settings, "logo_url", None):
        p = get_upload_path(settings.logo_url)
        if os.path.exists(p):
            logo_path = p
    if logo_path:
        try:
            c.drawImage(logo_path, x0, h - band_h + 9, width=band_h - 18,
                        height=band_h - 18, preserveAspectRatio=True, mask='auto')
            x0 += band_h - 6
        except Exception:
            pass

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(x0, h - 21, str(name)[:70])
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor(NAVY_100))
    sub = subtitle
    if getattr(settings, "cnpj", None):
        sub += f"  |  CNPJ: {settings.cnpj}"
    c.drawString(x0, h - 35, sub)

    contact_bits = []
    if getattr(settings, "phone", None):
        contact_bits.append(f"Tel: {settings.phone}")
    if getattr(settings, "email", None):
        contact_bits.append(settings.email)
    if contact_bits:
        c.setFont("Helvetica", 7)
        c.setFillColor(colors.HexColor(NAVY_100))
        c.drawRightString(w - 30, h - 21, "  |  ".join(contact_bits))
    if getattr(settings, "address", None):
        c.drawRightString(w - 30, h - 33, str(settings.address)[:80])
    c.restoreState()


def draw_report_footer(c, w, h, settings, left_text, right_text):
    slogan = getattr(settings, "slogan", "") or ""
    social = getattr(settings, "social_media", "") or ""
    c.saveState()
    c.setFillColor(colors.HexColor("#94A3B8"))
    c.setFont("Helvetica", 7)
    c.drawString(30, 15, left_text)
    c.drawRightString(w - 30, 15, right_text)

    y_extra = 25
    if slogan or social:
        bits = []
        if slogan:
            bits.append(f'"{slogan}"')
        if social:
            bits.append(social)
        c.setFillColor(colors.HexColor(NAVY_900))
        c.setFont("Helvetica-Oblique", 7)
        c.drawCentredString(w / 2, y_extra, "   |   ".join(bits))

    page_num = c.getPageNumber()
    c.setFillColor(colors.HexColor("#94A3B8"))
    c.drawCentredString(w / 2, 5, f"— {page_num} —")
    c.restoreState()
