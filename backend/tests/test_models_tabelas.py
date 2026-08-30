"""Os 4 models reativados (Attendance, Evaluation, Certificate, GradeWeightConfig)
estão importáveis pelo package de models e criam suas tabelas no banco."""

from app.models import (
    Attendance,
    Certificate,
    Evaluation,
    GradeWeightConfig,
)


def test_models_reativados_importam():
    assert Attendance.__tablename__ == "attendances"
    assert Evaluation.__tablename__ == "evaluations"
    assert Certificate.__tablename__ == "certificates"
    assert GradeWeightConfig.__tablename__ == "grade_weight_configs"


async def test_tabelas_criadas(client, db_session):
    from sqlalchemy import inspect

    async with db_session.bind.connect() as conn:
        tables = await conn.run_sync(lambda sync_conn: inspect(sync_conn).get_table_names())
    for table in ["attendances", "evaluations", "certificates", "grade_weight_configs"]:
        assert table in tables, f"tabela {table} não foi criada"