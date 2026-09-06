"""Enforcement real de permissao por modulo (super-admin-master, D-02/D-03).

`ALL_MODULES` e a lista de chaves de modulo validas. `require_permission(modulo)` substitui
`require_role` nas rotas de negocio: super_admin sempre passa (bypass total, D-02); qualquer
outro role (inclusive admin) precisa ter o modulo em `permissions` (JSON no User).
"""
import json

from fastapi import Depends, HTTPException

from app.models.user import User
from app.utils.auth import get_current_user

ALL_MODULES = [
    "dashboard", "students", "enrollments", "courses", "teachers", "classes",
    "attendance", "evaluations", "boletins", "certificates", "financial",
    "schedule", "reports", "audit", "settings",
]


def require_permission(modulo: str):
    async def checker(current_user: User = Depends(get_current_user)):
        if current_user.role == "super_admin":
            return current_user
        permissoes = json.loads(current_user.permissions) if current_user.permissions else []
        if modulo not in permissoes:
            raise HTTPException(status_code=403, detail="Acesso negado a este modulo")
        return current_user
    return checker
