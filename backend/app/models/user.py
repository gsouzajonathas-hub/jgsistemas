from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="secretary", nullable=False)
    permissions = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String(500))
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)
    reset_token_hash = Column(String(64), nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    audit_logs = relationship("AuditLog", back_populates="user", passive_deletes=True)
    school = relationship("School", back_populates="users")
