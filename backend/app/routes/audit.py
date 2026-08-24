from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.utils.auth import require_role

router = APIRouter()


@router.get("")
async def list_audit(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    total = await db.execute(select(func.count()).select_from(AuditLog))
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    )
    logs = result.scalars().all()

    user_ids = {l.user_id for l in logs if l.user_id}
    users = {}
    if user_ids:
        r = await db.execute(select(User).where(User.id.in_(user_ids)))
        users = {u.id: u.name for u in r.scalars().all()}

    return {
        "total": total.scalar() or 0,
        "logs": [{
            "id": l.id,
            "user_name": users.get(l.user_id, "Sistema"),
            "action": l.action,
            "entity": l.entity,
            "entity_id": l.entity_id,
            "details": l.details,
            "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        } for l in logs],
    }
