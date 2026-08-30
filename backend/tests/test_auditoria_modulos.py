"""As ações dos módulos reativados gravam trilha de auditoria (padrão D-08)."""

from sqlalchemy import select

from app.models.audit_log import AuditLog


async def _actions(db_session) -> set:
    result = await db_session.execute(select(AuditLog.action))
    return {row[0] for row in result.all()}


async def test_attendance_bulk_auditado(client, auth_headers, aluno, turma, db_session):
    resp = client.post(
        "/api/attendance/bulk",
        headers=auth_headers,
        json={
            "class_group_id": turma.id,
            "date": "2026-08-29",
            "records": [{"student_id": aluno.id, "status": "present", "notes": ""}],
        },
    )
    assert resp.status_code == 200
    assert "attendance.bulk" in await _actions(db_session)


async def test_evaluations_create_e_bulk_auditados(client, auth_headers, aluno, turma, db_session):
    resp_create = client.post(
        "/api/evaluations",
        headers=auth_headers,
        json={
            "student_id": aluno.id,
            "class_group_id": turma.id,
            "eval_type": "prova",
            "title": "Prova 1",
            "date": "2026-08-29",
            "score": 8.0,
            "max_score": 10,
            "weight": 1.0,
        },
    )
    assert resp_create.status_code == 200

    resp_bulk = client.post(
        "/api/evaluations/bulk",
        headers=auth_headers,
        json={
            "class_group_id": turma.id,
            "eval_type": "trabalho",
            "title": "Trabalho 1",
            "date": "2026-08-30",
            "scores": [{"student_id": aluno.id, "score": 9.0}],
        },
    )
    assert resp_bulk.status_code == 200

    actions = await _actions(db_session)
    assert "evaluation.create" in actions
    assert "evaluation.bulk" in actions


async def test_turma_create_auditado(client, auth_headers, curso, professor, db_session):
    resp = client.post(
        "/api/classes",
        headers=auth_headers,
        json={
            "name": "Turma B1",
            "course_id": curso.id,
            "teacher_id": professor.id,
            "weekdays": "ter,qui",
            "start_time": "09:00",
            "end_time": "10:30",
        },
    )
    assert resp.status_code == 200
    assert "class.create" in await _actions(db_session)