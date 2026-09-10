"""Regressão: exclusão em cascata com FKs saturadas (bug de produção "erro ao excluir").

Antes dos fixes, no Postgres, deletar aluno/turma/curso/plano com dados vinculados
quebrava com violação de FK (500). Os testes anteriores cobriam só o caminho feliz
(sem dependências), por isso passavam locais e o erro só aparecia em produção.
"""
from datetime import date

from sqlalchemy import select, func

from app.models.attendance import Attendance
from app.models.certificate import Certificate
from app.models.enrollment import Enrollment
from app.models.evaluation import Evaluation
from app.models.file_upload import FileUpload
from app.models.financial import (
    Carne, Installment, Payment, Discount, FinancialContract, FinancialPlan,
)
from app.models.materials import TeachingMaterial, MaterialSale
from app.models.student import Responsible, Student
from app.models.weight_config import GradeWeightConfig


async def _count(db, model, **filters):
    q = select(func.count()).select_from(model)
    for k, v in filters.items():
        q = q.where(getattr(model, k) == v)
    r = await db.execute(q)
    return r.scalar_one()


async def _get_or_create(db, model, filters: dict, defaults: dict):
    r = await db.execute(select(model).where(*[getattr(model, k) == v for k, v in filters.items()]))
    obj = r.scalar_one_or_none()
    if obj is None:
        obj = model(**defaults)
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
    return obj


async def _aluno_novo(db, nome: str, cpf: str) -> Student:
    return await _get_or_create(db, Student, {"cpf": cpf}, {
        "full_name": nome, "cpf": cpf, "email": f"{cpf}@teste.local",
        "status": "active", "unit": "Matriz", "enrollment_date": date(2026, 2, 1),
    })


# ---------------------------------------------------------------------------
# Aluno com TODAS as dependências (reproduz o erro de produção: carnê com
# enrollment_id + matrícula deletada antes do carnê -> FK violation)
# ---------------------------------------------------------------------------

async def test_excluir_aluno_com_todas_dependencias(client, auth_headers, aluno, turma, curso, db_session):
    alvo = await _aluno_novo(db_session, "Aluno Cascata", "77788899900")
    plan = await _get_or_create(db_session, FinancialPlan, {"name": "Plano-Cascata"}, {
        "name": "Plano-Cascata", "value": 100, "installments": 3, "is_active": 1,
    })
    material = await _get_or_create(db_session, TeachingMaterial, {"name": "Livro-Cascata"}, {
        "name": "Livro-Cascata", "price": 50, "stock": 5,
    })

    matricula = Enrollment(
        student_id=alvo.id, class_group_id=turma.id,
        enrollment_date=date(2026, 2, 1), status="inactive", notes="hist",
    )
    db_session.add(matricula)
    await db_session.commit()

    carne = Carne(
        student_id=alvo.id, enrollment_id=matricula.id, total_installments=2,
        installment_value=100, first_due_date=date(2026, 3, 10), status="active",
    )
    db_session.add(carne)
    await db_session.commit()

    inst = Installment(
        student_id=alvo.id, carnet_id=carne.id, plan_id=plan.id,
        description="1/2", amount=100, due_date=date(2026, 3, 10), status="pending",
    )
    db_session.add(inst)
    await db_session.commit()
    db_session.add_all([
        Payment(installment_id=inst.id, amount=100, payment_date=date(2026, 3, 5)),
        Discount(student_id=alvo.id, name="Fidelidade", percentage=10),
        FileUpload(student_id=alvo.id, file_name="doc.pdf", file_path="private:doc.pdf"),
        Responsible(student_id=alvo.id, full_name="Resp", cpf="12345678901"),
        MaterialSale(material_id=material.id, student_id=alvo.id, quantity=1, unit_price=50, total_price=50),
        FinancialContract(
            student_id=alvo.id, plan_id=plan.id,
            start_date=date(2026, 3, 1), end_date=date(2026, 12, 31), status="pending",
        ),
        Evaluation(
            student_id=alvo.id, class_group_id=turma.id, eval_type="prova",
            title="P1", date=date(2026, 9, 20), score=8, max_score=10, weight=1,
        ),
        Attendance(student_id=alvo.id, class_group_id=turma.id, date=date(2026, 9, 1), status="present"),
        Certificate(
            student_id=alvo.id, class_group_id=turma.id, level="Básico",
            control_number=f"CERT-CASCADE-{alvo.id}", issue_date=date(2026, 10, 1),
            media=8, frequency=90,
        ),
    ])
    await db_session.commit()
    assert carne.id is not None
    assert inst.id is not None
    assert matricula.id is not None

    resp = client.delete(f"/api/students/{alvo.id}", headers=auth_headers)
    assert resp.status_code == 200, resp.text

    assert await _count(db_session, Student, id=alvo.id) == 0
    assert await _count(db_session, Responsible, student_id=alvo.id) == 0
    assert await _count(db_session, FileUpload, student_id=alvo.id) == 0
    assert await _count(db_session, Enrollment, student_id=alvo.id) == 0
    assert await _count(db_session, Carne, student_id=alvo.id) == 0
    assert await _count(db_session, Installment, student_id=alvo.id) == 0
    assert await _count(db_session, Payment, installment_id=inst.id) == 0
    assert await _count(db_session, Discount, student_id=alvo.id) == 0
    assert await _count(db_session, MaterialSale, student_id=alvo.id) == 0
    assert await _count(db_session, FinancialContract, student_id=alvo.id) == 0
    assert await _count(db_session, Evaluation, student_id=alvo.id) == 0
    assert await _count(db_session, Attendance, student_id=alvo.id) == 0
    assert await _count(db_session, Certificate, student_id=alvo.id) == 0


