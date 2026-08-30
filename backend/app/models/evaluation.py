from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    class_group_id = Column(Integer, ForeignKey("class_groups.id"), nullable=False)
    eval_type = Column(String(20), nullable=False)
    title = Column(String(300), nullable=False)
    date = Column(Date, nullable=False)
    score = Column(Float, default=0)
    max_score = Column(Float, default=10)
    weight = Column(Float, default=1.0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="evaluations")
