from sqlalchemy import Column, Integer, String, DateTime, Date, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    class_group_id = Column(Integer, ForeignKey("class_groups.id"), nullable=False)
    level = Column(String(100), nullable=False)
    course_name = Column(String(300))
    teacher_name = Column(String(300))
    media = Column(Float, default=0)
    frequency = Column(Float, default=0)
    workload_hours = Column(Integer, default=0)
    control_number = Column(String(50), unique=True, index=True)
    issue_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student")
    class_group = relationship("ClassGroup")
