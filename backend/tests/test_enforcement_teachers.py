"""T-03.04 (super-admin-master, D-03): enforcement real do modulo teachers."""


async def test_secretary_sem_teachers_recebe_403(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", [])
    resp = client.get("/api/teachers", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_secretary_com_teachers_acessa_get(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", ["teachers"])
    resp = client.get("/api/teachers", headers=headers)
    assert resp.status_code == 200, resp.text


def test_super_admin_sempre_acessa_teachers(client, super_admin_headers):
    resp = client.get("/api/teachers", headers=super_admin_headers)
    assert resp.status_code == 200, resp.text


async def test_admin_sem_teachers_recebe_403_ao_criar(client, headers_com_permissoes):
    headers = await headers_com_permissoes("admin", [])
    resp = client.post("/api/teachers", json={"full_name": "Professor Teste", "cpf": "12345678900"}, headers=headers)
    assert resp.status_code == 403, resp.text
