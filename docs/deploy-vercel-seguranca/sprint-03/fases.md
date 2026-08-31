# Sprint 03 — Fases

## F01 — Auth (login/logout/me)

- **Objetivo**: Migrar `auth.py` — login com `verifyPassword` + rate-limit (T-02.05), logout, `GET /me`. Respostas genéricas (sem enumeração de usuário).
- **Tasks**: T-03.01, T-03.02
- **Critério de saída**: login válido retorna token + user; login inválido retorna 401 genérico; `/me` retorna dados do token.
- **Roda em paralelo com**: nenhuma (base do domínio).

## F02 — Password (forgot/reset/change via Resend)

- **objetivo**: Migrar `utils/email_service.py` e o fluxo de reset de senha com token de 30min, envio via Resend (D-08/D-09).
- **Tasks**: T-03.03, T-03.04
- **Critério de saída**: forgot gera token; reset valida token e atualiza senha; change exige senha antiga.
- **Roda em paralelo com**: F04 (arquivos distintos).

## F03 — Users CRUD + register

- **objetivo**: Portar `users.py` — register (admin-only pós 1º usuário), list/search, get, update, delete com lógica de permissão por role.
- **Tasks**: T-03.05, T-03.06
- **Critério de saída**: CRUD completo com nível de auth correto (admin/secretary).
- **Roda em paralelo com**: F02, F04.

## F04 — Audit log

- **objetivo**: Portar `utils/audit.py` — registrar e consultar eventos em `audit_logs`.
- **Tasks**: T-03.07, T-03.08
- **Critério de saída**: eventos gravados em requisições de login/users/alunos/settings/cert; `GET /api/audit` retorna lista paginada (admin only).
- **Roda em paralelo com**: F02, F03.