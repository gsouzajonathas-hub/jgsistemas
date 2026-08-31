# Sprint 06 — Tasks

Caminhos relativos à raiz do repositório. Status inicial de toda task: `pendente`.

---

## T-06.01 | Planos financeiros + contratos

- **objetivo**: Migrar CRUD de `financial_plans` (nome, valor, duração) e `contracts` (aluno + plano + datas).
- **cria**: `supabase/functions/app/src/routes/financial.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: POST `/api/financial/plans` retorna 201; POST `/api/financial/contracts` vincula aluno a plano.
- **teste_funcional**: GET `/api/financial/contracts/:id` retorna dados do contrato + parcelas.
- **criterio_aceite**: plano e contrato persistidos e consultáveis.
- **depende_de**: T-02.03, T-04.03, T-01.05
- **paralelizavel**: false
- **status**: pendente

---

## T-06.02 | Parcelas + pagamentos

- **objetivo**: Migrar cálculo de parcelas a partir do contrato e registro de pagamentos com status (pendente/pago/atrasado).
- **cria**: (no `financial.ts`)
- **altera**: `supabase/functions/app/src/routes/financial.ts`
- **teste_integracao**: criar contrato de 6 meses gera 6 parcelas com valores corretos.
- **teste_funcional**: POST pagamento marca parcela como `pago` e registra data.
- **criterio_aceite**: parcelas geradas e pagamento atualiza status.
- **depende_de**: T-06.01
- **paralelizavel**: true
- **status**: pendente

---

## T-06.03 | Recibo PDF

- **objetivo**: Migrar `receipt_service.py` — gera recibo de pagamento em PDF timbrado.
- **cria**: `supabase/functions/app/src/routes/receipts.ts`
- **altera**: `supabase/functions/app/src/routes/financial.ts`
- **teste_integracao**: GET `/api/financial/payments/:id/receipt` retorna 200 com `Content-Type: application/pdf`.
- **teste_funcional**: recibo PDF contém valor e nome do aluno.
- **criterio_aceite**: recibo PDF exportável com dados do pagamento.
- **depende_de**: T-05.01, T-06.02
- **paralelizavel**: false
- **status**: pendente

---

## T-06.04 | Carnê PDF (múltiplas parcelas)

- **objetivo**: Migrar `carne_service.py` — gera carnê multi-página com todas as parcelas do contrato.
- **cria**: `supabase/functions/app/src/routes/carnes.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: GET `/api/financial/contracts/:id/carne` retorna 200 PDF com N páginas (uma por parcela).
- **teste_funcional**: carnê PDF contém datas de vencimento de cada parcela.
- **criterio_aceite**: carnê PDF multi-página gerado.
- **depende_de**: T-05.01, T-06.02
- **paralelizavel**: false
- **status**: pendente

---

## T-06.05 | Descontos

- **objetivo**: Migrar cadastro/aplicação de descontos em parcelas ou planos.
- **cria**: (no `financial.ts`)
- **altera**: `supabase/functions/app/src/routes/financial.ts`
- **teste_integracao**: aplicar desconto de 10% em parcela `valor=100` resulta em `valor_descontado=90`.
- **teste_funcional**: GET parcela retorna `discount` e `valor_descontado`.
- **criterio_aceite**: desconto persistido e aplicado no cálculo.
- **depende_de**: T-06.02
- **paralelizavel**: true
- **status**: pendente

---

## T-06.06 | Dashboard financeiro

- **objetivo**: Migrar `GET /api/dashboard` — receita do mês, inadimplência, gráficos por período.
- **cria**: `supabase/functions/app/src/routes/dashboard.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: GET `/api/dashboard` com dados de seed retorna 200 com `total_receita` e `inadimplencia` numéricos.
- **teste_funcional**: dashboard reflete parcelas pagas vs atrasadas corretamente.
- **criterio_aceite**: dashboard retorna métricas financeiras calculadas.
- **depende_de**: T-06.02, T-02.03
- **paralelizavel**: false
- **status**: pendente

---

## T-06.07 | Generate-month (geração em batch)

- **objetivo**: Migrar `POST /api/financial/generate-month` — gera parcelas do mês corrente para contratos ativos.
- **cria**: (no `financial.ts`)
- **altera**: `supabase/functions/app/src/routes/financial.ts`
- **teste_integracao**: chamada com 2 contratos ativos cria 2 parcelas para o mês (idempotente).
- **teste_funcional**: segunda chamada no mesmo mês não duplica parcelas.
- **criterio_aceite**: geração batch idempotente por mês.
- **depende_de**: T-06.02
- **paralelizavel**: false
- **status**: pendente

---

## T-06.08 | Agenda (events)

- **objetivo**: Migrar CRUD de eventos da agenda com data/hora e recorrência.
- **cria**: `supabase/functions/app/src/routes/events.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: POST `/api/events` retorna 201.
- **teste_funcional**: GET `/api/events?from=...&to=...` lista eventos no intervalo.
- **criterio_aceite**: CRUD de eventos com filtro por intervalo.
- **depende_de**: T-02.03
- **paralelizavel**: true
- **status**: pendente

---

## T-06.09 | Comunicação email (Resend) + whatsapp fora de escopo

- **objetivo**: Migrar `email_service.py` consolidado para Resend (D-08/D-09); remover qualquer chamada ativa a Z-API (D-11).
- **cria**: `supabase/functions/app/_shared/email.ts` (expandir), `supabase/functions/app/src/routes/communication.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: `sendEmail({to,subject,html})` com `RESEND_API_KEY` mockada dispara chamada HTTP à API Resend retornando 200.
- **teste_funcional**: nenhuma rota `/api/whatsapp` registrada (D-11).
- **criterio_aceite**: envio via Resend implementado e whatsapp ausente.
- **depende_de**: T-03.03 (email base), T-02.01
- **paralelizavel**: true
- **status**: pendente

---

## T-06.10 | Relatórios gerais (PDF/Excel)

- **objetivo**: Migrar `GET /api/reports/students` e `/api/reports/financial` com export PDF/Excel.
- **cria**: `supabase/functions/app/src/routes/reports.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: GET `/api/reports/students?format=pdf` retorna PDF; `?format=xlsx` retorna XLSX.
- **teste_funcional**: relatório financeiro XLSX contém colunas de receita.
- **criterio_aceite**: relatórios exportáveis em ambos os formatos.
- **depende_de**: T-05.01, T-05.02, T-06.06
- **paralelizavel**: false
- **status**: pendente

---

## T-06.11 | Pesquisa global

- **objetivo**: Migrar `GET /api/search?q=...` — busca em alunos, turmas, professores e responsáveis.
- **cria**: `supabase/functions/app/src/routes/search.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: GET `/api/search?q=Joao` retorna 200 com alunos e professores correspondentes.
- **teste_funcional**: busca por termo inexistente retorna arrays vazios.
- **criterio_aceite**: pesquisa multi-entidade com agrupamento por tipo.
- **depende_de**: T-04.03, T-04.07, T-02.03
- **paralelizavel**: false
- **status**: pendente

---

## T-06.12 | Configurações (settings, logo, cores)

- **objetivo**: Migrar `settings.py` — leitura/escrita de preferências e logo pública.
- **cria**: `supabase/functions/app/src/routes/settings.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: GET `/api/settings` retorna 200 com configurações; PUT atualiza cor institucional.
- **teste_funcional**: alterar `logo_url` reflete a URL pública ao ler settings.
- **criterio_aceite**: CRUD de settings com persistência de logo.
- **depende_de**: T-04.06, T-02.03
- **paralelizavel**: true
- **status**: pendente

---

> **Total: 12 tasks.**