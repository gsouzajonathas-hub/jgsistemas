from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models.weight_config import GradeWeightConfig
from app.utils.auth import get_current_user, require_role

router = APIRouter()


class WeightItemSchema(BaseModel):
    label: str
    eval_type: str
    weight: float = 1.0
    max_score: float = 10.0


class WeightSaveSchema(BaseModel):
    class_group_id: int
    items: List[WeightItemSchema]


@router.get("")
async def list_weight_configs(class_group_id: Optional[int] = None,
                              current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    q = select(GradeWeightConfig)
    if class_group_id:
        q = q.where(GradeWeightConfig.class_group_id == class_group_id)
    q = q.order_by(GradeWeightConfig.class_group_id, GradeWeightConfig.id)
    result = await db.execute(q)
    configs = result.scalars().all()
    return [{"id": c.id, "class_group_id": c.class_group_id, "label": c.label,
             "eval_type": c.eval_type, "weight": c.weight, "max_score": c.max_score} for c in configs]


@router.put("")
async def save_weight_configs(data: WeightSaveSchema,
                              current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GradeWeightConfig).where(
        GradeWeightConfig.class_group_id == data.class_group_id))
    existing = {c.eval_type: c for c in result.scalars().all()}

    incoming = {i.eval_type: i for i in data.items}
    for eval_type, item in incoming.items():
        config = existing.get(eval_type)
        if config:
            config.label = item.label
            config.weight = item.weight
            config.max_score = item.max_score
        else:
            db.add(GradeWeightConfig(
                class_group_id=data.class_group_id,
                label=item.label,
                eval_type=item.eval_type,
                weight=item.weight,
                max_score=item.max_score
            ))

    for eval_type, config in existing.items():
        if eval_type not in incoming:
            await db.delete(config)

    await db.commit()
    return {"message": "Configuração de pesos salva com sucesso"}
