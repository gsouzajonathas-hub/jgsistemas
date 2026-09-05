# Resolução de Bloqueios — Registro de Desbloqueio

> Registro do que destravou cada bloqueio, com evidência, para auditoria e reprodução futura.

---

## B-05 — RESOLVIDO 2026-09-05 (T-05.03)

**Causa raiz:** env vars de produção do serviço Render `srv-dacdv08n74is73cr6jag` haviam sido substituídas — sobraram apenas `RESEND_FROM` e `RESEND_API_KEY`. Sem `SECRET_KEY`, `app/utils/auth.py` levanta `RuntimeError` no import e todo deploy falhava no start (`nonZeroExit:1`).

**O que destravou:**
1. Usuário forneceu o **project ref do Supabase** (`***REDACTED***`) — `PGUSER=postgres.<ref>` montado.
2. Senha do banco: a variante documentada em `docs/painel-administrador-sistema/base/01-modelo-dados.md` (com `^*`) foi **confirmada por conexão real** (asyncpg → pooler `aws-0-us-west-2.pooler.supabase.com:5432`, Postgres 17). A variante do commit `74c2a05` (com `/*`) é **typo** — falha com `InvalidPasswordError`.
3. **Nova `SECRET_KEY`** gerada via `secrets.token_urlsafe(48)` (autorização explícita do usuário; JWT antigos invalidados — todos os usuários refazem login).
4. Env vars restauradas via API Render **per-key** (`PUT /v1/services/{id}/env-vars/{key}` — a API atual não aceita mais o bulk `{"envVars":[...]}`, retorna `invalid JSON`; o corpo é `{"value":"..."}` por chave) — **14 chaves**, todas verificadas por re-GET.
5. Redeploy manual via API (`POST /v1/services/{id}/deploys`, `{"clearCache":"clear"}`) com o commit `9c7e3be`.
6. Deploy `dep-dae18gad0e5s73eo2org` → **`status: live`** (13:08 UTC).

**Evidência:**
- `GET /api/health` → **200** `{"status":"ok","message":"Sistema de gestão escolar"}`
- Postgres: coluna `actor_role` **criada** em `audit_logs` (migração do lifespan rodou no boot do novo deploy)
- `POST /api/auth/login` com credenciais inválidas → **401** `{"detail":"Email ou senha incorretos"}` (API saudável, sem erro de boot)
- Eventos do serviço: `build_started → build_ended → deploy_started → deploy_ended` (sem `deploy_failed`)

**Envs definidas (nomes — valores secretos nunca registrados):** `SECRET_KEY` (nova), `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `RESEND_FROM`, `RESEND_API_KEY` (preservadas), `ACCESS_TOKEN_EXPIRE_MINUTES=60`, `CORS_ORIGINS`, `FRONTEND_URL`, `ENVIRONMENT=production`, `DATA_DIR=/data`, `UPLOAD_DIR=/data/uploads`.

**Pendência residual (não bloqueia o serviço, bloqueia T-05.03/T-05.04):** `SUPPORT_ADMIN_EMAIL`/`SUPPORT_ADMIN_PASSWORD` (+`SUPPORT_ADMIN_NAME` opcional) — usuário informou que colaria os valores, ainda não entregues; ao definir, redeploy manual para o seed criar a conta super admin.

**SUPPORT_ADMIN_* definidos em 2026-09-05** (email do usuário + senha fornecida; nome "Suporte") → redeploy `dep-dae1cr8n74is73bvvsmg` **live** → conta super admin **criada** (id 2, role `super_admin`, login 200) → QA E4 concluído (evidências em `00-AUDITORIA.md` §F6). B-01 e B-05 fechados; T-05.03 e T-05.04 `concluida`.

**Recomendação de segurança deixada:** a senha do banco foi exposta na mensagem do commit público `74c2a05` — após concluir o fluxo, fazer **Reset database password** no painel do Supabase (Settings → Database) e atualizar a env `PGPASSWORD`.

**ROTAÇÃO CONCLUÍDA 2026-09-05:** usuário resetou a senha no Supabase → conexão testada via asyncpg (Postgres 17.6 OK) → `PGPASSWORD` atualizada no Render via API per-key (17 env vars preservadas) → redeploy `dep-dae20pad0e5s73er2m30` **live** → health 200 → login super admin 200 com `superadmin.seed` re-executado no novo build (prova de conexão com a nova senha). Vale recomendar também apagar/rewrite do commit antigo quando conveniente.