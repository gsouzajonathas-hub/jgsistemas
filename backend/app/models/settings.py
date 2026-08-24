from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class SchoolSettings(Base):
    __tablename__ = "school_settings"

    id = Column(Integer, primary_key=True, index=True)
    school_name = Column(String(300), default="Gestão Escolar")
    logo_url = Column(String(500))
    address = Column(String(500))
    phone = Column(String(50))
    email = Column(String(255))
    cnpj = Column(String(20))
    pix_key = Column(String(200))
    slogan = Column(String(300))
    social_media = Column(String(200))
    payment_methods = Column(String(200), default="PIX,Dinheiro,Débito,Crédito")
    primary_color = Column(String(20), default="#3B82F6")
    dark_mode = Column(Integer, default=0)
    due_day = Column(Integer, default=5)
    extra_settings = Column(Text, default="{}")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
