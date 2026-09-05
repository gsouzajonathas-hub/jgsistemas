# Área de conhecimento — Exclusao de usuarios e integridade referencial

> Arquivo de área: NÃO leva frontmatter (o painel lê apenas o índice e as lacunas).

## O que o sistema faz hoje

- `DELETE /api/auth/users/{id}` (`backend/app/routes/auth.py:278-295`): exige admin, bloqueia auto-exclusão, registra trilha de auditoria e chama `db.delete(user)`.
- Modelos com FK para `users.id`:
  - `backend/app/models/audit_log.py:11` — `user_id = Column(Integer, ForeignKey("users.id"))` (SEM `ondelete`).
  - `backend/app/models/communication.py:14` — `sent_by = Column(Integer, ForeignKey("users.id"))` (SEM `ondelete`).
- `backend/app/models/user.py:25` — relação `audit_logs` com `passive_deletes=True` (espera cascade no banco, que **não existe**).
- Frontend `Settings.tsx:85-89` — `handleDeleteUser` usa `window.confirm` e chama `authAPI.deleteUser` **sem try/catch** → qualquer falha vira unhandled rejection silenciosa.

## Comportamento comprovado

- `test_user_delete_regression.py` (novo, rodado em 2026-09-04): usuário com registro de auditoria → `DELETE` falha com `IntegrityError: FOREIGN KEY constraint failed` (`DELETE FROM users WHERE users.id = ?`). Teste VERMELHO antes do fix — prova que qualquer usuário que já fez login/ação não pode ser excluído em Postgres.

## Referências

- `.claude/skills/runx/references/00-schema.md` — contrato de frontmatter.
- `docs/manutencao/OC-2026-0001-nao-consigo-criar-matricula/` — ocorrência anterior (mesmo estilo de docs).