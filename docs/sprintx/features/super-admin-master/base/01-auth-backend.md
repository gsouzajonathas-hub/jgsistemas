# Autenticação, roles e gestão de usuários (backend)

## Contrato de entrada

- `POST /api/auth/register` — `{name, email, password, role="secretary", permissions?}` (`backend/app/routes/auth.py:40-45, 135-168`). Aberto sem autenticação apenas quando a tabela `users` está vazia (bootstrap); depois exige que quem chama seja identificado como admin por `_optional_admin_user` (`auth.py:75-85`).
- `PUT /api/auth/users/{id}` — `{name?, email?, role?, permissions?, is_active?}`, exige `require_role("admin")` (`auth.py:63-68, 336-372`).
- `DELETE /api/auth/users/{id}` — exige `require_role("admin")` (`auth.py:280-333`).
- `GET /api/auth/users` — exige `require_role("admin")` (`auth.py:262-277`).

## Contrato de saída

- `login` retorna `{access_token, user:{id,name,email,role,permissions,avatar_url,school_id}}` (`auth.py:34-37, 121-132`). O JWT carrega `{"sub": id, "role": role, "exp": ...}` (`auth.py:119`).
- `list_users` devolve `id,name,email,role,is_active,permissions,created_at` para cada usuário (`auth.py:269-277`).

## Limites e cotas

- `role` só aceita `"admin" | "secretary" | "teacher"` tanto em `register` quanto em `update_user` — qualquer outro valor (inclusive `"super_admin"`) vira `"secretary"` silenciosamente (`auth.py:155, 363`). **Não existe caminho de API que crie ou promova alguém a `super_admin`** — a única forma é o seed automático no startup via env vars `SUPPORT_ADMIN_EMAIL`/`SUPPORT_ADMIN_PASSWORD` (`backend/app/main.py:93-121`, fora do escopo desta feature).
- Senha mínima 8 caracteres (`validate_password`, `utils/auth.py:45-47`).

## Erros conhecidos e tratamento

- `require_role(*roles)` (`utils/auth.py:87-95`): se `current_user.role == "super_admin"`, passa em QUALQUER checagem de role, sem exceção. Caso contrário, 403 "Acesso negado" se o role não estiver na lista.
- `delete_user`: bloqueia excluir a própria conta (400), bloqueia excluir o último admin ativo (400), bloqueia excluir a conta `super_admin` (400) (`auth.py:287-315`).
- `update_user`: bloqueia rebaixar a role de uma conta `super_admin` (400) (`auth.py:356-362`). Não há bloqueio equivalente para um admin rebaixar OUTRO admin, nem para um admin excluir outro admin (só o ÚLTIMO admin ativo é protegido).

## Riscos para a nossa implementação

1. **BUG CONFIRMADO — super_admin não consegue criar usuário pela tela do sistema.** `authAPI.createUser` (frontend) chama `POST /auth/register` (`frontend/src/services/api.ts:38`), que valida quem está chamando via `_optional_admin_user` — e essa função checa literalmente `user.role == "admin"` (`auth.py:83`), **sem incluir `"super_admin"`**. Um super_admin logado que tentar cadastrar um novo usuário pela UI recebe 403 "Apenas administradores podem criar usuários". Isso contradiz diretamente o pedido do usuário ("super_admin precisa conseguir criar usuário").
2. **`admin` comum tem exatamente o mesmo poder que `super_admin` hoje.** Qualquer conta com `role="admin"` passa em todo `require_role("admin")`, incluindo `GET/PUT/DELETE /users`. Ou seja, hoje NÃO existe um "master" único: qualquer admin pode criar outro admin, editar ou excluir qualquer outro admin (exceto o último), e ninguém tem precedência sobre ninguém. Isso é o núcleo do pedido do usuário ("Super admin seja o master") — precisa de decisão explícita na F2 sobre se `admin` comum deve deixar de ter esse poder irrestrito.
3. **O campo `permissions` (JSON de módulos) NUNCA é validado no backend.** Toda rota de escrita usa `require_role("admin", "secretary")` (ou similar) — nenhuma rota do sistema checa se o `secretary`/`teacher` autenticado tem o módulo específico liberado em `permissions`. Rotas de leitura (`GET`) em geral só exigem `get_current_user` — nenhuma checagem de role OU permissão (ex.: `financial.py:126-127,295-296,622-623`). Isto é, a "ocultação de módulo" hoje é **só visual** (o `Sidebar` filtra o menu via `hasPermission`, `frontend/src/components/Sidebar.tsx:119`) — um usuário com o módulo oculto ainda acessa os dados chamando a API diretamente com o próprio token. Relevante porque o usuário pediu explicitamente "ocultar módulos que o usuário pode usar ou não" "para que o sistema funcione a 100% na sua totalidade".
4. `_optional_admin_user` é usada só no fluxo de `register` (criação); `update_user`/`delete_user` já usam o `require_role("admin")` padrão (que aceita `super_admin` corretamente) — a inconsistência do achado 1 é isolada nesse único ponto.

## Fonte

- `backend/app/utils/auth.py` (require_role, hash/verify/JWT) — lido integralmente nesta sessão, 2026-09-05
- `backend/app/routes/auth.py` (login, register, users CRUD, reset password) — lido integralmente nesta sessão, 2026-09-05
- `backend/app/models/user.py` — lido integralmente nesta sessão, 2026-09-05
- `frontend/src/services/api.ts:38-40` (authAPI.createUser/updateUser/deleteUser) — 2026-09-05
- Grep de `require_role(` em `backend/app/routes/*.py` (45 ocorrências, todas em rotas de escrita) — 2026-09-05
- Grep de `@router.get` em `backend/app/routes/financial.py` (nenhuma rota de leitura amostrada usa `require_role`) — 2026-09-05
