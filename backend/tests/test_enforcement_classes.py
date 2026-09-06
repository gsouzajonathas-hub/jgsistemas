"""T-03.05 (super-admin-master, D-03): enforcement real do modulo classes."""


async def test_secretary_sem_classes_recebe_403(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", [])
    resp = client.get("/api/classes", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_secretary_com_classes_acessa_get(client, headers_com_permissoes):
    headers = await headers_com_permissoes("secretary", ["classes"])
    resp = client.get("/api/classes", headers=headers)
    assert resp.status_code == 200, resp.text


def test_super_admin_sempre_acessa_classes(client, super_admin_headers):
    resp = client.get("/api/classes", headers=super_admin_headers)
    assert resp.status_code == 200, resp.text


async def test_admin_sem_classes_recebe_403_ao_excluir(client, headers_com_permissoes):
    headers = await headers_com_permissoes("admin", [])
    resp = client.delete("/api/classes/999999", headers=headers)
    assert resp.status_code == 403, resp.text
