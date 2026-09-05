from app.models.audit_log import AuditLog


async def log_audit(db, user, action: str, entity: str = None, entity_id=None,
                    details: str = None, ip_address: str = None):
    entry = AuditLog(
        user_id=user.id if user else None,
        actor_role=user.role if user else None,
        action=action,
        entity=entity,
        entity_id=entity_id,
        details=details,
        ip_address=ip_address,
    )
    db.add(entry)
