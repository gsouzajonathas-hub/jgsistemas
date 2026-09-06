"""popula_permissions_admins_existentes

Migracao de DADOS (super-admin-master, D-05): usuarios com role='admin' ja existentes no
banco antes da introducao do enforcement real de permissoes (D-02/D-03) ganham automaticamente
todos os modulos em `permissions`, para nao perder acesso no deploy sem intervencao manual.
So toca quem tem permissions NULL (nunca customizado) — nunca sobrescreve quem ja tem algo.

Revision ID: f85cb2a46b22
Revises: 892b733803aa
Create Date: 2026-09-05 20:41:41.863558

"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f85cb2a46b22'
down_revision: Union[str, Sequence[str], None] = '892b733803aa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TODOS_OS_MODULOS = [
    "dashboard", "students", "enrollments", "courses", "teachers", "classes",
    "attendance", "evaluations", "boletins", "certificates", "financial",
    "schedule", "reports", "audit", "settings",
]


def upgrade() -> None:
    """Popula permissions dos admins existentes sem permissions customizado."""
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "UPDATE users SET permissions = :permissoes "
            "WHERE role = 'admin' AND permissions IS NULL"
        ),
        {"permissoes": json.dumps(TODOS_OS_MODULOS)},
    )


def downgrade() -> None:
    """Nao ha como saber com seguranca quais linhas foram tocadas por esta migracao
    (permissions volta a ficar NULL para TODO admin, mesmo quem customizou depois) —
    por isso o downgrade e um no-op deliberado: reverter dados populados e potencialmente
    ja customizados e mais arriscado que manter o estado atual."""
    pass
