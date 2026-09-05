# Fases — Sprint 05

> Um bloco por fase. Repita o bloco quantas vezes forem necessárias. O paralelismo declarado aqui é definitivo: a execução nunca decide paralelismo sozinha.

---

## F-05.1 — Build e suítes completas

**Objetivo:** executar as suítes backend (pytest) e frontend (vitest) na íntegra e o build de produção do frontend, confirmando que as sprints 02-04 não quebraram nada.

**Tasks que a compõem:** T-05.01

**Critério de saída:** pytest com 0 failed, vitest com 0 failed e build frontend com exit 0, registrados no relatório.

**Roda em paralelo com:** nenhuma

---

## F-05.2 — Deploy frontend (Vercel CLI)

**Objetivo:** publicar o frontend na Vercel via CLI manual (B-02), com o token registrado em variável de ambiente, e confirmar a URL do deploy.

**Tasks que a compõem:** T-05.02

**Critério de saída:** `npx vercel --prod --token <token>` conclui com sucesso e o health check da URL publicada responde 200.

**Roda em paralelo com:** nenhuma

---

## F-05.3 — Redeploy backend (Render) + env vars de suporte

**Objetivo:** garantir que o backend do Render receba o novo código (numeroação REC, seed do super admin, actor_role), tenha as env vars SUPPORT_ADMIN_EMAIL/SUPPORT_ADMIN_PASSWORD definidas (valor nunca escrito pelo agente) e a migração aditiva rode no Postgres.

**Tasks que a compõem:** T-05.03

**Critério de saída:** `/api/health` do Render retorna 200; em produção existe a coluna actor_role e a conta de suporte é criável no boot com as env vars configuradas.

**Roda em paralelo com:** nenhuma

---

## F-05.4 — QA funcional E4 em produção

**Objetivo:** validar os três itens no ambiente real: chave PIX salva e persistente no modal, recibo PDF baixando com nome REC-{ano}-{contagem}, e login/auditoria da conta super admin (inclusive coluna de destaque).

**Tasks que a compõem:** T-05.04

**Critério de saída:** os três fluxos passam em produção; qualquer falha vira pendência registrada com evidência (nunca "confiado" sem testar).

**Roda em paralelo com:** nenhuma