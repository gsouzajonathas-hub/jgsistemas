# Venda de materiais didáticos — cadastro, estoque e recibo PDF

## Contrato de entrada

- `MaterialSchema` (backend/app/routes/materials.py:14-19): `name` (obrigatório), `description=""`, `price: float = 0`, `stock: int = 0`, `category=""`.
- `MaterialSaleSchema` (materials.py:22-28): `material_id`, `student_id` (obrigatórios), `quantity: int = 1`, `unit_price: float = 0`, `payment_method=""`, `notes=""`.
- Rotas de escrita exigem role `admin|secretary`: create (materials.py:114), create_sale (L123), update (L151), delete (L163). Rotas de leitura exigem apenas autenticação: list (L33), list_sales (L52), dashboard (L97) e recibo (L183).
- Frontend: `materialsAPI.receipt(saleId)` **existe** em frontend/src/services/api.ts:157 e **não é chamado em nenhum lugar** (grep em frontend/src).

## Contrato de saída

- `list_materials` → array com `id/name/description/price/stock/category/is_active/created_at` (materials.py:42-47).
- `create_material` → `{"id", "message"}` (L119).
- `list_sales` → `{"sales": [...], "total"}` com `material_name`/`student_name` resolvidos (L84-93); paginação por `skip/limit`, default `limit=50` (L51, L58).
- `create_sale` → `{"id", "message"}`; unit price usado = informado ou `material.price` (L129); `total_price = unit_price * quantity` (L130); estoque decrementado com piso 0 (L143).
- `dashboard` → `total_materials/total_sales/total_revenue/low_stock` (low_stock quando `stock <= 5`, L96-110).
- `GET /sales/{sale_id}/receipt` → **PDF binário** via `Response` (L182-209), gerado por `build_material_receipt_pdf` (backend/app/services/material_receipt_service.py).

## Limites e cotas

- Paginação de vendas: `limit` default 50 no backend (materials.py:51); frontend chama com `limit: 100` (frontend/src/pages/Financial.tsx:348).
- `low_stock` quando `stock <= 5` (materials.py:102).
- Exclusão de material **bloqueada** quando há vendas vinculadas (materials.py:171-176).

## Erros conhecidos e tratamento

- 404: material/venda/aluno não encontrado (materials.py:126-127, 186-187, 193-195, 199-200).
- 403 para roles fora de `admin|secretary` nas rotas de escrita (`require_role`, backend/app/utils/auth.py:87-92).
- 400 ao excluir material com vendas vinculadas (materials.py:173-176).

## Riscos para a nossa implementação

- R1: falta ponto de entrada na UI — a tabela `SalesTab` tem 7 colunas (Aluno, Material, Qtd, Unitário, Total, Pagamento, Data) sem coluna de ações (frontend/src/pages/Financial.tsx:361-385).
- R2: padrão de download existente para recibo de mensalidade (Blob + `a.download = "recibo-{...}.pdf"` em frontend/src/pages/Financial.tsx:69-84) — deve ser reaproveitado para o recibo de material.
- R3: endpoint de recibo protegido apenas por autenticação (materials.py:183), mais permissivo que as rotas de escrita (admin|secretary) — decisão a validar na F2.
- R4: sem testes existentes para vendas/recibo (LACUNA L4).

## Fonte

backend/app/routes/materials.py; backend/app/services/material_receipt_service.py; frontend/src/pages/Financial.tsx; frontend/src/services/api.ts:157; frontend/src/types/index.ts (interface `MaterialSale` em types/index.ts:117) — acessado em 2026-09-04.