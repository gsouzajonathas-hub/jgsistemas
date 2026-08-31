# Auditoria — deploy-vercel-seguranca

Data: 2026-08-31 (reauditoria após retorno à F3).

> Reauditoria: os achados da primeira auditoria (VEREDITO: NÃO) foram endereçados na regeneração do plano em F3. Confirmações abaixo.

## Achados

| severidade | arquivo | problema | correção sugerida |
|---|---|---|---|
| ALTA | sprint-02/tasks.md (T-02.05, T-02.06) | O plano afirmava que funções SQL `increment_rate_limit`/`check_lockout` "já definidas no `init.sql`" — mas nenhuma função SQL existe no `init.sql` e lockout/rate-limit eram **em memória** no FastAPI. | **RESOLVIDO**: T-02.05 agora cria migração `20260830000115_rate_limit_lockout.sql` (tabelas `auth_rate_limit` + `auth_lockout` + funções) e T-02.06 consolida `check_lockout`/expiração nessa migração; fases.md e sprint.md atualizados para refletir criação nova. |
| MÉDIA | sprint-03/tasks.md (T-03.03) | Referenciava tabela `password_reset_tokens` inexistente; schema usa `reset_token_hash`/`reset_token_expires` em `users`. | **RESOLVIDO**: T-03.03 agora persiste `reset_token_hash`/`reset_token_expires` na tabela `users` (colunas já no schema). |
| BAIXA | sprint-01/tasks.md (T-01.02) | Critério de aceite fixo em 23 tabelas; o schema real tem 25. | **RESOLVIDO**: T-01.02 e sprint-01/sprint.md atualizados para 25 tabelas (verificado: `Select-String` = 25 `create table if not exists public.*`). |
| BAIXA | sprint-04/tasks.md (T-04.02) | Buckets Storage assumidos sem declarar criação. | **RESOLVIDO**: T-04.02 agora usa bootstrap idempotente de buckets via service_role no boot da Edge Function e valida no stack local. |

## Veredito

VEREDITO: SIM — o plano está pronto para execução autônoma.
