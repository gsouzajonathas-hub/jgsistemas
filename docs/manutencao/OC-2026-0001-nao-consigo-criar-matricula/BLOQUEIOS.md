---
expx_schema: 1
expx_tool: runx
kind: bloqueios
trabalho_id: OC-2026-0001
atualizado_em: 2026-09-04
bloqueios:
  - id: B-01
    task: E4-QA
    aberto_em: 2026-09-04
    resolvido_em: null
    descricao: Dados de teste em produção (curso 2, professor 2, turma 1, matrícula 16) não podem ser removidos via API — DELETE de classe retorna 500 (FK de enrollments), DELETE de professor/curso retorna 400 (FK de class_groups), não existe endpoint de DELETE de matrícula e não há credenciais de banco (Supabase)
  - id: B-02
    task: E5-deploy
    aberto_em: 2026-09-04
    resolvido_em: 2026-09-05
    descricao: Deploy do Render em update_failed desde o commit eb9299a; RESEND_FROM/RESEND_API_KEY persistidas via API mas não ativadas até haver um deploy bem-sucedido. RESOLVIDO na OC-2026-0003 (redeploy dep-dae1cr8n74is73bvvsmg live) — confirmado nesta análise via GET https://jgsistemas-backend.onrender.com/api/health → 200
  - id: B-03
    task: E5-deploy
    aberto_em: 2026-09-04
    resolvido_em: 2026-09-05
    descricao: A integração git do Vercel (projeto jgsistemas) aponta para jonathasGodinho/jgsistemas, repositório que não existe mais (renomeado para gsouzajonathas-hub/jgsistemas, repoId 1353166786) — pushes na main não disparam deploy automático; o deploy atual foi feito manualmente via Vercel CLI (npx vercel deploy --prod); tentativa de relink via API manteve o org antigo (a credencial GitHub do Vercel não alcança a conta nova). RESOLVIDO na OC-2026-0004 (vercel.json movido para frontend/, deploy dpl_AQjWtNWmuR6S3NCvCZPv1434dzAQ) — confirmado nesta análise via GET https://jgsistemas.dev.br/login → 200
---

# Bloqueios

> Linha fixa: `B-NN | task | bloqueio | o que destravaria`. Qualquer arquivo que dependa de um
> bloqueio cita a linha e o relega ao fim da execução; bloqueio em aberto não para a ocorrência.

| id | task | bloqueio | o que destravaria |
|---|---|---|---|
| B-01 | E4-QA | Dados de teste em produção (curso 2, professor 2, turma 1, matrícula 16) não são removíveis via API (DELETE de classe → 500 por FK de enrollments; DELETE de professor/curso → 400 por FK de class_groups; sem endpoint de DELETE de matrícula) e não há credenciais de banco (Supabase) | Credenciais de banco (Supabase) ou endpoint administrativo de exclusão |
| B-02 | E5-deploy | Deploy do Render em `update_failed` desde o commit `eb9299a`; `RESEND_FROM`/`RESEND_API_KEY` persistidas mas não ativadas sem um deploy bem-sucedido | Deploy bem-sucedido (Manual Deploy no painel do Render ou retry pela API de deploys) |
| B-03 | E5-deploy | Integração git do Vercel aponta para `jonathasGodinho/jgsistemas` (inexistente; repo atual é `gsouzajonathas-hub/jgsistemas`, repoId 1353166786) — pushes não disparam deploy automático; deploy atual feito via Vercel CLI à mão | Reinstalar o GitHub App do Vercel na conta `gsouzajonathas-hub` (feito via browser pelo usuário) ou manter deploys manuais via CLI |