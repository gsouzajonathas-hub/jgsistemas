# Autenticação, roles e permissões (base para a conta Super Admin)

## Contrato de entrada

- `RegisterRequest`: campos exatos nas linhas 1-66 de auth.py **não relidos nesta sessão** (LACUNA L3); comportamento observado: `role` default `"secretary"` e `permissions: list | None` (backend/app/routes/auth.py:155-156).
- `LoginRequest`: email + senha (auth.py:93-107).
- `UpdateUserRequest` (auth.py:60-68): `name`, `email`, `role`, `permissions: list[str] | None`, `is_active: bool | None` — todos opcionais.
- JWT: payload `{"sub": str(user.id), "role": user.role}` (auth.py:119); header `Authorization: Bearer` via HTTPBearer (backend/app/utils/auth.py:34).

## Contrato de saída

- `login` → `LoginResponse`: `access_token` + `user{id, name, email, role, permissions, avatar_url, school_id}` (auth.py:121-131).
- `GET /users` → array com `id/name/email/role/is_active/permissions/created_at` (auth.py:269-276); exige role `admin` (L264).
- `DELETE /users/{id}` → `{"message"}` (L325); guardas: não exclui a própria conta (L288), não exclui o último admin ativo (L294-307), limpa `audit_logs`/`communication_logs` antes do delete (L312-319).
- `PUT /users/{id}` → `{"message"}` (L358); exige role `admin` (L333).
- `POST /register` → `{"message"}` (L168); aberto apenas no bootstrap (0 usuários) — depois exige admin autenticado (L145-149, `_optional_admin_user` L75-85 com `role == "admin"`).

## Limites e cotas

- Token: HS256, expira em `ACCESS_TOKEN_EXPIRE_MINUTES`, default **480 min** (backend/app/utils/auth.py:29-32).
- Rate limits: login 10 tentativas/300 s por IP (auth.py:96); register 5/300 s (L139); forgot 5/900 s (L174); reset 5/900 s (L210).
- Lockout de conta: resposta idêntica à falha normal quando bloqueada (auth.py:99-101).
- Senha: mínimo 8 caracteres (auth.py:45-47).
- `SECRET_KEY` obrigatória — backend recusa iniciar com chaves padrão (auth.py:17-27).

## Erros conhecidos e tratamento

- 401 genérico "Email ou senha incorretos" (sem enumeração de usuários; auth.py:101, L107, L110); 401 token inválido/expirado (auth.py:61-68); 401 usuário inativo/inexistente (L82-83).
- 403: "Conta desativada" (L112); "Apenas administradores podem criar usuários" (L149); "Acesso negado" (`require_role`, auth.py:90).
- 400: email já cadastrado (L153, L345); senha curta (`validate_password`, auth.py:47); "Você não pode excluir a própria conta" (L288); "Não é possível excluir o último administrador ativo" (L304-306).
- 429: "Muitas tentativas..." (auth.py:96-97, L139-140, L174-175, L210-212).

## Riscos para a nossa implementação

- R1: whitelist de roles fixa em register e update — `role in ("admin","secretary","teacher")` senão vira `"secretary"` (auth.py:155, L349). Uma role nova (ex.: `super_admin`) exige alterar os 2 pontos + checagens do frontend.
- R2: `permissions` (campo JSON) é checada **apenas no frontend** — `hasPermission` no AuthContext (frontend/src/contexts/AuthContext.tsx:53-58: `admin` → true; senão lista) e Sidebar (frontend/src/components/Sidebar.tsx:118). O backend checa somente `role` via `require_role` (auth.py:87-92). Decidir se a conta Super Admin passa por todos os `require_role` ou ganha tratamento.
- R3: `/settings` é `ProtectedRoute` sem permission (frontend/src/App.tsx:91) e o GET exige só autenticação (settings.py:43); o PUT exige `admin|secretary` (settings.py:55).
- R4: `/audit` exige permission `"audit"` (App.tsx:90; Sidebar.tsx:45) — a conta de suporte ("verificar") precisa dela.
- R5: guarda do último admin ativo é por role `"admin"` (auth.py:294-307) — a conta de suporte não deve poder ser excluída por engano nem quebrar essa guarda.
- R6: `roleLabels` do Sidebar não tem entrada `super_admin` (Sidebar.tsx:50-56) — usuário veria o label cru.

## Fonte

backend/app/routes/auth.py; backend/app/utils/auth.py; backend/app/models/user.py; frontend/src/contexts/AuthContext.tsx; frontend/src/components/Sidebar.tsx; frontend/src/App.tsx — acessado em 2026-09-04.