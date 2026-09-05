# Sprint 04 — Conta Super Admin de suporte (Feature #5)

## Objetivo

Entregar a Feature #5: conta de suporte com role própria `super_admin`, criada automaticamente no startup a partir de `SUPPORT_ADMIN_EMAIL`/`SUPPORT_ADMIN_PASSWORD` (D-03, D-06, D-07, D-13), com acesso total a módulos/Configurações/Auditoria (D-08) e ações destacadas na trilha de auditoria via novo campo de ator + coluna na tela (D-09).

## Fases

| Fase | Título | Roda em paralelo com |
|---|---|---|
| F-04.1 | Backend: seed no startup + role super_admin com acesso total | F-04.3 |
| F-04.2 | Backend: auditoria destacada (campo actor_role) | F-04.3 |
| F-04.3 | Frontend: permissão, labels e badge de auditoria | F-04.1, F-04.2 |

Detalhe de cada fase em `fases.md`; tasks em `tasks.md`.

## Critério de saída

Com `SUPPORT_ADMIN_EMAIL`/`SUPPORT_ADMIN_PASSWORD` definidas, o startup cria (ou atualiza) a conta `super_admin` de forma idempotente; o login funciona; `require_role` libera acesso total para a role; `PUT /users/{id}` não rebaixa `super_admin`; a auditoria persiste `actor_role` e a tela exibe destaque; suites rodam com 0 failed.

## Riscos conhecidos

- Whitelist de roles em `auth.py:155` e `:349` rebaixa qualquer role fora de `admin|secretary|teacher` para `secretary` — o seed deve ser independente dela e o `PUT /users/{id}` deve proteger `super_admin` (Nota técnica em `00-DECISOES.md`).
- A coluna nova em tabela existente não é criada pelo `Base.metadata.create_all` em bancos já criados: a migração aditiva precisa cobrir SQLite (PRAGMA, padrão em main.py) e PostgreSQL (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`), já que produção usa Postgres (D-01).
- O valor de `SUPPORT_ADMIN_PASSWORD` nunca é registrado em arquivos — somente em variável de ambiente do Render (constraint de segredo).