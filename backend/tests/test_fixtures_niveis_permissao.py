"""T-01.01 (super-admin-master): smoke test das fixtures de niveis de permissao."""


def test_super_admin_headers_autentica_super_admin(client, super_admin_headers):
    resp = client.get("/api/auth/me", headers=super_admin_headers)
    assert resp.status_code == 200, resp.text
    assert resp.json()["role"] == "super_admin"


def test_admin_headers_todos_modulos_autentica_admin(client, admin_headers_todos_modulos):
    resp = client.get("/api/auth/me", headers=admin_headers_todos_modulos)
    assert resp.status_code == 200, resp.text
    assert resp.json()["role"] == "admin"


def test_admin_headers_sem_modulos_autentica_admin(client, admin_headers_sem_modulos):
    resp = client.get("/api/auth/me", headers=admin_headers_sem_modulos)
    assert resp.status_code == 200, resp.text
    assert resp.json()["role"] == "admin"
