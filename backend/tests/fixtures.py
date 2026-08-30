"""Fixtures compartilhadas de negócio (admin, autenticação, curso, professor, turma, aluno).

Usam o banco SQLite temporário do conftest (DATABASE_URL sobrescrito antes do import).
Todas as fixtures são idempotentes: buscadas por chave única antes de criar, para que
múltiplos arquivos de teste possam usá-las no mesmo banco de sessão sem violar UNIQUE.
"""
import pytest
from datetime import time, date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.course import Course
from app.models.class_group import ClassGroup
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.user import User
from app.utils.auth import create_access_token, hash_password


@pytest.fixture
async def db_session() -> AsyncSession:
    async with async_session() as session:
        yield session


async def _get_or_create(db_session: AsyncSession, model, filters: dict, defaults: dict):
    result = await db_session.execute(select(model).where(*[getattr(model, k) == v for k, v in filters.items()]))
    obj = result.scalar_one_or_none()
    if obj is None:
        obj = model(**defaults)
        db_session.add(obj)
        await db_session.commit()
        await db_session.refresh(obj)
    return obj


@pytest.fixture
async def admin_user(db_session: AsyncSession) -> User:
    return await _get_or_create(
        db_session,
        User,
        filters={"email": "admin@teste.local"},
        defaults={
            "name": "Admin Teste",
            "email": "admin@teste.local",
            "password_hash": hash_password("senha-forte-123"),
            "role": "admin",
            "is_active": True,
        },
    )


@pytest.fixture
async def auth_headers(admin_user: User) -> dict:
    token = create_access_token({"sub": str(admin_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def curso(db_session: AsyncSession) -> Course:
    return await _get_or_create(
        db_session,
        Course,
        filters={"name": "Inglês"},
        defaults={"name": "Inglês", "level": "Básico"},
    )


@pytest.fixture
async def professor(db_session: AsyncSession) -> Teacher:
    return await _get_or_create(
        db_session,
        Teacher,
        filters={"cpf": "11122233344"},
        defaults={
            "full_name": "Professora Ana",
            "cpf": "11122233344",
            "email": "ana@teste.local",
            "is_active": True,
        },
    )


@pytest.fixture
async def turma(db_session: AsyncSession, curso: Course, professor: Teacher) -> ClassGroup:
    return await _get_or_create(
        db_session,
        ClassGroup,
        filters={"name": "Turma A1"},
        defaults={
            "name": "Turma A1",
            "course_id": curso.id,
            "teacher_id": professor.id,
            "weekdays": "seg,qua",
            "start_time": time(19, 0),
            "end_time": time(20, 30),
            "max_capacity": 20,
            "level": "Básico",
            "is_active": True,
        },
    )


@pytest.fixture
async def aluno(db_session: AsyncSession) -> Student:
    return await _get_or_create(
        db_session,
        Student,
        filters={"cpf": "99988877766"},
        defaults={
            "full_name": "Aluno Teste",
            "cpf": "99988877766",
            "email": "aluno@teste.local",
            "status": "active",
            "unit": "Matriz",
            "enrollment_date": date(2026, 2, 1),
        },
    )