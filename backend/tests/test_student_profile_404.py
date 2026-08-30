"""D-15: student-profile de aluno inexistente responde 404 real (não 200 com erro)."""


async def test_student_profile_inexistente_404(client, auth_headers):
    resp = client.get("/api/student-profile/999999", headers=auth_headers)
    assert resp.status_code == 404
    assert "detail" in resp.json()


async def test_student_profile_existente_200(client, auth_headers, aluno):
    resp = client.get(f"/api/student-profile/{aluno.id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["student"]["full_name"] == "Aluno Teste"