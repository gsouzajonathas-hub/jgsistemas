"""T-03.13 (super-admin-master, D-03): enforcement real do modulo audit."""


async def test_admin_sem_audit_recebe_403(client, headers_com_permissoes):
    headers = await headers_com_permissoes("admin", [])
    resp = client.get("/api/audit", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_admin_com_audit_acessa(client, headers_com_permissoes):
    headers = await headers_com_permissoes("admin", ["audit"])
    resp = client.get("/api/audit", headers=headers)
    assert resp.status_code == 200, resp.text


def test_super_admin_sempre_acessa_audit(client, super_admin_headers):
    resp = client.get("/api/audit", headers=super_admin_headers)
    assert resp.status_code == 200, resp.text
