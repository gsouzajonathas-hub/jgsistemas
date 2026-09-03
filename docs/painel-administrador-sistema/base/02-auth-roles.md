# Autenticação, Roles e Permissões

> Área estudada na F1 do sprintx para o painel de administrador do sistema. Fontes lidas: `backend/app/utils/auth.py`, `backend/app/routes/auth.py`. Acessado em 2026-09-03.

## Contrato de entrada

- **Login**: `POST /api/auth/login` com `{email, password}`. Rate limit 10 tentativas / 300s por IP (`auth.py:94`). Lockout de conta por falhas.
- **Register**: `POST /api/auth/register` com `{name, email, password, role?="secretary", permissions?}`. Aberto só no bootstrap (sem usuários); depois exige admin autenticado (`auth.py:144-147`). Rate limit 5 / 300s.
- JWT: `Authorization: Bearer <token>`, via `HTTPBearer` (`utils/auth.py:32`).

## Contrato de saída

- **Login** retorna `LoginResponse {access_token, token_type="bearer", user:{id,name,email,role,permissions,avatar_url,school_id}}` (`auth.py:32-36, 119-130`).
- **Token JWT** payload: `{"sub": str(user.id), "role": user.role, "exp": ...}` (HS256, `SECRET_KEY`). **Não carrega school_id** (`auth.py:117`).
- Validade: `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60) (`utils/auth.py:30`).

## Roles e permissões

- **Roles válidas (hard-coded)**: `"admin"`, `"secretary"`, `"teacher"` (`auth.py:153, 319`).
- `require_role(*roles)` — dependency injector; checa `current_user.role in roles` senão 403 (`utils/auth.py:85-90`).
- `permissions` no User é JSON array como Text (`user.py:14`). No login, `json.loads` quando presente (`auth.py:118`).
- Frontend `hasPermission`: se role === 'admin' retorna true; senão verifica `permissions.includes(permission)` (`frontend/src/contexts/AuthContext.tsx:53-58`).

## Fluxos protegidos (rotas de auth)

- `GET /api/auth/me` — `get_current_user` (`auth.py:249`).
- `GET /api/auth/users` — `require_role("admin")` (`auth.py:260-275`).
- `PUT/DELETE /api/auth/users/{id}` — `require_role("admin")` (`auth.py:278-328`).
- `POST /api/auth/change-password` — `get_current_user` (`auth.py:233`).
- `forgot-password`/`reset-password` — token único com hash SHA-256, TTL 30 min (`auth.py:24, 69-71, 205-230`).

## Limites e cotas

- Rate limits: login 10/300s, register 5/300s, forgot 5/900s, reset 5/900s (por IP) (`auth.py:94,137,173,208`).
- Senha mínima 8 caracteres (`validate_password`, `utils/auth.py:43-45`).
- `SECRET_KEY` obrigatória; backend recusa iniciar com chaves padrão (`utils/auth.py:23-27`).

## Erros conhecidos e tratamento

- Falha de login → 401 "Email ou senha incorretos" (resposta genérica, sem enumeração) (`auth.py:99,105,108`).
- Conta inativa → 403 "Conta desativada" (`auth.py:110`).
- `require_role` falha → 403 "Acesso negado".
- Rate limit → 429 com mensagem em português.
- Token inválido/expirado → 401 "Token inválido ou expirado" (`utils/auth.py:62-66`).

## Riscos para a nossa implementação

- **Não existe role `super_admin`** — o pedido exige introduzi-la no sistema de roles (register + update + require_role + frontend).
- JWT não carrega `school_id` — para isolar por escola, seria preciso buscar o User no banco ou incluir no token.
- O campo `permissions` permite permissões granulares por módulo — o painel super-admin pode reutilizar esse mecanismo.
- `hasPermission` no frontend dá tudo para `admin` — a separação super-admin (sistema) vs admin (escola) exige um papel distinto, não reusar `admin`.

## Fonte

- `backend/app/utils/auth.py` (JWT, `require_role`, `get_current_user`, `hash/verify_password`)
- `backend/app/routes/auth.py` (login, register, users CRUD, reset password)
- `frontend/src/contexts/AuthContext.tsx` (`hasPermission`)
