# Sprint 01 — Tasks

Caminhos relativos à raiz do repositório. Status inicial de toda task: `pendente`.

---

## T-01.01 | Verificar boot do stack Supabase local

- **objetivo**: Garantir que `supabase start` (Docker) sobe o stack completo sem erro e que o Postgres aplica a migração `20260830000100_init.sql`.
- **cria**: `supabase/README-local.md`
- **altera**: `supabase/config.toml` (se flag de verificação apontar ajuste; esperado: nada)
- **teste_integracao**: `supabase status` retorna exit 0 com `API URL`, `DB URL`, `anon key`, `service_role key` preenchidos.
- **teste_funcional**: script de smoke chama `GET <API_URL>/rest/v1/` autenticado com service_role e responde 200.
- **criterio_aceite**: `supabase status` exit 0 e toda imagem com status "running".
- **depende_de**: —
- **paralelizavel**: false
- **status**: pendente

---

## T-01.02 | Aplicar e validar a migração inicial do schema

- **objetivo**: Confirmar que `supabase/migrations/20260830000100_init.sql` (25 tabelas `public` — mirror dos modelos) aplica no Postgres local e o schema `public` está íntegro.
- **cria**: — (migração já committada)
- **altera**: `supabase/migrations/20260830000100_init.sql` (somente correção se falhar)
- **teste_integracao**: `supabase db reset` reaplica migrações sem erro e `supabase db dump | Select-String "CREATE TABLE"` lista as 25 tabelas esperadas.
- **teste_funcional**: `psql` (via docker exec) executa `SELECT count(*) FROM information_schema.tables WHERE table_schema='public';` e retorna 25.
- **criterio_aceite**: contagem de tabelas `public` == 25 após `db reset`.
- **depende_de**: T-01.01
- **paralelizavel**: false
- **status**: pendente

---

## T-01.03 | Criar esqueleto da Edge Function `app` com Hono + roteamento interno

- **objetivo**: Materializar D-13: uma única Edge Function `app` usando Hono; montar o router raiz em `/api/*` replicando a estrutura do FastAPI.
- **cria**: `supabase/functions/app/_shared/config.ts`, `supabase/functions/app/_shared/client.ts`, `supabase/functions/app/index.ts`, `supabase/functions/app/src/routes/index.ts`, `supabase/functions/app/src/middleware/cors.ts`, `supabase/functions/app/src/utils/response.ts`
- **altera**: — (novo)
- **teste_integracao**: `supabase functions serve app` sobe sem erro de import/compile (exit 0 no boot).
- **teste_funcional**: `curl -X OPTIONS http://localhost:54321/functions/v1/app/api/health` retorna headers CORS para origem `http://localhost:5173`.
- **criterio_aceite**: Edge Function compila e responde à preflight OPTIONS com CORS correto.
- **depende_de**: T-01.01, T-01.02
- **paralelizavel**: false
- **status**: pendente

---

## T-01.04 | Implementar `GET /api/health` de observabilidade mínima

- **objetivo**: Atender D-12 (observabilidade mínima) com `GET /api/health` reportando status do app e do banco.
- **cria**: `supabase/functions/app/src/routes/health.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts` (registrar rota)
- **teste_integracao**: teste Deno chama `app.request('/api/health')` e espera `status=200` e corpo com `status:"ok"`.
- **teste_funcional**: `curl http://localhost:54321/functions/v1/app/api/health` retorna `200 {"status":"ok","db":"up"}`.
- **criterio_aceite**: health retorna 200 com `status:"ok"` e `db:"up"`.
- **depende_de**: T-01.03
- **paralelizavel**: false
- **status**: pendente

---

## T-01.05 | Provisionar cliente supabase-js (service_role) e helpers de banco

- **objetivo**: Criar clientes reutilizáveis (`_shared/client.ts`) para edge functions e helper `db.ts` de teste (service_role) para as próximas sprints.
- **cria**: `supabase/functions/app/_shared/client.ts` (singleton supabase-js), `supabase/tests/helpers/db.ts`, `supabase/tests/helpers/request.ts`
- **altera**: `supabase/functions/app/deno.json` (import map p/ @supabase/supabase-js)
- **teste_integracao**: teste Deno importa `client.ts` e executa `select('count', {count:'exact', head:true}).from('users')` sem erro.
- **teste_funcional**: `supabase test .` roda o acima e retorna exit 0.
- **criterio_aceite**: helper `db.ts` conecta a PostgREST e retorna contagem de `users` (>= 0).
- **depende_de**: T-01.02
- **paralelizavel**: true
- **status**: pendente

---

## T-01.06 | Harness de teste Deno + fixtures (users/roles de exemplo)

- **objetivo**: Montar `supabase test` com setup/teardown: antes de cada teste, reexecuta seed de usuários (admin + secretary de exemplo) e limpa ao final, para TDD das sprints seguintes.
- **cria**: `supabase/tests/fixtures/*.ts`, `supabase/tests/setup.ts`, `supabase/tests/teardown.ts`, `supabase/deno.json` (config de testes)
- **altera**: `supabase/seed.sql` (somente se fixture exigir seed distinto do admin local)
- **teste_integracao**: teste Deno com fixture adiciona 1 usuário `secretary` e consulta-o via PostgREST (1 registro).
- **teste_funcional**: `supabase test .` roda 2+ testes, todos verdes, e teardown limpa registros de teste.
- **criterio_aceite**: suite de teste roda com exit 0 e sem registrar fixture na execução de produção.
- **depende_de**: T-01.05
- **paralelizavel**: true
- **status**: pendente

---

> **Total: 6 tasks.** Nenhuma task depende de decisão humana em execução. Sprint 01 entrega somente capacidade de testar, sem regra de negócio.