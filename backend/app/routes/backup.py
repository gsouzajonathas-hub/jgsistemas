from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.utils.auth import require_role
from app.services.backup_service import export_database, build_pretty_json

router = APIRouter()


@router.get("/export")
async def export_backup(db: AsyncSession = Depends(get_db), _current_user=Depends(require_role("admin"))):
    """Exporta o banco completo em JSON (backup do painel). Apenas administradores."""
    data = await export_database(db)
    payload = build_pretty_json(data)
    timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H%M%S")
    filename = f"backup-painel-{timestamp}.json"
    return Response(
        content=payload,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
