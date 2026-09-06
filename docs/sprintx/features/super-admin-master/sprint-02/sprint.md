---
expx_schema: 1
expx_tool: sprintx
kind: sprint
trabalho_id: super-admin-master
sprint_id: sprint-02
titulo: Nucleo do master e migracao de dados
status: concluido
criterio_saida: Somente super_admin gerencia usuarios os 15 modulos existem nos dois lados e admins existentes preservam acesso apos a migracao
fases: [F-02.1, F-02.2]
riscos: [Migracao de dados roda em producao contra o Postgres do Supabase — precisa validar antes contra copia local, conforme D-05]
atualizado_em: 2026-09-05
---

# Sprint 02 — Núcleo do master e migração de dados

## Objetivo

Corrigir o bug que impede o super_admin de criar usuários e tornar a gestão de usuários exclusiva dele (D-01); incluir `audit` e `settings` na lista de módulos controláveis (D-04); e migrar os dados dos admins já existentes no banco para que não percam acesso quando o enforcement real entrar em vigor nas próximas sprints (D-05).

## Fases

| Fase | Título | Roda em paralelo com |
|---|---|---|
| F-02.1 | Master exclusivo e módulos novos | nenhuma |
| F-02.2 | Migração de dados | nenhuma |

Detalhe de cada fase em `fases.md`; tasks em `tasks.md`.

## Critério de saída

`POST /auth/register`, `PUT /auth/users/{id}` e `DELETE /auth/users/{id}` só aceitam quem está autenticado como `super_admin`; `ALL_MODULES`/`ALL_PERMISSIONS` têm 15 chaves nos dois lados; um usuário `admin` que já existia no banco antes desta migração continua com todos os módulos após `alembic upgrade head`.

## Riscos conhecidos

- Migração de dados (T-02.03) altera linhas reais da tabela `users` — validar contra uma cópia local do banco de produção antes de aplicar em produção (mesmo padrão já usado na migração baseline do Alembic desta sessão).
