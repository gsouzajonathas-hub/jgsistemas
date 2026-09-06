"""T-03.11 (super-admin-master, D-03): enforcement real do modulo schedule."""


async def test_secretary_sem_schedule_recebe_403(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", [])
    resp = client.get("/api/schedule", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_secretary_com_schedule_acessa_get(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", ["schedule"])
    resp = client.get("/api/schedule", headers=headers)
    assert resp.status_code == 200, resp.text


def test_super_admin_sempre_acessa_schedule(client, super_admin_headers):
    resp = client.get("/api/schedule", headers=super_admin_headers)
    assert resp.status_code == 200, resp.text
