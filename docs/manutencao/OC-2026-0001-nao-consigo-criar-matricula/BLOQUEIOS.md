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
    resolvido_em: null
    descricao: Deploy do Render em update_failed desde o commit eb9299a; RESEND_FROM/RESEND_API_KEY persistidas via API mas não ativadas até haver um deploy bem-sucedido
---

# Bloqueios

> Linha fixa: `B-NN | task | bloqueio | o que destravaria`. Qualquer arquivo que dependa de um
> bloqueio cita a linha e o relega ao fim da execução; bloqueio em aberto não para a ocorrência.

| id | task | bloqueio | o que destravaria |
|---|---|---|---|
| B-01 | E4-QA | Dados de teste em produção (curso 2, professor 2, turma 1, matrícula 16) não são removíveis via API (DELETE de classe → 500 por FK de enrollments; DELETE de professor/curso → 400 por FK de class_groups; sem endpoint de DELETE de matrícula) e não há credenciais de banco (Supabase) | Credenciais de banco (Supabase) ou endpoint administrativo de exclusão |
| B-02 | E5-deploy | Deploy do Render em `update_failed` desde o commit `eb9299a`; `RESEND_FROM`/`RESEND_API_KEY` persistidas mas não ativadas sem um deploy bem-sucedido | Deploy bem-sucedido (Manual Deploy no painel do Render ou retry pela API de deploys) |