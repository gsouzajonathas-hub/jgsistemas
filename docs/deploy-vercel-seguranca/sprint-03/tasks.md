# Sprint 03 — Tasks

Caminhos relativos à raiz do repositório. Status inicial de toda task: `pendente`.

---

## T-03.01 | Login endpoint

- **objetivo**: Migrar `POST /api/auth/login` do FastAPI com `verifyPassword`, `incrementRateLimit` e respostas genéricas (sem enumeração de usuário).
- **cria**: `supabase/functions/app/src/routes/auth.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts` (registrar rota `/api/auth`)
- **teste_integracao**: POST `/api/auth/login` com credenciais corretas do seed admin retorna 200 com `access_token` e `user.role`.
- **teste_funcional**: login com senha errada retorna 401 e corpo `{ "detail": "Invalid credentials" }` genérico.
- **criterio_aceite**: login válido devolve JWT válido e login inválido retorna 401 sem distinguir email/senha.
- **depende_de**: T-02.03, T-02.04, T-02.05, T-01.05
- **paralelizavel**: false
- **status**: pendente

---

## T-03.02 | Logout + GET /api/auth/me

- **objetivo**: Migrar logout e `GET /api/auth/me` (dados do token autenticado).
- **cria**: (no `auth.ts` da T-03.01)
- **altera**: `supabase/functions/app/src/routes/auth.ts`
- **teste_integracao**: GET `/api/auth/me` com token válido retorna 200 com `id` e `role` do usuário.
- **teste_funcional**: GET `/api/auth/me` sem token retorna 401.
- **criterio_aceite**: `/me` retorna dados do token e exige auth.
- **depende_de**: T-03.01
- **paralelizavel**: false
- **status**: pendente

---

## T-03.03 | Forgot password (gera token 30min + email Resend)

- **objetivo**: Migrar `POST /api/auth/forgot-password`: gera token único com validade 30min, grava `reset_token_hash` (sha256) e `reset_token_expires` **na tabela `users`** (colunas já presentes no schema `init.sql`) e envia email via Resend (ou console em dev se sem key).
- **cria**: `supabase/functions/app/src/routes/password.ts`, `supabase/functions/app/_shared/email.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: POST forgot para email cadastrado retorna 200 (idempotente) e atualiza `users.reset_token_expires = now + 30min` para o usuário.
- **teste_funcional**: sem `RESEND_API_KEY`, o handler loga o link no console em vez de falhar.
- **criterio_aceite**: `reset_token_hash`/`reset_token_expires` gravados com expiração de 30min; resposta 200 independente de o email existir (anti-enumeração).
- **depende_de**: T-02.01, T-01.05, T-03.01
- **paralelizavel**: true
- **status**: pendente

---

## T-03.04 | Reset password + Change password

- **objetivo**: Migrar `POST /api/auth/reset-password` (valida token 30min, atualiza hash) e `POST /api/auth/change-password` (exige senha atual).
- **cria**: (no `password.ts`)
- **altera**: `supabase/functions/app/src/routes/password.ts`
- **teste_integracao**: reset com token válido atualiza a senha e o login subsequente usa `verifyPassword` verdadeiro.
- **teste_funcional**: reset com token expirado retorna 400/401 com `{ "detail": "token expirado" }`.
- **criterio_aceite**: reset valida token não expirado e atualiza hash; token expirado é rejeitado.
- **depende_de**: T-03.03
- **paralelizavel**: false
- **status**: pendente

---

## T-03.05 | Register endpoint (admin-only pós 1º usuário)

- **objetivo**: Migrar `POST /api/auth/register` — primeiro usuário cria admin; depois, requer token admin; valida email/role/senha.
- **cria**: (no `auth.ts`)
- **altera**: `supabase/functions/app/src/routes/auth.ts`
- **teste_integracao**: com 0 usuários, register cria admin sem token; com usuário existente, register sem token admin retorna 401.
- **teste_funcional**: register novo usuário com token admin retorna 201 e o usuário faz login.
- **criterio_aceite**: regra de 1º-usuário-admin e demais registros admin-only.
- **depende_de**: T-02.04, T-03.01
- **paralelizavel**: false
- **status**: pendente

---

## T-03.06 | Users CRUD + search

- **objetivo**: Migrar `users.py` (list/search, get por id, update, delete) com permissões por role (admin gerencia todos; secretary leitura limitada).
- **cria**: `supabase/functions/app/src/routes/users.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: GET `/api/users` com token admin retorna 200 com array; POST cria usuário com 201.
- **teste_funcional**: DELETE `/api/users/:id` com token secretary retorna 403.
- **criterio_aceite**: CRUD respeita níveis de role (admin/secretary).
- **depende_de**: T-02.03, T-03.05
- **paralelizavel**: false
- **status**: pendente

---

## T-03.07 | Audit write helper + gravação em eventos-chave

- **objetivo**: Migrar `utils/audit.py` — helper `auditLog(event, entity, entity_id, user_id)` que insere em `audit_logs`; integrar em login, users, alunos, settings, certificados.
- **cria**: `supabase/functions/app/_shared/audit.ts`
- **altera**: `supabase/functions/app/src/routes/auth.ts`, `users.ts`
- **teste_integracao**: após um login bem-sucedido, `SELECT count(*) FROM audit_logs` incrementa em 1.
- **teste_funcional**: evento de criação de usuário gera registro de auditoria com `action='create_user'`.
- **criterio_aceite**: eventos de login/users/alunos/settings são gravados em `audit_logs`.
- **depende_de**: T-03.01, T-01.05
- **paralelizavel**: true
- **status**: pendente

---

## T-03.08 | GET /api/audit (admin only, paginado)

- **objetivo**: Migrar `GET /api/audit` — lista eventos com paginação (offset/limit), filtro por ação/usuário, admin only.
- **cria**: `supabase/functions/app/src/routes/audit.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: GET `/api/audit?limit=10` com token admin retorna 200 com array de eventos.
- **teste_funcional**: GET `/api/audit` com token secretary retorna 403.
- **criterio_aceite**: consulta paginada de auditoria restrita a admin.
- **depende_de**: T-03.07, T-02.03
- **paralelizavel**: true
- **status**: pendente

---

> **Total: 8 tasks.**