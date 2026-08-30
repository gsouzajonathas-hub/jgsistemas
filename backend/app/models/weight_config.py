from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base


class GradeWeightConfig(Base):
    __tablename__ = "grade_weight_configs"
    __table_args__ = (
        UniqueConstraint("class_group_id", "eval_type", name="uq_class_eval_type"),
    )

    id = Column(Integer, primary_key=True, index=True)
    class_group_id = Column(Integer, ForeignKey("class_groups.id"), nullable=False, index=True)
    label = Column(String(100), nullable=False)
    eval_type = Column(String(50), nullable=False)
    weight = Column(Float, default=1.0)
    max_score = Column(Float, default=10.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
