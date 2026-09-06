"""T-03.12 (super-admin-master, D-03): enforcement dos modulos dashboard e reports."""


async def test_secretary_sem_dashboard_recebe_403(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", [])
    resp = client.get("/api/reports/dashboard", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_secretary_com_dashboard_acessa(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", ["dashboard"])
    resp = client.get("/api/reports/dashboard", headers=headers)
    assert resp.status_code == 200, resp.text


async def test_secretary_sem_reports_recebe_403_em_outra_rota(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", [])
    resp = client.get("/api/reports/financial", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_secretary_com_reports_acessa_outra_rota(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", ["reports"])
    resp = client.get("/api/reports/financial", headers=headers)
    assert resp.status_code == 200, resp.text


async def test_secretary_com_dashboard_nao_tem_reports_automaticamente(client, headers_com_permissoes):
    # os dois modulos sao independentes: ter 'dashboard' nao libera 'reports'
    headers = await headers_com_permissoes("secretary", ["dashboard"])
    resp = client.get("/api/reports/financial", headers=headers)
    assert resp.status_code == 403, resp.text


def test_super_admin_sempre_acessa_dashboard_e_reports(client, super_admin_headers):
    assert client.get("/api/reports/dashboard", headers=super_admin_headers).status_code == 200
    assert client.get("/api/reports/financial", headers=super_admin_headers).status_code == 200