async def _turma_isolada(db, curso, professor, nome: str):
    from app.models.class_group import ClassGroup
    from datetime import time
    return await _get_or_create(db, ClassGroup, {"name": nome}, {
        "name": nome, "course_id": curso.id, "teacher_id": professor.id,
        "weekdays": "seg,qua", "start_time": time(19, 0), "end_time": time(20, 30),
        "level": "Básico", "is_active": True,
    })


# ---------------------------------------------------------------------------
# Turma: peso de avaliação, matrícula inativa + carnê vinculado
# ---------------------------------------------------------------------------

async def test_excluir_turma_com_peso_matricula_inativa_e_carne(client, auth_headers, curso, professor, aluno, db_session):
    turma = await _turma_isolada(db_session, curso, professor, "Turma-Cascata")
    matricula = Enrollment(
        student_id=aluno.id, class_group_id=turma.id,
        enrollment_date=date(2026, 2, 1), status="inactive",
    )
    db_session.add(matricula)
    await db_session.commit()

    carne = Carne(
        student_id=aluno.id, enrollment_id=matricula.id, total_installments=1,
        installment_value=100, first_due_date=date(2026, 3, 10), status="active",
    )
    db_session.add(carne)
    await db_session.commit()
    carne_id = carne.id

    db_session.add_all([
        GradeWeightConfig(class_group_id=turma.id, label="Prova", eval_type="prova", weight=1.0, max_score=10),
        Evaluation(
            student_id=aluno.id, class_group_id=turma.id, eval_type="prova",
            title="P1", date=date(2026, 9, 20), score=8, max_score=10, weight=1,
        ),
        Attendance(student_id=aluno.id, class_group_id=turma.id, date=date(2026, 9, 1), status="present"),
        Certificate(
            student_id=aluno.id, class_group_id=turma.id, level="Básico",
            control_number=f"CERT-TURMA-{turma.id}", issue_date=date(2026, 10, 1),
            media=8, frequency=90,
        ),
    ])
    await db_session.commit()

    resp = client.delete(f"/api/classes/{turma.id}", headers=auth_headers)
    assert resp.status_code == 200, resp.text

    assert await _count(db_session, GradeWeightConfig, class_group_id=turma.id) == 0
    assert await _count(db_session, Enrollment, class_group_id=turma.id) == 0
    assert await _count(db_session, Evaluation, class_group_id=turma.id) == 0
    assert await _count(db_session, Attendance, class_group_id=turma.id) == 0
    assert await _count(db_session, Certificate, class_group_id=turma.id) == 0
    # Carnê preservado no financeiro, apenas desvinculado da matrícula (FK não quebra)
    assert await _count(db_session, Carne, id=carne_id) == 1
    assert await _count(db_session, Carne, id=carne_id, student_id=aluno.id) == 1
    r = await db_session.execute(
        select(func.count()).select_from(Carne).where(
            Carne.id == carne_id, Carne.enrollment_id.is_(None),
        )
    )
    assert r.scalar_one() == 1


