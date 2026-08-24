from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.course import Course
from app.utils.auth import get_current_user

router = APIRouter()


@router.get("")
async def list_courses(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).order_by(Course.name))
    return [{"id": c.id, "name": c.name, "level": c.level or ""} for c in result.scalars().all()]
