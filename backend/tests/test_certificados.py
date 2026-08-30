"""T-02.08 — suíte de integração do módulo de certificados (emitir, duplicidade, média<70, PDF)."""

from datetime import date

from sqlalchemy import select

from app.models.attendance import Attendance
from app.models.enrollment import Enrollment
from app.models.evaluation import Evaluation
from app.models.student import Student


async def _aluno_certificado(db_session, nome: str, cpf: str) -> Student:
    novo = Student(full_name=nome, cpf=cpf, email=f"{cpf}@teste.local", status="active")
    db_session.add(novo)
    await db_session.commit()
    await db_session.refresh(novo)
    return novo


async def _montar_contexto(db_session, aluno2, turma, nota: float, peso=1.0,
                           presencas: int = 1, faltas: int = 0):
    db_session.add(Enrollment(
        student_id=aluno2.id, class_group_id=turma.id,
        enrollment_date=date(2026, 2, 1), status="active",
    ))
    db_session.add(Evaluation(
        student_id=aluno2.id, class_group_id=turma.id,
        eval_type="prova", title="Prova Final", date=date(2026, 9, 20),
        score=nota, max_score=10, weight=peso,
    ))
    for i in range(presencas):
        db_session.add(Attendance(
            student_id=aluno2.id, class_group_id=turma.id,
            date=date(2026, 9, 1 + i), status="present",
        ))
    for i in range(faltas):
        db_session.add(Attendance(
            student_id=aluno2.id, class_group_id=turma.id,
            date=date(2026, 9, 10 + i), status="absent",
        ))
    await db_session.commit()


async def test_certificado_inexistente_pdf_404(client, auth_headers):
    resp = client.get("/api/certificates/999999/pdf", headers=auth_headers)
    assert resp.status_code == 404


async def test_aluno_inexistente_404(client, auth_headers):
    resp = client.post(
        "/api/certificates",
        headers=auth_headers,
        json={"student_id": 999999, "class_group_id": 1},
    )
    assert resp.status_code == 404


async def test_media_abaixo_70_responde_400(client, auth_headers, turma, db_session):
    carlos = await _aluno_certificado(db_session, "Carlos BaixaMedia", "11122233343")
    await _montar_contexto(db_session, carlos, turma, nota=5.0, presencas=2, faltas=2)

    resp = client.post(
        "/api/certificates",
        headers=auth_headers,
        json={"student_id": carlos.id, "class_group_id": turma.id},
    )
    assert resp.status_code == 400
    assert "critérios" in resp.json()["detail"]


async def test_emissao_duplicidade_e_pdf(client, auth_headers, turma, db_session):
    carlos = await _aluno_certificado(db_session, "Carlos Aprovado", "11122233344")
    # média 80% e frequência 75% (3 presenças, 1 falta) -> elegível
    await _montar_contexto(db_session, carlos, turma, nota=8.0, presencas=3, faltas=1)

    resp = client.post(
        "/api/certificates",
        headers=auth_headers,
        json={"student_id": carlos.id, "class_group_id": turma.id},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["id"] > 0
    assert body["control_number"].startswith("CERT-")
    assert body["media"] == 80.0
    assert body["frequency"] == 75.0

    # duplicidade -> 400
    resp2 = client.post(
        "/api/certificates",
        headers=auth_headers,
        json={"student_id": carlos.id, "class_group_id": turma.id},
    )
    assert resp2.status_code == 400
    assert "já emitido" in resp2.json()["detail"]

    # níveis: aluno Básico avança para Intermediário ao concluir
    await db_session.refresh(carlos)
    assert carlos.english_level == "Intermediário"

    # listas
    lis = client.get("/api/certificates", headers=auth_headers)
    assert lis.status_code == 200
    assert any(c["id"] == body["id"] for c in lis.json())

    lis_aluno = client.get(f"/api/certificates/student/{carlos.id}", headers=auth_headers)
    assert lis_aluno.status_code == 200
    assert len(lis_aluno.json()) == 1

    # pdf
    resp_pdf = client.get(f"/api/certificates/{body['id']}/pdf", headers=auth_headers)
    assert resp_pdf.status_code == 200
    assert resp_pdf.headers["content-type"].startswith("application/pdf")
    assert len(resp_pdf.content) > 1000