async def test_excluir_turma_com_matricula_ativa_bloqueia(client, auth_headers, curso, professor, aluno, db_session):
    turma = await _turma_isolada(db_session, curso, professor, "Turma-Bloqueada")
    db_session.add(Enrollment(
        student_id=aluno.id, class_group_id=turma.id,
        enrollment_date=date(2026, 2, 1), status="active",
    ))
    await db_session.commit()

    resp = client.delete(f"/api/classes/{turma.id}", headers=auth_headers)
    assert resp.status_code == 400, resp.text
    assert "ativa" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Curso: plano financeiro vinculado / turma vinculada
# ---------------------------------------------------------------------------

async def test_excluir_curso_desvincula_plano_financeiro(client, auth_headers, db_session):
    from app.models.course import Course
    curso_livre = await _get_or_create(db_session, Course, {"name": "Curso Livre Cascata"}, {
        "name": "Curso Livre Cascata", "level": "Básico",
    })
    plan = await _get_or_create(db_session, FinancialPlan, {"name": "Plano-do-Curso-Livre"}, {
        "name": "Plano-do-Curso-Livre", "value": 100, "installments": 3, "is_active": 1,
        "course_id": curso_livre.id,
    })
    course_id = curso_livre.id

    resp = client.delete(f"/api/courses/{course_id}", headers=auth_headers)
    assert resp.status_code == 200, resp.text

    r = await db_session.execute(
        select(func.count()).select_from(FinancialPlan).where(
            FinancialPlan.id == plan.id, FinancialPlan.course_id.is_(None),
        )
    )
    assert r.scalar_one() == 1


async def test_excluir_curso_com_turma_bloqueia(client, auth_headers, curso, turma, db_session):
    resp = client.delete(f"/api/courses/{curso.id}", headers=auth_headers)
    assert resp.status_code == 400, resp.text
    assert "turmas" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Plano financeiro: em uso por carnê / limpo
# ---------------------------------------------------------------------------

async def test_excluir_plano_em_uso_por_carne_bloqueia(client, auth_headers, aluno, db_session):
    plan = await _get_or_create(db_session, FinancialPlan, {"name": "Plano-Em-Uso"}, {
        "name": "Plano-Em-Uso", "value": 100, "installments": 1, "is_active": 1,
    })
    carne = Carne(
        student_id=aluno.id, total_installments=1,
        installment_value=100, first_due_date=date(2026, 3, 10), status="active",
    )
    db_session.add(carne)
    await db_session.commit()
    db_session.add(Installment(
        student_id=aluno.id, carnet_id=carne.id, plan_id=plan.id,
        description="1/1", amount=100, due_date=date(2026, 3, 10), status="pending",
    ))
    await db_session.commit()

    resp = client.delete(f"/api/financial/plans/{plan.id}", headers=auth_headers)
    assert resp.status_code == 400, resp.text
    assert "em uso" in resp.json()["detail"].lower()


async def test_excluir_plano_limpo(client, auth_headers, db_session):
    plan = await _get_or_create(db_session, FinancialPlan, {"name": "Plano-Limpo"}, {
        "name": "Plano-Limpo", "value": 200, "installments": 6, "is_active": 1,
    })
    plan_id = plan.id

    resp = client.delete(f"/api/financial/plans/{plan_id}", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    assert await _count(db_session, FinancialPlan, id=plan_id) == 0