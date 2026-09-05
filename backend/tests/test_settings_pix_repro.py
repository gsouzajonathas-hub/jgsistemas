"""Reprodução da lacuna L2 (T-02.01): chave PIX não persiste no modal Configurações.

Fluxo real da API: GET /api/settings → PUT /api/settings (payload completo + pix_key
alterada) → GET /api/settings. Roda ANTES de qualquer correção para documentar a
causa (404/422/perda de valor ou passagem limpa) em base/00-LACUNAS.md.
"""


def test_repro_pix_get_put_get(client, auth_headers):
    # 1) Payload atual do GET
    resp = client.get("/api/settings", headers=auth_headers)
    assert resp.status_code == 200
    payload = resp.json()

    nova_chave = "repro@pix.test"
    payload["pix_key"] = nova_chave

    # 2) PUT com o payload completo + pix_key alterada
    resp = client.put("/api/settings", json=payload, headers=auth_headers)
    assert resp.status_code == 200

    # 3) GET novamente: a chave salva precisa continuar lá
    resp = client.get("/api/settings", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["pix_key"] == nova_chave