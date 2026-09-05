"""Shape do payload real do frontend (T-02.02).

O frontend envia o objeto `settings` exatamente como veio do GET (Settings.tsx:64),
com campos extras (id, logo_url) e sem sanitizar nuláveis. Este teste confirma a
tolerância do SettingsSchema ao payload real: campos extras ignorados + dark_mode
boolean + pix_key persistida.
"""
import pytest


@pytest.fixture
def payload_frontend():
    """Réplica fiel do que o frontend envia: GET → objeto do estado → PUT."""
    return {
        "id": 1,
        "school_name": "Escola Teste",
        "logo_url": None,
        "address": None,          # nulável: banco sem valor → GET devolve null
        "phone": None,
        "email": None,
        "cnpj": None,
        "pix_key": "frontend@pix.test",
        "primary_color": "#3B82F6",
        "dark_mode": True,        # boolean real enviado pelo frontend
        "due_day": 5,
        "slogan": "",
        "social_media": "",
        "payment_methods": "PIX,Dinheiro,Débito,Crédito",
    }


def test_put_payload_frontend_aceito(client, auth_headers, payload_frontend):
    resp = client.put("/api/settings", json=payload_frontend, headers=auth_headers)
    assert resp.status_code == 200, resp.text


def test_pix_key_persistida_apos_put_frontend(client, auth_headers, payload_frontend):
    resp = client.put("/api/settings", json=payload_frontend, headers=auth_headers)
    assert resp.status_code == 200, resp.text

    resp = client.get("/api/settings", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["pix_key"] == "frontend@pix.test"