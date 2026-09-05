# Sprint 03 — Botão Recibo na venda de material didático

## Objetivo

Entregar o Bug #3: o usuário consegue baixar o PDF do recibo de cada venda de material didático — botão "Recibo" na listagem de vendas (padrão do Financeiro, D-05) e recibo com número sequencial no formato do sistema `REC-{ano}-{contagem:05d}` (confirmação P-F3-01, atualização da D-10), igual aos recibos de pagamento.

## Fases

| Fase | Título | Roda em paralelo com |
|---|---|---|
| F-03.1 | Backend: numeração REC-{ano}-{contagem} no recibo de material | F-03.2 |
| F-03.2 | Frontend: botão Recibo na listagem de vendas de material | F-03.1 |

Detalhe de cada fase em `fases.md`; tasks em `tasks.md`.

## Critério de saída

`GET /api/materials/sales/{sale_id}/receipt` devolve PDF com `Content-Disposition` `recibo-REC-{ano}-{contagem}.pdf`; na tela de vendas de material existe um botão "Recibo" por venda que baixa o arquivo; suites rodam com 0 failed.

## Riscos conhecidos

- A lista de vendas de material fica em `frontend/src/pages/Financial.tsx` (SalesTab); o padrão de download é o `downloadReceipt` já existente (L69-84) — reaproveitar, não duplicar.
- A numeração atual (`MAT-{sale.id:06d}`) será substituída — o recibo de material e o de pagamento passam a compartilhar o mesmo formato; conferir que a contagem anual usa o mesmo critério do Financeiro (financial.py:577-580: contagem de pagamentos no ano-meta).