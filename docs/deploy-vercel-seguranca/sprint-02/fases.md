# Sprint 02 — Fases

## F01 — Config/secrets + error/response helpers

- **Objetivo**: Centralizar leitura de variáveis (Deno.env) e helpers de resposta JSON padronizados que replicam o shape do FastAPI (erro 400 com campo `detail`).
- **Tasks**: T-02.01, T-02.02
- **Critério de saída**: toda edge function pode importar `getConfig()` e `errorResponse(c, msg, status)`.
- **Roda em paralelo com**: nenhuma (fundação da sprint).

## F02 — JWT middleware + bcryptjs verify

- **Objetivo**: Implementar middleware `requireAuth()` que valida JWT HS256 (D-06) e wrapper `requireRole(...)` por níveis (public/admin/secretary). Portar `verifyPassword` usando bcryptjs (substituindo passlib).
- **Tasks**: T-02.03, T-02.04
- **Critério de saída**: teste que valida token bom/expirado/inválido e teste que compara senha via bcryptjs.
- **Roda em paralelo com**: F03 (arquivos distintos).

## F03 — Rate-limit + lockout em Postgres

- **Objetivo**: Portar `rate_limit` e `account_lockout` de in-memory Python para tabelas Postgres criadas por migração dedicada (`20260830000115_rate_limit_lockout.sql`, pois NÃO existem em `init.sql` — eram estado em memória no FastAPI), com funções SQL `increment_rate_limit` e `check_lockout` nesta mesma migração.
- **Tasks**: T-02.05, T-02.06
- **Critério de saída**: login com 5 tentativas falhas bloqueia por 30 minutos verificável via Postgres.
- **Roda em paralelo com**: F02.