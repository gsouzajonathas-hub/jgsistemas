"""T-02.07 — fluxo E2E completo via API (D-12/D-16):
aluno → turma → matrícula → frequência → avaliações → boletim → certificado → financeiro."""

from datetime import date

from sqlalchemy import select

from app.models.financial import Installment


async def test_fluxo_e2e_completo(client, auth_headers, curso, professor, db_session):
    # 1) ALUNO
    resp = client.post(
        "/api/students",
        headers=auth_headers,
        json={
            "full_name": "E2E Aluno Completo",
            "cpf": "11122233350",
            "email": "e2e@teste.local",
            "status": "active",
            "english_level": "Básico",
            "monthly_fee": 350.0,
            "due_day": 5,
        },
    )
    assert resp.status_code == 200, resp.text
    student_id = resp.json()["id"]

    # 2) TURMA
    resp = client.post(
        "/api/classes",
        headers=auth_headers,
        json={
            "name": "Turma E2E",
            "course_id": curso.id,
            "teacher_id": professor.id,
            "weekdays": "seg,qua",
            "start_time": "09:00",
            "end_time": "10:30",
            "level": "Básico",
        },
    )
    assert resp.status_code == 200, resp.text
    class_id = resp.json()["id"]

    # 3) MATRÍCULA
    resp = client.post(
        "/api/enrollments",
        headers=auth_headers,
        json={"student_id": student_id, "class_group_id": class_id},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["message"] == "Matrícula realizada com sucesso"

    # 4) FREQUÊNCIA: 3 presenças + 1 falta -> 75%
    for dt in ["2026-11-02", "2026-11-04", "2026-11-09"]:
        resp = client.post(
            "/api/attendance/bulk",
            headers=auth_headers,
            json={
                "class_group_id": class_id,
                "date": dt,
                "records": [{"student_id": student_id, "status": "present"}],
            },
        )
        assert resp.status_code == 200
    resp = client.post(
        "/api/attendance/bulk",
        headers=auth_headers,
        json={
            "class_group_id": class_id,
            "date": "2026-11-11",
            "records": [{"student_id": student_id, "status": "absent"}],
        },
    )
    assert resp.status_code == 200

    relatorio = client.get(f"/api/attendance/report/{class_id}", headers=auth_headers).json()
    linha = next(r for r in relatorio if r["student_id"] == student_id)
    assert linha["percentage"] == 75.0

    # 5) AVALIAÇÕES: 8.0 (w1) + 9.0 (w1) -> média 85%
    for score, titulo in [(8.0, "Prova E2E 1"), (9.0, "Prova E2E 2")]:
        resp = client.post(
            "/api/evaluations",
            headers=auth_headers,
            json={
                "student_id": student_id,
                "class_group_id": class_id,
                "eval_type": "prova",
                "title": titulo,
                "date": "2026-11-10",
                "score": score,
                "max_score": 10,
                "weight": 1.0,
            },
        )
        assert resp.status_code == 200

    # 6) BOLETIM
    boletim = client.get(f"/api/boletins/{student_id}", headers=auth_headers)
    assert boletim.status_code == 200
    body = boletim.json()
    bloco = next(b for b in body["classes"] if b["class_group_id"] == class_id)
    assert bloco["average"] == 85.0
    assert bloco["frequency"] == 75.0
    assert bloco["situation"] == "Aprovado"
    assert bloco["eligible"] is True
    assert body["overall_average"] == 85.0

    pdf = client.get(f"/api/boletins/{student_id}/pdf", headers=auth_headers)
    assert pdf.status_code == 200
    assert pdf.headers["content-type"].startswith("application/pdf")
    assert len(pdf.content) > 1000

    # 7) CERTIFICADO (média >= 70 e frequência >= 75)
    resp = client.post(
        "/api/certificates",
        headers=auth_headers,
        json={"student_id": student_id, "class_group_id": class_id},
    )
    assert resp.status_code == 200, resp.text
    cert = resp.json()
    assert cert["control_number"].startswith("CERT-")
    assert cert["media"] == 85.0
    assert cert["frequency"] == 75.0

    cert_pdf = client.get(f"/api/certificates/{cert['id']}/pdf", headers=auth_headers)
    assert cert_pdf.status_code == 200
    assert cert_pdf.headers["content-type"].startswith("application/pdf")
    assert len(cert_pdf.content) > 1000

    # 8) FINANCEIRO: gerar mensalidade, pagar e emitir recibo
    resp = client.post(
        "/api/financial/generate-month",
        headers=auth_headers,
        json={"month": "2026-08"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["created"] >= 1

    parcelas = (
        await db_session.execute(
            select(Installment).where(
                Installment.student_id == student_id,
                Installment.status == "pending",
            )
        )
    ).scalars().all()
    assert parcelas
    inst = parcelas[0]

    resp = client.post(
        "/api/financial/payments",
        headers=auth_headers,
        json={
            "installment_id": inst.id,
            "amount": 350.0,
            "payment_date": "2026-08-15",
            "payment_method": "PIX",
        },
    )
    assert resp.status_code == 200, resp.text
    payment_id = resp.json()["payment_id"]

    recibo = client.get(
        f"/api/financial/payments/{payment_id}/receipt", headers=auth_headers
    )
    assert recibo.status_code == 200
    assert recibo.headers["content-type"].startswith("application/pdf")

    # 9) FECHAMENTO: boletim agora exibe o certificado emitido
    final = client.get(f"/api/boletins/{student_id}", headers=auth_headers).json()
    bloco_final = next(b for b in final["classes"] if b["class_group_id"] == class_id)
    assert bloco_final["certificate"]["control_number"] == cert["control_number"]