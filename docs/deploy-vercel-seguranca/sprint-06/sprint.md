# Sprint 06 — Financeiro, Agenda, Comunicação, Relatórios, Pesquisa, Configurações

## Objetivo

Migrar os módulos de negócio restantes: financeiro (planos, contratos, parcelas, pagamentos, recibos,
carnês PDF, descontos, dashboard, geração de mensalidades), agenda, comunicação (email via Resend;
WhatsApp desativado D-11), relatórios (dashboard + export PDF/Excel), pesquisa global e configurações.

## Fases

| Fase | Descrição |
|---|---|
| F01 | Financeiro base (financial_plans, contracts, installments, payments) |
| F02 | Recibos + carnes (PDF) + descontos |
| F03 | Dashboard financeiro + geração de mensalidades (generate-month) |
| F04 | Agenda (events) |
| F05 | Comunicação (email Resend; whatsapp fora de escopo) |
| F06 | Relatórios (export PDF/Excel) + pesquisa global |
| F07 | Configurações (settings, logo, cores) |

## Critério de saída

- [ ] CRUD financeiro completo com cálculo de parcelas e status de pagamento.
- [ ] Recibo e carnê PDF gerados.
- [ ] Dashboard financeiro com métricas (receita, inadimplência).
- [ ] Geração de mensalidades em batch (`generate-month`).
- [ ] Agenda com CRUD de eventos.
- [ ] Comunicação email via Resend; WhatsApp sem chamadas (D-11).
- [ ] Relatórios exportáveis PDF/Excel e pesquisa global.
- [ ] Configurações (settings) lidas/gravadas com logo.

## Riscos conhecidos

- Geração de carnê com muitas parcelas (PDF de várias páginas) pode consumir memória — paginar via pdf-lib.
- Relatórios financeiros grandes (muitas linhas) — usar SheetJS streaming.

## Dependências de decisões

- D-08/D-09 (Resend), D-11 (WhatsApp off), D-12 (auditoria), D-04 (storage/logo)