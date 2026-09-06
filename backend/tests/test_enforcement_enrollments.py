"""T-03.02 (super-admin-master, D-03): enforcement real do modulo enrollments."""


async def test_secretary_sem_enrollments_recebe_403(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", [])
    resp = client.get("/api/enrollments", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_secretary_com_enrollments_acessa_get(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", ["enrollments"])
    resp = client.get("/api/enrollments", headers=headers)
    assert resp.status_code == 200, resp.text


def test_super_admin_sempre_acessa_enrollments(client, super_admin_headers):
    resp = client.get("/api/enrollments", headers=super_admin_headers)
    assert resp.status_code == 200, resp.text


async def test_admin_sem_enrollments_recebe_403_ao_criar(client, headers_com_permissoes):
    headers = await headers_com_permissoes("admin", [])
    resp = client.post("/api/enrollments", json={"student_id": 1, "class_group_id": 1}, headers=headers)
    assert resp.status_code == 403, resp.text
