# Sprint 06 — Fases

## F01 — Financeiro base

- **objetivo**: Migrar `financial_plans`, `contracts`, `installments`, `payments` com cálculo de parcelas e status.
- **Tasks**: T-06.01, T-06.02
- **Critério de saída**: CRUD financeiro com validação de valores e geração de parcelas.
- **Roda em paralelo com**: F04 (agenda), F05 (comunicação).

## F02 — Recibos + carnes (PDF) + descontos

- **objetivo**: Migrar `receipt_service.py` (recibo PDF) e `carne_service.py` (carnê PDF multilinha) + `discounts`.
- **Tasks**: T-06.03, T-06.04, T-06.05
- **Critério de saída**: recibo PDF e carnê PDF exportáveis; desconto aplicado na parcela.
- **Roda em paralelo com**: F03 (financeiro dashboard) — ambos sobre T-06.01.

## F03 — Dashboard financeiro + generate-month

- **objetivo**: Migrar `GET /api/dashboard` (receita, inadimplência, gráficos) e `POST /api/financial/generate-month` (geração de mensalidades em batch).
- **Tasks**: T-06.06, T-06.07
- **Critério de saída**: dashboard retorna métricas; generate-month cria parcelas do mês.
- **Roda em paralelo com**: F02.

## F04 — Agenda (events)

- **objetivo**: Migrar CRUD de eventos da agenda.
- **Tasks**: T-06.08
- **Critério de saída**: eventos com data/hora e recorrência opcional.
- **Roda em paralelo com**: F01, F05.

## F05 — Comunicação (email Resend; whatsapp off)

- **objetivo**: Migrar `email_service.py` consolidado para Resend; garantir que nenhuma chamada a Z-API seja invocada (D-11).
- **Tasks**: T-06.09
- **Critério de saída**: envio de email via Resend (usando `RESEND_API_KEY`); módulo whatsapp sem endpoints ativos.
- **Roda em paralelo com**: F01, F04.

## F06 — Relatórios (PDF/Excel) + pesquisa global

- **objetivo**: Migrar exportações gerais de relatório (alunos/financeiro/frequência) para PDF/Excel e a busca global multi-entidade.
- **Tasks**: T-06.10, T-06.11
- **Critério de saída**: relatório exportável e pesquisa retornando alunos/turmas/professores.
- **Roda em paralelo com**: F07.

## F07 — Configurações (settings, logo, cores)

- **objetivo**: Migrar `settings.py` — logo, cores institucionais e preferências; usar bucket público para logo (T-04.06).
- **Tasks**: T-06.12
- **Critério de saída**: settings CRUD com logo pública.
- **Roda em paralelo com**: F06.