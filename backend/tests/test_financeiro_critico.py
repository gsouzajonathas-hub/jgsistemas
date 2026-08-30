"""D-11: fluxo financeiro essencial — gerar mensalidade do mês, registrar pagamento e emitir recibo."""

from sqlalchemy import select

from app.models.financial import Installment
from app.models.student import Student


async def test_fluxo_financeiro_critico(client, auth_headers, db_session):
    # Aluno com mensalidade definida (único elegível no generate-month)
    student = Student(
        full_name="Aluno Financeiro",
        cpf="11122233340",
        email="financeiro@teste.local",
        status="active",
        monthly_fee=490.00,
        due_day=5,
    )
    db_session.add(student)
    await db_session.commit()
    await db_session.refresh(student)

    resp = client.post(
        "/api/financial/generate-month",
        headers=auth_headers,
        json={"month": "2026-08"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["created"] >= 1

    installments = (
        await db_session.execute(
            select(Installment).where(Installment.student_id == student.id)
        )
    ).scalars().all()
    assert installments, "generate-month deveria ter criado a mensalidade"
    inst = installments[0]
    assert inst.status == "pending"

    resp_pay = client.post(
        "/api/financial/payments",
        headers=auth_headers,
        json={
            "installment_id": inst.id,
            "amount": 490.00,
            "payment_date": "2026-08-10",
            "payment_method": "PIX",
        },
    )
    assert resp_pay.status_code == 200, resp_pay.text
    body = resp_pay.json()
    assert body["payment_id"] > 0
    assert body["receipt_number"].startswith("REC-")

    await db_session.refresh(inst)
    assert inst.status == "paid"
    assert inst.payment_method == "PIX"
    assert inst.paid_date is not None

    resp_rec = client.get(
        f"/api/financial/payments/{body['payment_id']}/receipt", headers=auth_headers
    )
    assert resp_rec.status_code == 200, resp_rec.text
    assert resp_rec.headers["content-type"].startswith("application/pdf")