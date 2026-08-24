from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.schedule import CalendarEvent
from app.utils.auth import get_current_user, require_role
from app.utils.audit import log_audit

router = APIRouter()


class EventSchema(BaseModel):
    title: str
    event_type: str
    date: str
    start_time: str = ""
    end_time: str = ""
    description: str = ""
    color: str = "#3B82F6"


@router.get("")
async def list_events(month: int = None, year: int = None,
                      current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    q = select(CalendarEvent)
    if month and year:
        from datetime import date
        start = date(year, month, 1)
        if month == 12:
            end = date(year + 1, 1, 1)
        else:
            end = date(year, month + 1, 1)
        q = q.where(CalendarEvent.date >= start, CalendarEvent.date < end)
    q = q.order_by(CalendarEvent.date)
    result = await db.execute(q)
    events = result.scalars().all()
    return [{"id": e.id, "title": e.title, "event_type": e.event_type or "",
             "date": e.date.isoformat(), "start_time": str(e.start_time) if e.start_time else "",
             "end_time": str(e.end_time) if e.end_time else "",
             "description": e.description, "color": e.color} for e in events]


@router.post("")
async def create_event(data: EventSchema, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    from datetime import date, time as t
    d = data.model_dump()
    if d.get("date"):
        d["date"] = date.fromisoformat(d["date"])
    else:
        d["date"] = date.today()
    d["event_type"] = d["event_type"]
    if d.get("start_time"):
        d["start_time"] = t.fromisoformat(d["start_time"])
    else:
        d.pop("start_time", None)
    if d.get("end_time"):
        d["end_time"] = t.fromisoformat(d["end_time"])
    else:
        d.pop("end_time", None)
    event = CalendarEvent(**d)
    db.add(event)
    await log_audit(db, current_user, "event.create", "calendar_event", None, f"title={data.title}", ip_address=None)
    await db.commit()
    return {"id": event.id, "message": "Evento criado com sucesso"}


@router.delete("/{event_id}")
async def delete_event(event_id: int, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CalendarEvent).where(CalendarEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    await log_audit(db, current_user, "event.delete", "calendar_event", event_id, f"title={event.title}", ip_address=None)
    await db.delete(event)
    await db.commit()
    return {"message": "Evento excluído"}
