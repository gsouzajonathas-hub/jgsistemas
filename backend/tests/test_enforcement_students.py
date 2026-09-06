"""T-03.01 (super-admin-master, D-03): enforcement real do modulo students."""


async def test_secretary_sem_students_recebe_403_no_get(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", [])
    resp = client.get("/api/students", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_secretary_com_students_acessa_get(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", ["students"])
    resp = client.get("/api/students", headers=headers)
    assert resp.status_code == 200, resp.text


def test_super_admin_sempre_acessa_students(client, super_admin_headers):
    resp = client.get("/api/students", headers=super_admin_headers)
    assert resp.status_code == 200, resp.text


async def test_admin_sem_students_recebe_403_ao_excluir(client, headers_com_permissoes):
    headers = await headers_com_permissoes("admin", [])
    resp = client.delete("/api/students/999999", headers=headers)
    assert resp.status_code == 403, resp.text
