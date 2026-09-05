"""Recibo de venda de material didático — numeração REC-{ano}-{contagem} (T-03.01/T-03.02).

O formato anterior era MAT-{sale.id:06d}; a numeração REC-{ano}-{contagem:05d} segue o
critério do Financeiro (financial.py:577-580) e aparece tanto no Content-Disposition
quanto dentro do PDF.
"""
import re

import pytest


def _extrai_rec(cd: str):
    """Devolve (ano, contagem) do Content-Disposition recibo-REC-{ano}-{contagem:05d}.pdf."""
    m = re.search(r"recibo-REC-(\d{4})-(\d{5})\.pdf", cd)
    return (m.group(1), m.group(2)) if m else None


def test_receipt_pdf_content_disposition_rec(client, auth_headers, material_sale_ctx):
    resp = client.get(
        f"/api/materials/sales/{material_sale_ctx.sale.id}/receipt",
        headers=auth_headers,
    )
    assert resp.status_code == 200, resp.text
    assert resp.headers["content-type"].startswith("application/pdf")

    cd = resp.headers.get("content-disposition", "")
    assert "attachment" in cd, cd
    rec = _extrai_rec(cd)
    assert rec, f"Content-Disposition sem padrão REC: {cd}"

    ano_esperado = material_sale_ctx.sale.created_at.year
    assert rec[0] == str(ano_esperado), f"ano {rec[0]} != {ano_esperado}"
    assert int(rec[1]) >= 1, f"contagem inválida: {rec[1]}"


def test_receipt_pdf_contem_numero_rec(client, auth_headers, material_sale_ctx):
    """O número REC impresso no PDF também usa a numeração anual."""
    pypdf = pytest.importorskip("pypdf")

    resp = client.get(
        f"/api/materials/sales/{material_sale_ctx.sale.id}/receipt",
        headers=auth_headers,
    )
    assert resp.status_code == 200, resp.text

    cd = resp.headers.get("content-disposition", "")
    rec = _extrai_rec(cd)
    assert rec, f"sem padrão REC: {cd}"

    from io import BytesIO
    texto = "".join(page.extract_text() or "" for page in pypdf.PdfReader(BytesIO(resp.content)).pages)
    assert f"Recibo nº REC-{rec[0]}-{rec[1]}" in texto
    assert f"MAT-{material_sale_ctx.sale.id:06d}" not in texto