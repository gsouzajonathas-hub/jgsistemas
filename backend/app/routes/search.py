from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.models.student import Student
from app.utils.auth import get_current_user

router = APIRouter()


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("")
async def search_all(q: str = "", current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not q or len(q) < 2:
        return {"results": []}

    results = []

    students = await db.execute(
        select(Student).where(or_(
            Student.full_name.ilike(f"%{_escape_like(q)}%", escape="\\"),
            Student.cpf.ilike(f"%{_escape_like(q)}%", escape="\\"),
            Student.email.ilike(f"%{_escape_like(q)}%", escape="\\"),
            Student.phone.ilike(f"%{_escape_like(q)}%", escape="\\")
        )).limit(10)
    )
    for s in students.scalars().all():
        results.append({
            "type": "student", "id": s.id, "title": s.full_name,
            "subtitle": f"CPF: {s.cpf or '-'} | Tel: {s.phone or '-'}",
            "url": f"/students/{s.id}"
        })

    return {"results": results}
