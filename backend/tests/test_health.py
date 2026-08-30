"""Teste de referência do harness: a rota de health responde com o contrato esperado."""


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok", "message": "Sistema de gestão escolar"}