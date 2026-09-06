"""T-03.09 (super-admin-master, D-03): enforcement real do modulo certificates."""


async def test_secretary_sem_certificates_recebe_403(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", [])
    resp = client.get("/api/certificates", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_secretary_com_certificates_acessa_get(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", ["certificates"])
    resp = client.get("/api/certificates", headers=headers)
    assert resp.status_code == 200, resp.text


def test_super_admin_sempre_acessa_certificates(client, super_admin_headers):
    resp = client.get("/api/certificates", headers=super_admin_headers)
    assert resp.status_code == 200, resp.text


async def test_admin_sem_certificates_recebe_403_ao_emitir(client, headers_com_permissoes):
    headers = await headers_com_permissoes("admin", [])
    resp = client.post("/api/certificates", json={"student_id": 1, "class_group_id": 1}, headers=headers)
    assert resp.status_code == 403, resp.text
