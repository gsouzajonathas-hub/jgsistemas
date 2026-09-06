"""T-03.07 (super-admin-master, D-03): enforcement real do modulo evaluations (+ weight_config)."""


async def test_teacher_sem_evaluations_recebe_403(client, headers_com_permissoes):
    headers = await headers_com_permissoes("teacher", [])
    resp = client.get("/api/evaluations", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_teacher_com_evaluations_acessa_get(client, headers_com_permissoes):
    headers = await headers_com_permissoes("teacher", ["evaluations"])
    resp = client.get("/api/evaluations", headers=headers)
    assert resp.status_code == 200, resp.text


def test_super_admin_sempre_acessa_evaluations(client, super_admin_headers):
    resp = client.get("/api/evaluations", headers=super_admin_headers)
    assert resp.status_code == 200, resp.text


async def test_teacher_sem_evaluations_recebe_403_no_weight_config_get(client, headers_com_permissoes):
    headers = await headers_com_permissoes("teacher", [])
    resp = client.get("/api/weight-config", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_teacher_com_evaluations_acessa_weight_config(client, headers_com_permissoes):
    headers = await headers_com_permissoes("teacher", ["evaluations"])
    resp = client.get("/api/weight-config", headers=headers)
    assert resp.status_code == 200, resp.text
