from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.teacher import Teacher
from app.utils.auth import get_current_user

router = APIRouter()


@router.get("")
async def list_teachers(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Teacher).where(Teacher.is_active == True).order_by(Teacher.full_name))  # noqa: E712
    return [{"id": t.id, "full_name": t.full_name} for t in result.scalars().all()]
