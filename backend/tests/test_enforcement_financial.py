"""T-03.10 (super-admin-master, D-03): enforcement real do modulo financial (+ carnes, materials)."""


async def test_secretary_sem_financial_recebe_403(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", [])
    resp = client.get("/api/financial/plans", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_secretary_com_financial_acessa_plans(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", ["financial"])
    resp = client.get("/api/financial/plans", headers=headers)
    assert resp.status_code == 200, resp.text


def test_super_admin_sempre_acessa_financial(client, super_admin_headers):
    resp = client.get("/api/financial/plans", headers=super_admin_headers)
    assert resp.status_code == 200, resp.text


async def test_secretary_sem_financial_recebe_403_em_carnes(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", [])
    resp = client.get("/api/carnes", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_secretary_sem_financial_recebe_403_em_materials(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", [])
    resp = client.get("/api/materials", headers=headers)
    assert resp.status_code == 403, resp.text
