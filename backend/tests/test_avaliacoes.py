"""T-02.08 — suíte de integração do módulo de avaliações (CRUD, bulk, média ponderada)."""

from datetime import date

from sqlalchemy import select

from app.models.evaluation import Evaluation
from app.models.student import Student


async def _novo_aluno(db_session, nome: str, cpf: str) -> Student:
    novo = Student(full_name=nome, cpf=cpf, email=f"{cpf}@teste.local", status="active")
    db_session.add(novo)
    await db_session.commit()
    await db_session.refresh(novo)
    return novo


async def test_criar_e_listar_avaliacao(client, auth_headers, aluno, turma):
    resp = client.post(
        "/api/evaluations",
        headers=auth_headers,
        json={
            "student_id": aluno.id,
            "class_group_id": turma.id,
            "eval_type": "prova",
            "title": "Prova Módulo 3",
            "date": "2026-10-05",
            "score": 8.5,
            "max_score": 10,
            "weight": 2.0,
        },
    )
    assert resp.status_code == 200, resp.text
    eval_id = resp.json()["id"]

    lista = client.get(f"/api/evaluations?student_id={aluno.id}", headers=auth_headers)
    assert lista.status_code == 200
    match = [e for e in lista.json() if e["id"] == eval_id]
    assert len(match) == 1
    assert match[0]["student_name"] == "Aluno Teste"
    assert match[0]["title"] == "Prova Módulo 3"


async def test_media_ponderada(client, auth_headers, turma, db_session):
    duda = await _novo_aluno(db_session, "Duda Media", "11122233347")
    db_session.add_all([
        Evaluation(
            student_id=duda.id, class_group_id=turma.id,
            eval_type="prova", title="P1", date=date(2026, 10, 5),
            score=8.0, max_score=10, weight=1.0,
        ),
        Evaluation(
            student_id=duda.id, class_group_id=turma.id,
            eval_type="trabalho", title="T1", date=date(2026, 10, 6),
            score=9.0, max_score=10, weight=3.0,
        ),
    ])
    await db_session.commit()

    resp = client.get(f"/api/evaluations/average/{duda.id}", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    esperado = round(((0.8 * 1 + 0.9 * 3) / 4) * 100, 2)
    assert body["average"] == esperado == 87.5
    assert body["status"] == "Aprovado"
    assert body["total_evaluations"] == 2


async def test_media_sem_avaliacoes(client, auth_headers, db_session):
    sem = await _novo_aluno(db_session, "Sem Avaliacao", "11122233348")
    resp = client.get(f"/api/evaluations/average/{sem.id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == {"average": 0, "status": "Sem avaliações"}


async def test_bulk(client, auth_headers, aluno, turma, db_session):
    edu = await _novo_aluno(db_session, "Edu Bulk", "11122233349")
    resp = client.post(
        "/api/evaluations/bulk",
        headers=auth_headers,
        json={
            "class_group_id": turma.id,
            "eval_type": "trabalho",
            "title": "Trabalho 2",
            "date": "2026-10-10",
            "scores": [
                {"student_id": aluno.id, "score": 7.5},
                {"student_id": edu.id, "score": 6.0},
            ],
        },
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["created"] == 2


async def test_update_e_delete(client, auth_headers, aluno, turma):
    criado = client.post(
        "/api/evaluations",
        headers=auth_headers,
        json={
            "student_id": aluno.id,
            "class_group_id": turma.id,
            "eval_type": "prova",
            "title": "Prova Atualizável",
            "date": "2026-10-12",
            "score": 6.0,
        },
    ).json()
    eval_id = criado["id"]

    upd = client.put(
        f"/api/evaluations/{eval_id}",
        headers=auth_headers,
        json={
            "student_id": aluno.id,
            "class_group_id": turma.id,
            "eval_type": "prova",
            "title": "Prova Atualizável",
            "date": "2026-10-12",
            "score": 10.0,
        },
    )
    assert upd.status_code == 200

    lista = client.get(f"/api/evaluations?student_id={aluno.id}", headers=auth_headers).json()
    assert [e for e in lista if e["id"] == eval_id][0]["score"] == 10.0

    dele = client.delete(f"/api/evaluations/{eval_id}", headers=auth_headers)
    assert dele.status_code == 200
    dele2 = client.delete(f"/api/evaluations/{eval_id}", headers=auth_headers)
    assert dele2.status_code == 404
    upd2 = client.put(
        f"/api/evaluations/{eval_id}",
        headers=auth_headers,
        json={
            "student_id": aluno.id,
            "class_group_id": turma.id,
            "eval_type": "prova",
            "title": "X",
            "date": "2026-10-12",
        },
    )
    assert upd2.status_code == 404