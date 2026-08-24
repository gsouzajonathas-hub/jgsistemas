from sqlalchemy import Column, Integer, String, DateTime, Date, Text, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    photo_url = Column(String(500))
    full_name = Column(String(300), nullable=False, index=True)
    cpf = Column(String(14), unique=True, index=True)
    rg = Column(String(20))
    birth_date = Column(Date)
    gender = Column(String(5))
    marital_status = Column(String(20))
    phone = Column(String(20))
    whatsapp = Column(String(20))
    email = Column(String(255))
    zip_code = Column(String(10))
    street = Column(String(300))
    number = Column(String(20))
    neighborhood = Column(String(200))
    city = Column(String(200))
    state = Column(String(2))
    english_level = Column(String(50))
    enrollment_date = Column(Date)
    status = Column(String(20), default="active")
    notes = Column(Text)
    unit = Column(String(100), default="Matriz")
    monthly_fee = Column(Numeric(10, 2))
    due_day = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    responsible = relationship("Responsible", back_populates="student", uselist=False, cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    files = relationship("FileUpload", back_populates="student", cascade="all, delete-orphan")


class Responsible(Base):
    __tablename__ = "responsibles"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False)
    full_name = Column(String(300), nullable=False)
    cpf = Column(String(14))
    phone = Column(String(20))
    email = Column(String(255))
    parentesco = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="responsible")
