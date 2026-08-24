from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class TeachingMaterial(Base):
    __tablename__ = "teaching_materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False, default=0)
    stock = Column(Integer, default=0)
    category = Column(String(100), default="")
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sales = relationship("MaterialSale", back_populates="material")


class MaterialSale(Base):
    __tablename__ = "material_sales"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("teaching_materials.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(50), default="")
    notes = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    material = relationship("TeachingMaterial", back_populates="sales")
    student = relationship("Student")
