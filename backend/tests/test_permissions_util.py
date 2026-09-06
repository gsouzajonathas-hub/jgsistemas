"""T-01.02 (super-admin-master): require_permission e ALL_MODULES."""
import pytest
from fastapi import HTTPException

from app.utils.permissions import require_permission, ALL_MODULES


def test_all_modules_tem_15_chaves_conhecidas():
    """T-02.02 (D-04): audit e settings entram na lista de modulos controlaveis."""
    assert len(ALL_MODULES) == 15
    esperado = {
        "dashboard", "students", "enrollments", "courses", "teachers", "classes",
        "attendance", "evaluations", "boletins", "certificates", "financial",
        "schedule", "reports", "audit", "settings",
    }
    assert set(ALL_MODULES) == esperado


async def test_require_permission_super_admin_sempre_passa(client, super_admin_user):
    checker = require_permission("financial")
    resultado = await checker(current_user=super_admin_user)
    assert resultado is super_admin_user


async def test_require_permission_usuario_com_modulo_passa(client, admin_todos_modulos_user):
    checker = require_permission("financial")
    resultado = await checker(current_user=admin_todos_modulos_user)
    assert resultado is admin_todos_modulos_user


async def test_require_permission_usuario_sem_modulo_recebe_403(client, admin_sem_modulos_user):
    checker = require_permission("financial")
    with pytest.raises(HTTPException) as exc_info:
        await checker(current_user=admin_sem_modulos_user)
    assert exc_info.value.status_code == 403
