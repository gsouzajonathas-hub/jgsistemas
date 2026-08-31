# Sprint 01 — Fases

## F01 — Boot do stack local + config.toml funcional

- **Objetivo**: Garantir `supabase start` no Docker com `config.toml` válido, migração `init.sql` aplicada, Storage e Edge Runtime ativos.
- **Tasks**: T-01.01, T-01.02
- **Critério de saída**: `supabase status` mostra todas as imagens up; `supabase db dump` lista o schema `public` migrado.
- **Roda em paralelo com**: nenhuma (pré-requisito das demais fases desta e das próximas sprints).

## F02 — Esqueleto da Edge Function `app` com roteamento interno + health

- **Objetivo**: Criar a função única `app` (D-13) com roteamento interno via Hono, responder `GET /api/health` e servir como esqueleto de onde as sprints seguintes plugam routers (auth, students, financeiro, etc.).
- **Tasks**: T-01.03, T-01.04
- **Critério de saída**: `supabase functions serve app` expõe `/api/health` com JWT do service_role opcional; estrutura de pastas `src/routes/`, `src/middleware/`, `src/utils/` pronta.
- **Roda em paralelo com**: F03 (pode rodar em paralelo, arquivos distintos).

## F03 — Cliente de banco + harness de teste Deno com fixtures

- **Objetivo**: Provisionar cliente `supabase-js` (service_role) e harness de teste Deno (`supabase test`) com setup/teardown e fixtures básicas (users de exemplo) para sustentar o TDD das sprints seguintes.
- **Tasks**: T-01.05, T-01.06
- **Critério de saída**: `supabase test .` roda um gh de teste que lê `users` do PostgREST sem erro; helper `db.ts` e `test_helpers.ts` importáveis nas próximas sprints.
- **Roda em paralelo com**: F02 (paralelizável).