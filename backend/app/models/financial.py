from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Numeric, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class FinancialPlan(Base):
    __tablename__ = "financial_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    value = Column(Numeric(10, 2), nullable=False)
    description = Column(Text)
    installments = Column(Integer, default=1)
    is_active = Column(Integer, default=1)
    course_id = Column(Integer, ForeignKey("courses.id"))
    duration_months = Column(Integer, default=1)
    discount_type = Column(String(20), default="percent")
    discount_value = Column(Numeric(10, 2), default=0)
    upfront_discount_pct = Column(Numeric(10, 2), default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FinancialContract(Base):
    __tablename__ = "financial_contracts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("financial_plans.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    mode = Column(String(20), default="installments")
    installments_count = Column(Integer, default=1)
    monthly_value = Column(Numeric(10, 2), default=0)
    gross_total = Column(Numeric(10, 2), default=0)
    discount_type = Column(String(20), default="percent")
    discount_value = Column(Numeric(10, 2), default=0)
    discount_amount = Column(Numeric(10, 2), default=0)
    final_value = Column(Numeric(10, 2), default=0)
    upfront_discount_amount = Column(Numeric(10, 2), default=0)
    total_due = Column(Numeric(10, 2), default=0)
    guardian_name = Column(String(200))
    guardian_cpf = Column(String(20))
    guardian_phone = Column(String(50))
    guardian_email = Column(String(255))
    notes = Column(Text)
    status = Column(String(20), default="pending")
    signed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Carne(Base):
    __tablename__ = "carnets"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"))
    charge_type = Column(String(50), default="mensalidade")
    description = Column(String(300))
    total_installments = Column(Integer, nullable=False)
    installment_value = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), default=0)
    late_fee_pct = Column(Numeric(10, 2), default=2.0)
    interest_daily_pct = Column(Numeric(10, 2), default=0.033)
    first_due_date = Column(Date, nullable=False)
    interval = Column(String(20), default="monthly")
    payment_methods = Column(String(300))
    status = Column(String(20), default="active")
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("Student")
    installment_list = relationship("Installment", back_populates="carnet", cascade="all, delete-orphan")


class Installment(Base):
    __tablename__ = "installments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    carnet_id = Column(Integer, ForeignKey("carnets.id"))
    plan_id = Column(Integer, ForeignKey("financial_plans.id"))
    contract_id = Column(Integer, ForeignKey("financial_contracts.id"))
    installment_number = Column(Integer)
    description = Column(String(300), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), default=0)
    late_fee = Column(Numeric(10, 2), default=0)
    interest = Column(Numeric(10, 2), default=0)
    total_paid = Column(Numeric(10, 2), default=0)
    due_date = Column(Date, nullable=False)
    paid_date = Column(Date)
    status = Column(String(20), default="pending")
    payment_method = Column(String(50))
    invoice_url = Column(String(500))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    carnet = relationship("Carne", back_populates="installment_list")

    __table_args__ = (
        Index('ix_installments_student_due', 'student_id', 'due_date'),
        Index('ix_installments_status_due', 'status', 'due_date'),
    )


class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    name = Column(String(200), nullable=False)
    percentage = Column(Numeric(10, 2), default=0)
    amount = Column(Numeric(10, 2), default=0)
    reason = Column(Text)
    valid_until = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    installment_id = Column(Integer, ForeignKey("installments.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    payment_method = Column(String(50))
    receipt_number = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    installment = relationship("Installment")

    __table_args__ = (
        Index('ix_payments_installment', 'installment_id'),
    )
