"""Demo das fixtures: admin autenticado consegue listar alunos via API."""


async def test_fixtures_admin_autenticado(client, auth_headers):
    resp = client.get("/api/students", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body, dict)
    assert isinstance(body["students"], list)