"""T-02.08 — suíte de integração do módulo de boletins (contratos, médias, PDF/Excel)."""

from datetime import date

from sqlalchemy import select

from app.models.attendance import Attendance
from app.models.enrollment import Enrollment
from app.models.evaluation import Evaluation
from app.models.student import Student


async def _novo_aluno(db_session, nome: str, cpf: str) -> Student:
    aluno2 = Student(
        full_name=nome,
        cpf=cpf,
        email=f"{cpf}@teste.local",
        status="active",
    )
    db_session.add(aluno2)
    await db_session.commit()
    await db_session.refresh(aluno2)
    return aluno2


async def _matricular(db_session, aluno2, turma) -> Enrollment:
    mat = Enrollment(
        student_id=aluno2.id,
        class_group_id=turma.id,
        enrollment_date=date(2026, 2, 1),
        status="active",
    )
    db_session.add(mat)
    await db_session.commit()
    await db_session.refresh(mat)
    return mat


async def test_lista_alunos_do_boletim(client, auth_headers, aluno):
    resp = client.get("/api/boletins/students", headers=auth_headers)
    assert resp.status_code == 200
    nomes = [s["full_name"] for s in resp.json()]
    assert aluno.full_name in nomes


async def test_boletim_aluno_inexistente_404(client, auth_headers):
    resp = client.get("/api/boletins/999999", headers=auth_headers)
    assert resp.status_code == 404


async def test_boletim_aluno_sem_avaliacoes(client, auth_headers, aluno):
    resp = client.get(f"/api/boletins/{aluno.id}", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["student"]["full_name"] == "Aluno Teste"
    assert "classes" in body and "overall_average" in body


async def test_boletim_com_media_e_situacao(client, auth_headers, turma, db_session):
    ana = await _novo_aluno(db_session, "Ana Boletim", "11122233341")
    await _matricular(db_session, ana, turma)

    # duas provas: 7.0 (w1) e 9.0 (w1) -> média 80.0% (Aprovado)
    for i, (score, d) in enumerate([(7.0, "2026-09-01"), (9.0, "2026-09-15")]):
        db_session.add(Evaluation(
            student_id=ana.id, class_group_id=turma.id,
            eval_type="prova", title=f"Prova B{i+1}", date=date.fromisoformat(d),
            score=score, max_score=10, weight=1.0,
        ))
    # frequência: 3 presenças e 1 falta -> 75% (mínimo para aprovação)
    for d, status in [("2026-09-01", "present"), ("2026-09-08", "present"),
                      ("2026-09-15", "present"), ("2026-09-22", "absent")]:
        db_session.add(Attendance(
            student_id=ana.id, class_group_id=turma.id,
            date=date.fromisoformat(d), status=status,
        ))
    await db_session.commit()

    resp = client.get(f"/api/boletins/{ana.id}", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["classes"]) == 1
    bloco = body["classes"][0]
    assert bloco["class_group_id"] == turma.id
    assert bloco["average"] == 80.0
    assert bloco["status_by_grade"] == "Aprovado"
    assert bloco["frequency"] == 75.0
    assert bloco["present"] == 3
    assert bloco["absent"] == 1
    assert bloco["situation"] == "Aprovado"
    assert bloco["eligible"] is True
    assert len(bloco["evaluations"]) == 2
    assert body["overall_average"] == 80.0

    # reporvação por frequência: média ok mas freq < 75
    db_session.add(Attendance(
        student_id=ana.id, class_group_id=turma.id,
        date=date.fromisoformat("2026-09-29"), status="absent",
    ))
    await db_session.commit()
    resp2 = client.get(f"/api/boletins/{ana.id}", headers=auth_headers)
    assert resp2.json()["classes"][0]["situation"] == "Reprovado por Frequência"


async def test_boletim_turma(client, auth_headers, turma, db_session):
    resp = client.get(f"/api/boletins/turma/{turma.id}", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["class_group"]["id"] == turma.id
    assert "students" in body
    resp_missing = client.get("/api/boletins/turma/999999", headers=auth_headers)
    assert resp_missing.status_code == 404


async def test_boletim_pdf_e_excel(client, auth_headers, turma, db_session):
    ana = await _novo_aluno(db_session, "Ana Pdf", "11122233342")
    await _matricular(db_session, ana, turma)

    resp_pdf = client.get(f"/api/boletins/{ana.id}/pdf", headers=auth_headers)
    assert resp_pdf.status_code == 200
    assert resp_pdf.headers["content-type"].startswith("application/pdf")
    assert len(resp_pdf.content) > 1000

    resp_xlsx = client.get(f"/api/boletins/{ana.id}/excel", headers=auth_headers)
    assert resp_xlsx.status_code == 200
    assert resp_xlsx.headers["content-type"].startswith(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert len(resp_xlsx.content) > 500