# Sprint 01 — Fundação de Teste (capacidade de testar)

> Regra estrutural obrigatória (sprintx F3): a sprint-01 entrega a **capacidade de testar** — configuração,
> client/conexões, harness de teste, fixtures — e **NÃO** funcionalidade de negócio.
> Sem ela, o TDD das sprints seguintes não é executável.

## Objetivo

Entregar a infraestrutura mínima para que qualquer desenvolvedor consiga:
1. Subir o stack Supabase local (`supabase start` + Docker) e ver o Postgres, Storage e Edge Runtime rodando.
2. Executar a Edge Function `app` (esqueleto) e responder um `GET /api/health`.
3. Rodar testes de integração (Deno) contra o stack local com cliente PostgREST (`supabase-js`) apontando para o schema `public`.
4. Carregar secrets/variáveis de ambiente para as Edge Functions sem vazar credenciais para o git.

**Nada de regra de negócio nesta sprint.** Apenas a fundação verificável.

## Fases

| Fase | Descrição |
|---|---|
| F01 | Boot do stack local + config.toml funcional |
| F02 | Esqueleto da Edge Function `app` com roteamento interno (Hono) + health |
| F03 | Cliente de banco (supabase-js) + harness de teste Deno com fixtures |

## Critério de saída

- [ ] `supabase start` sobe sem erro com portas configuradas e PostgreSQL migrado pelo `migrations/20260830000100_init.sql` (25 tabelas `public`).
- [ ] `supabase functions serve app` responde `GET /api/health` -> `200 {"status":"ok"}`.
- [ ] `supabase test` (ou `deno test`) roda um teste de integração que conecta em PostgREST e lê a tabela `users` (count >= 0 sem erro).
- [ ] Variáveis de ambiente das Edge Functions carregadas de `.env` local (não committado) com valores padrão derivados do `supabase status`.

## Riscos conhecidos

- Porta 54322 (Postgres) pode conflitar com Postgres local :5432 do backend legado. Mitigação: `supabase stop` antes do boot; config.toml mantém 54322 (não colide).
- Deno não instalado localmente: `supabase functions serve` e `supabase test` usam o Edge Runtime em Docker, então Deno standalone não é requisito. Testes escritos para Deno API mas executados via `supabase test`.
- Docker Desktop com WSL2 pode demorar no primeiro pull de imagens.

## Dependências de decisões

- D-02 (reecrita Edge Functions), D-03 (banco limpo), D-13 (uma Edge Function `app`), D-12 (health).
