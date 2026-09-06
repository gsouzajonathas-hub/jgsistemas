from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models.evaluation import Evaluation
from app.utils.permissions import require_permission
from app.utils.security import client_ip
from app.utils.audit import log_audit

router = APIRouter()


class EvalSchema(BaseModel):
    student_id: int
    class_group_id: int
    eval_type: str
    title: str
    date: str
    score: float = 0
    max_score: float = 10
    weight: float = 1.0
    notes: str = ""


class EvalScoreItem(BaseModel):
    student_id: int
    score: float = 0


class EvalBulkSchema(BaseModel):
    class_group_id: int
    eval_type: str
    title: str
    date: Optional[str] = None
    max_score: float = 10
    weight: float = 1.0
    notes: str = ""
    scores: List[EvalScoreItem]


@router.get("")
async def list_evaluations(student_id: int = None, class_group_id: int = None,
                           current_user=Depends(require_permission("evaluations")), db: AsyncSession = Depends(get_db)):
    q = select(Evaluation)
    if student_id:
        q = q.where(Evaluation.student_id == student_id)
    if class_group_id:
        q = q.where(Evaluation.class_group_id == class_group_id)
    q = q.order_by(Evaluation.date.desc())
    result = await db.execute(q)
    evals = result.scalars().all()

    from app.models.student import Student
    from app.models.class_group import ClassGroup
    student_ids = {e.student_id for e in evals}
    class_ids = {e.class_group_id for e in evals}
    students = {}
    classes = {}
    if student_ids:
        r = await db.execute(select(Student).where(Student.id.in_(student_ids)))
        students = {s.id: s.full_name for s in r.scalars().all()}
    if class_ids:
        r = await db.execute(select(ClassGroup).where(ClassGroup.id.in_(class_ids)))
        classes = {c.id: c.name for c in r.scalars().all()}

    return [{"id": e.id, "student_id": e.student_id, "class_group_id": e.class_group_id,
             "student_name": students.get(e.student_id, ""),
             "class_group_name": classes.get(e.class_group_id, ""),
             "eval_type": e.eval_type or "",
             "title": e.title, "date": e.date.isoformat() if e.date else None, "score": e.score,
             "max_score": e.max_score, "weight": e.weight, "notes": e.notes} for e in evals]


@router.post("")
async def create_evaluation(data: EvalSchema, request: Request, current_user=Depends(require_permission("evaluations")), db: AsyncSession = Depends(get_db)):
    from datetime import date
    d = data.model_dump()
    if d.get("date"):
        d["date"] = date.fromisoformat(d["date"])
    else:
        d["date"] = date.today()
    evaluation = Evaluation(**d)
    db.add(evaluation)
    await db.flush()
    await log_audit(db, current_user, "evaluation.create", "evaluation", evaluation.id,
                    details=f"student={evaluation.student_id} class_group={evaluation.class_group_id} type={evaluation.eval_type}",
                    ip_address=client_ip(request))
    await db.commit()
    return {"id": evaluation.id, "message": "Avaliação cadastrada com sucesso"}


@router.post("/bulk")
async def create_evaluations_bulk(data: EvalBulkSchema, request: Request, current_user=Depends(require_permission("evaluations")), db: AsyncSession = Depends(get_db)):
    from datetime import date
    eval_date = date.fromisoformat(data.date) if data.date else date.today()
    created = 0
    for item in data.scores:
        evaluation = Evaluation(
            student_id=item.student_id,
            class_group_id=data.class_group_id,
            eval_type=data.eval_type,
            title=data.title,
            date=eval_date,
            score=item.score,
            max_score=data.max_score,
            weight=data.weight,
            notes=data.notes
        )
        db.add(evaluation)
        created += 1
    await log_audit(db, current_user, "evaluation.bulk", "evaluation", data.class_group_id,
                    details=f"class_group={data.class_group_id} type={data.eval_type} created={created}",
                    ip_address=client_ip(request))
    await db.commit()
    return {"created": created, "message": f"{created} avaliação(ões) cadastrada(s) com sucesso"}


@router.put("/{eval_id}")
async def update_evaluation(eval_id: int, data: EvalSchema, request: Request, current_user=Depends(require_permission("evaluations")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Evaluation).where(Evaluation.id == eval_id))
    evaluation = result.scalar_one_or_none()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    d = data.model_dump()
    from datetime import date
    if d.get("date"):
        d["date"] = date.fromisoformat(d["date"])
    else:
        d["date"] = date.today()
    for k, v in d.items():
        setattr(evaluation, k, v)
    await log_audit(db, current_user, "evaluation.update", "evaluation", eval_id,
                    details=f"student={data.student_id} class_group={data.class_group_id} type={data.eval_type}",
                    ip_address=client_ip(request))
    await db.commit()
    return {"message": "Avaliação atualizada com sucesso"}


@router.delete("/{eval_id}")
async def delete_evaluation(eval_id: int, request: Request, current_user=Depends(require_permission("evaluations")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Evaluation).where(Evaluation.id == eval_id))
    evaluation = result.scalar_one_or_none()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    await log_audit(db, current_user, "evaluation.delete", "evaluation", eval_id,
                    details=f"student={evaluation.student_id} class_group={evaluation.class_group_id} title={evaluation.title}",
                    ip_address=client_ip(request))
    await db.delete(evaluation)
    await db.commit()
    return {"message": "Avaliação excluída com sucesso"}


@router.get("/average/{student_id}")
async def student_average(student_id: int, current_user=Depends(require_permission("evaluations")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Evaluation).where(Evaluation.student_id == student_id)
    )
    evals = result.scalars().all()
    if not evals:
        return {"average": 0, "status": "Sem avaliações"}

    total_weight = sum(e.weight for e in evals)
    if total_weight == 0:
        total_weight = 1
    weighted_avg = sum((e.score / e.max_score if e.max_score else 0) * e.weight for e in evals) / total_weight * 100
    avg = round(weighted_avg, 2)

    status = "Aprovado" if avg >= 70 else "Recuperação" if avg >= 50 else "Reprovado"
    return {"average": avg, "status": status, "total_evaluations": len(evals)}
