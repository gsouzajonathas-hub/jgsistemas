# Sprint 03 — Auth + Usuários + Auditoria

## Objetivo

Migrar o módulo de autenticação e gestão de usuários para as Edge Functions, removendo o login Supabase
(D-05) e mantendo o JWT próprio (D-06). Inclui: login, logout, register (só admin após 1º usuário),
forgot/reset/change password via Resend (D-08/D-09), `GET /api/auth/me`, CRUD `/api/users` e
trilha de auditoria `/api/audit` (D-12).

## Fases

| Fase | Descrição |
|---|---|
| F01 | Auth (login/logout/me) |
| F02 | Password (forgot/reset/change via Resend) |
| F03 | Users CRUD + register |
| F04 | Audit log |

## Critério de saída

- [ ] Login retorna JWT + payload do usuário com role (admin/secretary).
- [ ] Reset de senha gera link válido por 30min e envia via Resend (ou console em dev sem key).
- [ ] Registrar novo usuário exige role admin (após 1º usuário existente).
- [ ] Users CRUD completo (list/get/create/update/delete) com validação de role.
- [ ] `GET /api/audit` lista eventos de login, usuários, alunos, configurações e certificados (admin only).

## Riscos conhecidos

- Resend sem `RESEND_API_KEY`: reset cai para console-only em dev (PENDENTE-02, não bloqueante).
- bcryptjs: hashing de novo usuário leva ~200ms (aceitável em Edge Function).

## Dependências de decisões

- D-05 (sem Supabase Auth), D-06 (JWT HS256), D-08 (Resend free), D-09 (domínio próprio), D-12 (auditoria mínima)