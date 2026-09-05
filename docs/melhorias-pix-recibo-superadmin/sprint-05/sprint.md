# Sprint 05 — Integração, deploy manual e QA funcional

## Objetivo

Integrar as três entregas: build, suítes completas, deploy manual via Vercel CLI (B-02), redeploy do backend no Render (B-03) com as novas env vars da conta de suporte, e QA funcional em produção — que passa a ser viável mesmo sem a senha do admin (B-01) porque a conta super admin permite acesso total.

## Fases

| Fase | Título | Roda em paralelo com |
|---|---|---|
| F-05.1 | Build e suítes completas | nenhuma |
| F-05.2 | Deploy frontend (Vercel CLI) | nenhuma |
| F-05.3 | Redeploy backend (Render) + env vars de suporte | nenhuma |
| F-05.4 | QA funcional E4 em produção | nenhuma |

Detalhe de cada fase em `fases.md`; tasks em `tasks.md`.

## Critério de saída

Build frontend exit 0; pytest e vitest com 0 failed; deploy do frontend publicado na Vercel (URL do deploy confirmada); backend do Render com `GET /api/health` 200 e migração de `actor_role` aplicada; QA funcional dos três itens validado em produção (ou pendência registrada com motivo concreto).

## Riscos conhecidos

- B-01 (senha do admin desconhecida) deixa de bloquear o QA: a conta super admin via env permite o teste de PIX, recibo e auditoria. Se o usuário não configurar ainda as env vars no Render, o QA do PIX/recibo fica na dependência disso — registrar pendência em vez de inventar acesso.
- B-02: deploy SOMENTE via Vercel CLI manual (integração git quebrada); nunca confiar em auto-deploy do git.
- B-03: o redeploy do backend é manual no painel do Render — verificar que a migração aditiva roda no Postgres (`ADD COLUMN IF NOT EXISTS`).