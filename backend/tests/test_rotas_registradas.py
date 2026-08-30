"""Os 7 routers reativados estão registrados e respondem em seus prefixos /api/*."""

PREFIXES = [
    "/api/teachers",
    "/api/classes",
    "/api/attendance",
    "/api/evaluations",
    "/api/boletins",
    "/api/certificates",
    "/api/weight-config",
]


def test_7_rotas_registradas(client):
    paths = {route.path for route in client.app.routes}
    for prefix in PREFIXES:
        assert any(p.startswith(prefix) for p in paths), f"nenhuma rota registrada em {prefix}"


async def test_teachers_e_classes_200_com_admin(client, auth_headers):
    resp_teachers = client.get("/api/teachers", headers=auth_headers)
    assert resp_teachers.status_code == 200
    assert isinstance(resp_teachers.json(), list)

    resp_classes = client.get("/api/classes", headers=auth_headers)
    assert resp_classes.status_code == 200
    assert isinstance(resp_classes.json(), list)


def test_rota_desconhecida_404(client):
    resp = client.get("/api/rota-inexistente-xyz")
    assert resp.status_code == 404