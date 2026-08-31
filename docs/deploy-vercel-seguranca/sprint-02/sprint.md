# Sprint 02 — Infra da Edge Function + Core Utils

## Objetivo

Entregar os building blocks de infraestrutura que TODAS as rotas de negócio usarão:
- JWT HS256 validation middleware (D-06)
- bcryptjs password verification (D-02 — substitui `passlib[bcrypt]` Python)
- CORS restrito (CORS_ORIGINS)
- Rate-limit e account-lockout portados para tabelas Postgres (substitui in-memory Python)
- Config/secrets loading a partir de Deno.env
- Error/response helpers padronizados (JSON shape compatível com frontend)

**Regra de granularidade:** cada task tem teste_integracao e teste_funcional que cabem em uma frase cada.

## Fases

| Fase | Descrição |
|---|---|
| F01 | Config/secrets + error/response helpers |
| F02 | JWT middleware + bcrypt verify |
| F03 | Rate-limit + lockout em Postgres |

## Critério de saída

- [ ] Middleware JWT valida token HS256 com SECRET_KEY do ambiente e rejeita token expirado/inválido.
- [ ] bcryptjs compara hash gerado por passlib compatível com seed `admin`.
- [ ] POST `/api/auth/login` incrementa contador no Postgres e bloqueia após 5 tentativas falhas (30min lockout).
- [ ] CORS Headers retornados corretamente para origens configuradas em `CORS_ORIGINS`.

## Riscos conhecidos

- bcryptjs em Deno/Edge Functions: benchmark ~200ms por hash — aceitável para login; não para hash de massa.
- Rate-limit/lockout tables (criadas na migração `20260830000115_rate_limit_lockout.sql`) precisam de RLS desabilitada ou policy de service_role para as Edge Functions as acessarem com o client de serviço; migração deve garantir permissões corretas.

## Dependências de decisões

- D-06 (JWT HS256 próprio), D-02 (bcryptjs), D-05 (sem Supabase Auth), D-12 (auditoria)