"""T-03.14 (super-admin-master, D-03): enforcement real do modulo settings (PUT/POST)."""


async def test_admin_sem_settings_recebe_403_no_put(client, headers_com_permissoes):
    headers = await headers_com_permissoes("admin", [])
    resp = client.put("/api/settings", json={"school_name": "Nova Escola", "pix_key": "teste@pix.local"}, headers=headers)
    assert resp.status_code == 403, resp.text


async def test_admin_com_settings_acessa_put(client, headers_com_permissoes):
    headers = await headers_com_permissoes("admin", ["settings"])
    resp = client.put("/api/settings", json={"school_name": "Nova Escola", "pix_key": "teste@pix.local"}, headers=headers)
    assert resp.status_code == 200, resp.text


async def test_admin_sem_settings_ainda_acessa_get(client, headers_com_permissoes):
    # GET /settings fica aberto para qualquer autenticado (usado pelo Sidebar/branding).
    headers = await headers_com_permissoes("admin", [])
    resp = client.get("/api/settings", headers=headers)
    assert resp.status_code == 200, resp.text


def test_super_admin_sempre_acessa_put_settings(client, super_admin_headers):
    resp = client.put("/api/settings", json={"school_name": "Escola do Super", "pix_key": "teste@pix.local"}, headers=super_admin_headers)
    assert resp.status_code == 200, resp.text
