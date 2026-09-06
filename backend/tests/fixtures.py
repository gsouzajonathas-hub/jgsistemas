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
from app.models.settings import SchoolSettings
from app.models.materials import TeachingMaterial, MaterialSale
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
    # super-admin-master D-05: em producao, a migracao popula `permissions` de todo admin
    # pre-existente com todos os modulos. Esta fixture e' usada por dezenas de testes de OUTRAS
    # features que esperam um admin com acesso total — simula aqui o estado pos-migracao.
    import json
    from app.utils.permissions import ALL_MODULES
    return await _get_or_create(
        db_session,
        User,
        filters={"email": "admin@teste.local"},
        defaults={
            "name": "Admin Teste",
            "email": "admin@teste.local",
            "password_hash": hash_password("senha-forte-123"),
            "role": "admin",
            "permissions": json.dumps(ALL_MODULES),
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


@pytest.fixture
async def settings_com_pix(db_session: AsyncSession) -> SchoolSettings:
    """SchoolSettings única (linha 1) com pix_key — formato esperado por GET/PUT /api/settings."""
    return await _get_or_create(
        db_session,
        SchoolSettings,
        filters={"id": 1},
        defaults={
            "school_name": "Escola Teste",
            "pix_key": "teste@pix.local",
            "payment_methods": "PIX,Dinheiro,Débito,Crédito",
        },
    )


@pytest.fixture
async def material_sale_ctx(db_session: AsyncSession) -> dict:
    """Contexto de venda de material didático: material + aluno + venda (MaterialSale com .id)."""
    material = await _get_or_create(
        db_session,
        TeachingMaterial,
        filters={"name": "Apostila Teste"},
        defaults={
            "name": "Apostila Teste",
            "description": "Material de apoio",
            "price": 45.90,
            "stock": 20,
            "category": "Didático",
            "is_active": 1,
        },
    )
    student = await _get_or_create(
        db_session,
        Student,
        filters={"cpf": "88877766655"},
        defaults={
            "full_name": "Aluna Material",
            "cpf": "88877766655",
            "email": "material@teste.local",
            "status": "active",
            "unit": "Matriz",
            "enrollment_date": date(2026, 2, 1),
        },
    )
    sale = await _get_or_create(
        db_session,
        MaterialSale,
        filters={"material_id": material.id, "student_id": student.id},
        defaults={
            "material_id": material.id,
            "student_id": student.id,
            "quantity": 1,
            "unit_price": 45.90,
            "total_price": 45.90,
            "payment_method": "PIX",
        },
    )
    ctx = type("MaterialSaleCtx", (), {})()
    ctx.material = material
    ctx.student = student
    ctx.sale = sale
    return ctx


# Módulos existentes antes da introdução de audit/settings (T-02.02) — mantidos aqui como
# lista literal para não depender de app.utils.permissions.ALL_MODULES, que só passa a existir
# na T-01.02 (esta fixture é consumida por ela).
_MODULOS_CONHECIDOS_SPRINT01 = [
    "dashboard", "students", "enrollments", "courses", "teachers", "classes",
    "attendance", "evaluations", "boletins", "certificates", "financial",
    "schedule", "reports",
]


@pytest.fixture
async def super_admin_user(db_session: AsyncSession) -> User:
    return await _get_or_create(
        db_session,
        User,
        filters={"email": "super-admin@teste.local"},
        defaults={
            "name": "Super Admin Teste",
            "email": "super-admin@teste.local",
            "password_hash": hash_password("senha-super-123"),
            "role": "super_admin",
            "is_active": True,
        },
    )


@pytest.fixture
async def super_admin_headers(super_admin_user: User) -> dict:
    token = create_access_token({"sub": str(super_admin_user.id), "role": super_admin_user.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def admin_todos_modulos_user(db_session: AsyncSession) -> User:
    import json
    return await _get_or_create(
        db_session,
        User,
        filters={"email": "admin-todos-modulos@teste.local"},
        defaults={
            "name": "Admin Todos Modulos",
            "email": "admin-todos-modulos@teste.local",
            "password_hash": hash_password("senha-forte-123"),
            "role": "admin",
            "permissions": json.dumps(_MODULOS_CONHECIDOS_SPRINT01),
            "is_active": True,
        },
    )


@pytest.fixture
async def admin_headers_todos_modulos(admin_todos_modulos_user: User) -> dict:
    token = create_access_token({"sub": str(admin_todos_modulos_user.id), "role": admin_todos_modulos_user.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def admin_sem_modulos_user(db_session: AsyncSession) -> User:
    import json
    return await _get_or_create(
        db_session,
        User,
        filters={"email": "admin-sem-modulos@teste.local"},
        defaults={
            "name": "Admin Sem Modulos",
            "email": "admin-sem-modulos@teste.local",
            "password_hash": hash_password("senha-forte-123"),
            "role": "admin",
            "permissions": json.dumps([]),
            "is_active": True,
        },
    )


@pytest.fixture
async def admin_headers_sem_modulos(admin_sem_modulos_user: User) -> dict:
    token = create_access_token({"sub": str(admin_sem_modulos_user.id), "role": admin_sem_modulos_user.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def headers_com_permissoes(db_session: AsyncSession):
    """Factory de headers de autenticacao para testar enforcement por modulo (sprint-03).

    Uso: `headers_com_permissoes("secretary", ["students"])` -> dict de headers de um
    secretary novo com só o módulo `students` liberado. Um email exclusivo por chamada evita
    colisao com outros usuarios do banco de sessao compartilhado.
    """
    import json
    import uuid

    async def _factory(role: str, permissoes: list) -> dict:
        email = f"enforcement-{uuid.uuid4().hex[:12]}@teste.local"
        user = User(
            name=f"Enforcement {role}",
            email=email,
            password_hash=hash_password("senha-forte-123"),
            role=role,
            permissions=json.dumps(permissoes),
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        token = create_access_token({"sub": str(user.id), "role": user.role})
        return {"Authorization": f"Bearer {token}"}

    return _factory


@pytest.fixture
def valores_super_admin() -> dict:
    """Credenciais do Super Admin de suporte — mesmo formato das env vars de produção."""
    return {
        "email": "suporte@teste.local",
        "password": "suporte-teste-123",
        "name": "Suporte Teste",
    }