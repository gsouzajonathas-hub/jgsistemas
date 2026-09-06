"""T-03.08 (super-admin-master, D-03): enforcement real do modulo boletins."""


async def test_teacher_sem_boletins_recebe_403(client, headers_com_permissoes):
    headers = await headers_com_permissoes("teacher", [])
    resp = client.get("/api/boletins/students", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_teacher_com_boletins_acessa_get(client, headers_com_permissoes):
    headers = await headers_com_permissoes("teacher", ["boletins"])
    resp = client.get("/api/boletins/students", headers=headers)
    assert resp.status_code == 200, resp.text


def test_super_admin_sempre_acessa_boletins(client, super_admin_headers):
    resp = client.get("/api/boletins/students", headers=super_admin_headers)
    assert resp.status_code == 200, resp.text
