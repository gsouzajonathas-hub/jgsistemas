"""T-03.03 (super-admin-master, D-03): enforcement real do modulo courses."""


async def test_secretary_sem_courses_recebe_403(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", [])
    resp = client.get("/api/courses", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_secretary_com_courses_acessa_get(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", ["courses"])
    resp = client.get("/api/courses", headers=headers)
    assert resp.status_code == 200, resp.text


def test_super_admin_sempre_acessa_courses(client, super_admin_headers):
    resp = client.get("/api/courses", headers=super_admin_headers)
    assert resp.status_code == 200, resp.text


async def test_admin_sem_courses_recebe_403_ao_criar(client, headers_com_permissoes):
    headers = await headers_com_permissoes("admin", [])
    resp = client.post("/api/courses", json={"name": "Curso Teste", "level": "Básico"}, headers=headers)
    assert resp.status_code == 403, resp.text
