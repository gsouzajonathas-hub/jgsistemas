from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    class_group_id = Column(Integer, ForeignKey("class_groups.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="attendances")
    class_group = relationship("ClassGroup", back_populates="attendances")
