"""T-02.01 (super-admin-master, D-01): gestao de usuarios exclusiva do super_admin."""


def test_super_admin_cria_usuario_novo(client, super_admin_headers):
    resp = client.post(
        "/api/auth/register",
        json={
            "name": "Criado pelo Super",
            "email": "criado-pelo-super@example.com",
            "password": "senha-forte-123",
            "role": "secretary",
        },
        headers={**super_admin_headers, "X-Forwarded-For": "10.0.9.1"},
    )
    assert resp.status_code == 200, resp.text

    users = client.get("/api/auth/users", headers=super_admin_headers).json()
    assert any(u["email"] == "criado-pelo-super@example.com" for u in users)


def test_admin_comum_nao_consegue_criar_usuario(client, auth_headers):
    resp = client.post(
        "/api/auth/register",
        json={
            "name": "Intruso",
            "email": "admin-tentando-criar@example.com",
            "password": "senha-forte-123",
            "role": "secretary",
        },
        headers={**auth_headers, "X-Forwarded-For": "10.0.9.2"},
    )
    assert resp.status_code == 403, resp.text


def test_admin_comum_nao_consegue_listar_usuarios(client, auth_headers):
    resp = client.get("/api/auth/users", headers=auth_headers)
    assert resp.status_code == 403, resp.text


def test_admin_comum_nao_consegue_editar_usuario(client, auth_headers, admin_todos_modulos_user):
    resp = client.put(
        f"/api/auth/users/{admin_todos_modulos_user.id}",
        json={"name": "Tentativa de edicao"},
        headers=auth_headers,
    )
    assert resp.status_code == 403, resp.text


def test_admin_comum_nao_consegue_excluir_usuario(client, auth_headers, admin_todos_modulos_user):
    resp = client.delete(f"/api/auth/users/{admin_todos_modulos_user.id}", headers=auth_headers)
    assert resp.status_code == 403, resp.text


async def test_super_admin_ainda_consegue_editar_e_excluir_usuario(client, super_admin_headers, db_session):
    from app.models.user import User
    from app.utils.auth import hash_password

    vitima = User(
        name="Vitima Gestao",
        email="vitima-gestao@teste.local",
        password_hash=hash_password("senha-123"),
        role="secretary",
        is_active=True,
    )
    db_session.add(vitima)
    await db_session.commit()
    await db_session.refresh(vitima)

    resp_put = client.put(
        f"/api/auth/users/{vitima.id}", json={"name": "Editado"}, headers=super_admin_headers
    )
    assert resp_put.status_code == 200, resp_put.text

    resp_delete = client.delete(f"/api/auth/users/{vitima.id}", headers=super_admin_headers)
    assert resp_delete.status_code == 200, resp_delete.text
