# Fases — Sprint 04

> Um bloco por fase. Repita o bloco quantas vezes forem necessárias. O paralelismo declarado aqui é definitivo: a execução nunca decide paralelismo sozinha.

---

## F-04.1 — Backend: seed no startup + role super_admin com acesso total

**Objetivo:** criar no lifespan (`main.py`) um upsert idempotente do usuário de suporte a partir das env vars, aceitar `super_admin` em qualquer `require_role` (acesso total) e impedir que a API crie/rebaixe a role fora do seed.

**Tasks que a compõem:** T-04.01, T-04.02

**Critério de saída:** testes pytest provam que o seed cria a conta no primeiro boot, é idempotente no segundo, o login funciona, `require_role("admin")` aceita `super_admin` e `PUT /users/{id}` não rebaixa a conta de suporte.

**Roda em paralelo com:** F-04.3

---

## F-04.2 — Backend: auditoria destacada (campo actor_role)

**Objetivo:** adicionar o campo `actor_role` ao `AuditLog` (model + migração aditiva SQLite/Postgres), preencher no `log_audit` com a role do usuário autor e expor no retorno de `GET /api/audit` para a tela destacar.

**Tasks que a compõem:** T-04.03, T-04.04

**Critério de saída:** testes pytest provam que a trilha guarda `actor_role=super_admin` para ações da conta de suporte e que `GET /api/audit` devolve o campo.

**Roda em paralelo com:** F-04.3

---

## F-04.3 — Frontend: permissão, labels e badge de auditoria

**Objetivo:** fazer o frontend reconhecer a role `super_admin` (hasPermission total, labels, select de roles sem a opção) e exibir destaque na tela de Auditoria quando `actor_role` for `super_admin`.

**Tasks que a compõem:** T-04.05, T-04.06

**Critério de saída:** testes vitest provam que `hasPermission` retorna true para super_admin em qualquer permissão, o label correto aparece e a tela de Auditoria mostra o badge para ações de super admin.

**Roda em paralelo com:** F-04.1, F-04.2