# Sprint 02 — Tasks

Caminhos relativos à raiz do repositório. Status inicial de toda task: `pendente`.

---

## T-02.01 | Config/secrets loading centralizado

- **objetivo**: Criar módulo `getConfig()` que lê variáveis de ambiente (Deno.env) e lança erro claro se obrigatória.
- **cria**: `supabase/functions/app/_shared/config.ts` (já criado em T-01.03; expandir)
- **altera**: `supabase/functions/app/_shared/config.ts`
- **teste_integracao**: teste importa `getConfig()` com env mockada e retorna objeto com `secretKey`, `anonKey`, `dbUrl`.
- **teste_funcional**: com env faltando, `getConfig()` lança erro com mensagem contendo o nome da variável ausente.
- **criterio_aceite**: `getConfig()` retorna todas as variáveis obrigatórias ou lança erro descritivo.
- **depende_de**: T-01.03
- **paralelizavel**: true
- **status**: pendente

---

## T-02.02 | Error/response helpers padronizados

- **objetivo**: Criar helpers de resposta JSON que replicam o shape do FastAPI (`{ detail: "..." }` para erros, `{ data: ... }` para sucesso) para que o frontend (axios) não quebre.
- **cria**: `supabase/functions/app/_shared/response.ts` (expandir de `utils/response.ts` em T-01.03)
- **altera**: `supabase/functions/app/_shared/response.ts`
- **teste_integracao**: `errorResponse(c, "Not found", 404)` retorna JSON com status 404 e body `{ "detail": "Not found" }`.
- **teste_funcional**: `successResponse(c, { id: 1 }, 200)` retorna JSON com status 200 e body `{ "id": 1 }`.
- **criterio_aceite**: helpers retornam JSON com CORS e status code corretos.
- **depende_de**: T-01.03
- **paralelizavel**: true
- **status**: pendente

---

## T-02.03 | Middleware JWT HS256 (`requireAuth`)

- **objetivo**: Implementar middleware que valida token HS256 via `crypto.subtle` (WebCrypto Deno) com `SECRET_KEY` de env, replicando `auth.py` do Python (D-06).
- **cria**: `supabase/functions/app/_shared/middleware.ts`, `supabase/tests/middleware_test.ts`
- **altera**: —
- **teste_integracao**: teste gera JWT válido com `crypto.subtle` e `requireAuth` o decodifica sem erro; token expirado retorna 401; token inválido retorna 401.
- **teste_funcional**: `requireAuth` em rota protegida com token bom retorna 200; sem token retorna 401.
- **criterio_aceite**: middleware retorna 401 para token ausente/expirado/inválido e passa payload `sub` para handler.
- **depende_de**: T-02.01
- **paralelizavel**: false
- **status**: pendente

---

## T-02.04 | verifyPassword com bcryptjs

- **objetivo**: Portar `verify_password` de Python (passlib[bcrypt] 5.0.0) para bcryptjs (Deno), compatível com hash gerado pelo seed admin.
- **cria**: `supabase/functions/app/_shared/auth.ts`, `supabase/tests/auth_test.ts`
- **altera**: —
- **teste_integracao**: `verifyPassword("SenhaForte#2026!", "$2b$12$...")` retorna `true` para hash do seed e `false` para senha errada.
- **teste_funcional**: importação de `verifyPassword` funciona sem erros de módulo.
- **criterio_aceite**: `verifyPassword` aceita hash bcrypt válido ($2b$) e rejeita hash inválido.
- **depende_de**: T-02.01
- **paralelizavel**: false
- **status**: pendente

---

## T-02.05 | Migração SQL de rate-limit + lockout (tabela + funções)

- **objetivo**: Criar migração dedicada (rate-limit/lockout são **em memória** no FastAPI — `security.py` `defaultdict`/`_login_attempts` —, logo NÃO existem em `init.sql`). Persistir em Postgres para suportar multi-instância Edge Function: tabela `auth_rate_limit` (ip, email, window_start, count) e `auth_lockout` (email, failed_attempts, locked_until) + funções `increment_rate_limit`, `check_lockout`.
- **cria**: `supabase/migrations/20260830000115_rate_limit_lockout.sql`, `supabase/functions/app/_shared/ratelimit.ts`, `supabase/tests/ratelimit_test.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts` (registrar no handler global se aplicável)
- **teste_integracao**: teste chama `increment_rate_limit('test@x','127.0.0.1')` 5x; 6ª chamada `check_lockout` retorna `locked: true`.
- **teste_funcional**: `check_lockout` com `locked_until` no futuro retorna `true` e com `locked_until` no passado retorna `false`.
- **criterio_aceite**: `check_lockout` retorna `locked=true` após 5 falhas e `false` após expiração do lockout.
- **depende_de**: T-01.02, T-02.01
- **paralelizavel**: true
- **status**: pendente

---

## T-02.06 | Função SQL check_lockout + expiração de 30min (consolida migração)

- **objetivo**: Na mesma migração de T-02.05, implementar `check_lockout(email)` que retorna `false` quando `locked_until` passou de 30min, e `true` caso contrário (une a lógica da T-02.05 — ver a migração única).
- **cria**: (na migração de T-02.05)
- **altera**: —
- **teste_integracao**: insere `auth_lockout` com `locked_until` 29 min no passado; `check_lockout` retorna `true` (ainda bloqueado).
- **teste_funcional**: insere `auth_lockout` com `locked_until` 31 min no passado; `check_lockout` retorna `false` (bloqueio expirado).
- **criterio_aceite**: `check_lockout` distingue lockout ativo vs expirado (30min).
- **depende_de**: T-02.05
- **paralelizavel**: false
- **status**: pendente

---

> **Total: 6 tasks.** Nenhuma task depende de decisão humana em execução.