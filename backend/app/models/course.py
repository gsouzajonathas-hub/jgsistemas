from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    level = Column(String(100), nullable=False)
    description = Column(String(500))
    duration_hours = Column(Integer, default=0)
    price = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    classes = relationship("ClassGroup", back_populates="course")
