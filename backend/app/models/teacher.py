from sqlalchemy import Column, Integer, String, DateTime, Date, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    photo_url = Column(String(500))
    full_name = Column(String(300), nullable=False, index=True)
    cpf = Column(String(14), unique=True)
    phone = Column(String(20))
    whatsapp = Column(String(20))
    email = Column(String(255))
    specialization = Column(String(200))
    hourly_rate = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    classes = relationship("ClassGroup", back_populates="teacher")
