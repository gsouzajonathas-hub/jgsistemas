from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.database import get_db
from app.models.materials import TeachingMaterial, MaterialSale
from app.utils.auth import get_current_user, require_role

router = APIRouter()


class MaterialSchema(BaseModel):
    name: str
    description: str = ""
    price: float = 0
    stock: int = 0
    category: str = ""


class MaterialSaleSchema(BaseModel):
    material_id: int
    student_id: int
    quantity: int = 1
    unit_price: float = 0
    payment_method: str = ""
    notes: str = ""


@router.get("")
async def list_materials(search: str = "", category: str = "",
                         current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    q = select(TeachingMaterial)
    if search:
        q = q.where(TeachingMaterial.name.ilike(f"%{search}%"))
    if category:
        q = q.where(TeachingMaterial.category == category)
    q = q.order_by(TeachingMaterial.name)
    result = await db.execute(q)
    materials = result.scalars().all()
    return [{
        "id": m.id, "name": m.name, "description": m.description or "",
        "price": m.price, "stock": m.stock, "category": m.category or "",
        "is_active": m.is_active,
        "created_at": m.created_at.isoformat() if m.created_at else None
    } for m in materials]


@router.get("/sales")
async def list_sales(student_id: int = None, material_id: int = None, skip: int = 0, limit: int = 50,
                     current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    q = select(MaterialSale)
    if student_id:
        q = q.where(MaterialSale.student_id == student_id)
    if material_id:
        q = q.where(MaterialSale.material_id == material_id)
    q = q.order_by(MaterialSale.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    sales = result.scalars().all()

    count_q = select(MaterialSale)
    if student_id:
        count_q = count_q.where(MaterialSale.student_id == student_id)
    if material_id:
        count_q = count_q.where(MaterialSale.material_id == material_id)
    count_result = await db.execute(select(func.count()).select_from(count_q.subquery()))
    total = count_result.scalar()

    material_ids = list({s.material_id for s in sales})
    student_ids = list({s.student_id for s in sales})
    mat_names, std_names = {}, {}
    if material_ids:
        from app.models.materials import TeachingMaterial as TM
        r = await db.execute(select(TM).where(TM.id.in_(material_ids)))
        mat_names = {m.id: m.name for m in r.scalars().all()}
    if student_ids:
        from app.models.student import Student
        r = await db.execute(select(Student).where(Student.id.in_(student_ids)))
        std_names = {s.id: s.full_name for s in r.scalars().all()}

    sale_list = []
    for s in sales:
        sale_list.append({
            "id": s.id, "material_id": s.material_id, "student_id": s.student_id,
            "material_name": mat_names.get(s.material_id, ""),
            "student_name": std_names.get(s.student_id, ""),
            "quantity": s.quantity, "unit_price": s.unit_price, "total_price": s.total_price,
            "payment_method": s.payment_method or "", "notes": s.notes or "",
            "created_at": s.created_at.isoformat() if s.created_at else None
        })

    return {"sales": sale_list, "total": total}


@router.get("/dashboard")
async def materials_dashboard(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    total_materials = await db.execute(select(func.count()).select_from(TeachingMaterial))
    total_sales = await db.execute(select(func.count()).select_from(MaterialSale))
    total_revenue = await db.execute(select(func.sum(MaterialSale.total_price)))
    low_stock = await db.execute(
        select(func.count()).select_from(TeachingMaterial).where(TeachingMaterial.stock <= 5, TeachingMaterial.is_active == 1)
    )

    return {
        "total_materials": total_materials.scalar() or 0,
        "total_sales": total_sales.scalar() or 0,
        "total_revenue": total_revenue.scalar() or 0,
        "low_stock": low_stock.scalar() or 0
    }


@router.post("")
async def create_material(data: MaterialSchema, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    material = TeachingMaterial(**data.model_dump())
    db.add(material)
    await db.commit()
    await db.refresh(material)
    return {"id": material.id, "message": "Material cadastrado com sucesso"}


@router.post("/sales")
async def create_sale(data: MaterialSaleSchema, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TeachingMaterial).where(TeachingMaterial.id == data.material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")

    unit_price = data.unit_price if data.unit_price > 0 else material.price
    total_price = unit_price * data.quantity

    sale = MaterialSale(
        material_id=data.material_id,
        student_id=data.student_id,
        quantity=data.quantity,
        unit_price=unit_price,
        total_price=total_price,
        payment_method=data.payment_method,
        notes=data.notes
    )
    db.add(sale)

    material.stock = max(0, material.stock - data.quantity)

    await db.commit()
    await db.refresh(sale)
    return {"id": sale.id, "message": "Venda registrada com sucesso"}


@router.put("/{material_id}")
async def update_material(material_id: int, data: MaterialSchema, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TeachingMaterial).where(TeachingMaterial.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    for k, v in data.model_dump().items():
        setattr(material, k, v)
    await db.commit()
    return {"message": "Material atualizado com sucesso"}


@router.delete("/{material_id}")
async def delete_material(material_id: int, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TeachingMaterial).where(TeachingMaterial.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    sales_r = await db.execute(
        select(func.count()).select_from(MaterialSale).where(MaterialSale.material_id == material_id)
    )
    sales_count = sales_r.scalar() or 0
    if sales_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Material possui {sales_count} venda(s) vinculada(s). Exclua as vendas ou desative o material."
        )
    await db.delete(material)
    await db.commit()
    return {"message": "Material excluído com sucesso"}


@router.get("/sales/{sale_id}/receipt")
async def material_receipt(sale_id: int, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MaterialSale).where(MaterialSale.id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Venda não encontrada")

    from app.models.student import Student
    from app.models.settings import SchoolSettings

    material_r = await db.execute(select(TeachingMaterial).where(TeachingMaterial.id == sale.material_id))
    material = material_r.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")

    student_r = await db.execute(select(Student).where(Student.id == sale.student_id))
    student = student_r.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    settings_r = await db.execute(select(SchoolSettings).limit(1))
    settings = settings_r.scalar_one_or_none()

    # Numeração REC-{ano}-{contagem:05d} — critério do Financeiro (financial.py:577-580):
    # contar as vendas de material do ano da venda e montar o número sequencial.
    venda_ano = sale.created_at.year if sale.created_at else date.today().year
    count = (await db.execute(
        select(func.count()).select_from(MaterialSale).where(
            MaterialSale.created_at >= date(venda_ano, 1, 1)
        )
    )).scalar() or 0
    receipt_number = f"REC-{venda_ano}-{count:05d}"

    from app.services.material_receipt_service import build_material_receipt_pdf
    pdf_bytes = build_material_receipt_pdf(sale, material, student, settings, receipt_number)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="recibo-{receipt_number}.pdf"'
        }
    )
