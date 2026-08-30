"""T-02.08 — suíte de integração do módulo de frequência (bulk, filtros, relatório)."""

from datetime import date

from sqlalchemy import select

from app.models.enrollment import Enrollment
from app.models.student import Student


async def _novo_aluno(db_session, nome: str, cpf: str) -> Student:
    novo = Student(full_name=nome, cpf=cpf, email=f"{cpf}@teste.local", status="active")
    db_session.add(novo)
    await db_session.commit()
    await db_session.refresh(novo)
    return novo


async def _matricular(db_session, aluno2, turma):
    db_session.add(Enrollment(
        student_id=aluno2.id, class_group_id=turma.id,
        enrollment_date=date(2026, 2, 1), status="active",
    ))
    await db_session.commit()


async def test_lancamento_bulk_e_filtros(client, auth_headers, aluno, turma, db_session):
    aluno2 = await _novo_aluno(db_session, "Freq Aluno 2", "11122233345")
    await _matricular(db_session, aluno, turma)
    await _matricular(db_session, aluno2, turma)

    resp = client.post(
        "/api/attendance/bulk",
        headers=auth_headers,
        json={
            "class_group_id": turma.id,
            "date": "2026-09-12",
            "records": [
                {"student_id": aluno.id, "status": "present", "notes": ""},
                {"student_id": aluno2.id, "status": "absent", "notes": "faltou"},
            ],
        },
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "Frequência registrada com sucesso"

    # re-lançamento na mesma data atualiza (não duplica)
    resp2 = client.post(
        "/api/attendance/bulk",
        headers=auth_headers,
        json={
            "class_group_id": turma.id,
            "date": "2026-09-12",
            "records": [{"student_id": aluno.id, "status": "absent", "notes": "atualizado"}],
        },
    )
    assert resp2.status_code == 200

    lista = client.get(
        f"/api/attendance?class_group_id={turma.id}&student_id={aluno.id}",
        headers=auth_headers,
    )
    assert lista.status_code == 200
    registros = [r for r in lista.json() if r["date"] == "2026-09-12"]
    assert len(registros) == 1
    assert registros[0]["status"] == "absent"
    assert registros[0]["notes"] == "atualizado"

    por_data = client.get("/api/attendance?date=2026-09-12", headers=auth_headers)
    assert por_data.status_code == 200
    assert all(r["date"] == "2026-09-12" for r in por_data.json())


async def test_relatorio_de_turma(client, auth_headers, aluno, turma, db_session):
    aluno2 = await _novo_aluno(db_session, "Freq Aluno 3", "11122233346")
    await _matricular(db_session, aluno2, turma)

    client.post(
        "/api/attendance/bulk",
        headers=auth_headers,
        json={
            "class_group_id": turma.id,
            "date": "2026-09-19",
            "records": [
                {"student_id": aluno.id, "status": "present"},
                {"student_id": aluno2.id, "status": "absent"},
            ],
        },
    )

    resp = client.get(f"/api/attendance/report/{turma.id}", headers=auth_headers)
    assert resp.status_code == 200
    linhas = {linha["student_id"]: linha for linha in resp.json()}
    assert aluno.id in linhas and aluno2.id in linhas
    assert linhas[aluno.id]["student_name"] == "Aluno Teste"
    assert linhas[aluno2.id]["percentage"] == 0.0

    # consistência: percentual do aluno casa com a contagem real da listagem
    lista = client.get(
        f"/api/attendance?class_group_id={turma.id}&student_id={aluno.id}",
        headers=auth_headers,
    ).json()
    presentes = sum(1 for r in lista if r["status"] == "present")
    ausentes = sum(1 for r in lista if r["status"] == "absent")
    esperado = round((presentes / (presentes + ausentes)) * 100, 1) if (presentes + ausentes) else 0.0
    assert linhas[aluno.id]["percentage"] == esperado


async def test_relatorio_turma_sem_matriculas(client, auth_headers):
    # turma inexistente não tem matrículas ativas -> relatório vazio
    resp = client.get("/api/attendance/report/999999", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []