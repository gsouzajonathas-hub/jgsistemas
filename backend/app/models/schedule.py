from sqlalchemy import Column, Integer, String, DateTime, Date, Time, Text
from sqlalchemy.sql import func
from app.database import Base


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    event_type = Column(String(20), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time)
    end_time = Column(Time)
    description = Column(Text)
    color = Column(String(20), default="#3B82F6")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
