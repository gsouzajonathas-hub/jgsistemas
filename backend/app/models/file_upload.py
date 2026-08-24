from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class FileUpload(Base):
    __tablename__ = "file_uploads"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    file_name = Column(String(300), nullable=False)
    file_type = Column(String(50))
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    category = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="files")
