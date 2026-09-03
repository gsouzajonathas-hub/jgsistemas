# Frontend — Rotas, Layout e Estado de Auth

> Área estudada na F1 do sprintx para o painel de administrador do sistema. Fontes lidas: `frontend/src/App.tsx`, `contexts/AuthContext.tsx`, `components/Layout.tsx`, `components/Sidebar.tsx`. Acessado em 2026-09-03.

## Contrato de entrada

Stack: React + TypeScript + Tailwind + Vite + react-router-dom (BrowserRouter). API via axios com `baseURL: '/api'` e `timeout: 30000` (`frontend/src/services/api.ts:4-6`). Em produção o proxy `/api` é resolvido pelo `vercel.json` para o Render.

## Rotas (frontend/src/App.tsx:63-93)

- `/login` → `Login` (pública)
- `/` → `HomeRoute` (Landing se não logado; Layout+Dashboard se logado)
- Rotas protegidas por `PermissionRoute` (exige `hasPermission(permission)`):
  - `/students`, `/students/:id` (students), `/enrollments`, `/classes`, `/attendance`, `/evaluations`, `/boletins`, `/certificates`, `/financial`, `/planos`, `/contratos`, `/mensalidades`, `/carnes` (financial), `/schedule`, `/reports`, `/audit`
- `/settings` → `ProtectedRoute` (só exige login, não permissão)
- `*` → redireciona a `/`

## Contratos de proteção (App.tsx)

- `ProtectedRoute` (Linha 26-35): se `loading` mostra spinner; se `!user` → `/login`; senão `Layout`.
- `PermissionRoute` (Linha 37-47): mesmo do ProtectedRoute + exige `hasPermission(permission)` senão → `/`.
- `HomeRoute` (Linha 49-61): se logado e sem permissão 'dashboard' → `/settings`; se logado → Dashboard; senão Landing.

## Estado de auth (AuthContext.tsx:16-73)

- `user` (User | null), `login(email,password)`, `applySession(token,user)`, `logout()`, `loading`, `hasPermission(permission)`.
- Token e user persistidos em `localStorage` (`token`, `user`).
- `hasPermission`: `admin` → tudo true; senão checa `user.permissions.includes(permission)`.
- Escuta evento `auth:logout` para limpar sessão em 401.

## Layout e navegação (Layout.tsx, Sidebar.tsx)

- `Layout` renderiza `Sidebar` + `Header` + `main` (max-w-[1600px]). Sidebar colapsável (64 → 76px).
- `Sidebar` tem `navGroups` com itens filtrados por `hasPermission(item.permission)`; grupos "Principal", "Gestão", "Análises", "Sistema".
- Título fixo "Gestão Escolar" / subtítulo "JG Sistemas" (Sidebar.tsx:94-95) — hard-coded, não vem da school.
- `roleLabels` no Sidebar: admin→Administrador, secretary→Secretaria, teacher→Professor, financial→Financeiro, coordinator→Coordenador (linha 48-54) — **não tem super_admin**.
- Menu itens têm `permission` opcional; itens sem permission (ex.: Configurações) ficam visíveis com login.

## Limites e cotas

- Timeout axios de 30s para todas as requisições (`api.ts:6`).
- NÃO DOCUMENTADO paginação/tamanhos de resposta no frontend.

## Erros conhecidos e tratamento

- 401 no axios dispara logout via evento `auth:logout` (interceptor em `api.ts:18`), limpa sessão e leva ao login.
- Proteção de rota redireciona para `/` quando sem permissão.

## Riscos para a nossa implementação

- Adicionar o painel super-admin exige: rotas próprias (ex.: `/admin/*`), um guard que reconheça a role `super_admin`, um layout/menu separado para não misturar com o painel da escola, e ajustes em `HomeRoute`/`ProtectedRoute`.
- O título "Gestão Escolar"/"JG Sistemas" é hard-coded no Sidebar — precisará de tratamento para o contexto super-admin.
- `roleLabels` precisa da entrada `super_admin`.
- O frontend chama `/api/*` via proxy; novos endpoints de admin devem seguir esse mesmo padrão.

## Fonte

- `frontend/src/App.tsx`, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/components/Layout.tsx`, `frontend/src/components/Sidebar.tsx`
- `frontend/src/services/api.ts` (axios)
- `frontend/src/pages/*` (estrutura de páginas via glob)
