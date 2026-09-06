# Permissões por módulo e gestão de usuários (frontend)

## Contrato de entrada

- `ALL_PERMISSIONS` (`frontend/src/pages/Settings.tsx:10-25`) — 13 módulos com chave/label: `dashboard`, `students`, `enrollments`, `courses`, `teachers`, `classes`, `attendance`, `evaluations`, `boletins`, `certificates`, `financial`, `schedule`, `reports`. Não inclui `audit` nem `settings` como chaves selecionáveis no formulário, embora o Sidebar declare `permission: 'audit'` para o item Auditoria (`Sidebar.tsx:45`) — `settings` nunca é gated (`Sidebar.tsx:44`, sem campo `permission`).
- Formulário de usuário em Configurações (`Settings.tsx`, modal `UserForm`): campos `name, email, password (só na criação), role (admin|secretary|teacher — sem super_admin), permissions[]` (checkboxes de `ALL_PERMISSIONS`, renderizados apenas quando `form.role !== 'admin'`, `Settings.tsx:432`).

## Contrato de saída

- `hasPermission(permission)` (`frontend/src/contexts/AuthContext.tsx:53-59`): `role === 'admin' || role === 'super_admin'` → sempre `true` (bypass total, ignora o array `permissions`); qualquer outro role → `permissions?.includes(permission)`.
- `Sidebar` (`frontend/src/components/Sidebar.tsx:119`) filtra cada item de menu por `!item.permission || hasPermission(item.permission)` — é o único lugar do sistema que usa `hasPermission` para ocultar algo.

## Limites e cotas

- O select de `role` no formulário de usuário nunca oferece `super_admin` como opção (`Settings.tsx:426-429`, valores fixos `admin/secretary/teacher`) — decisão deliberada da OC-2026-0003 para impedir criação acidental via UI.
- O checkbox de módulos só aparece quando `role !== 'admin'` (`Settings.tsx:432`) — hoje não há UI para restringir um usuário `admin`, porque a checagem de permissão nem é aplicada a ele (`hasPermission` sempre `true` para admin).

## Erros conhecidos e tratamento

- NÃO DOCUMENTADO — não há tratamento de erro específico de permissão no frontend além do redirecionamento padrão de rota protegida (fora do escopo desta área).

## Riscos para a nossa implementação

1. Se a F2 decidir que módulos devem poder ser restritos também para `admin` (não só `secretary`/`teacher`), o formulário precisa parar de esconder o checkbox de permissões quando `role === 'admin'`, e `hasPermission` precisa parar de dar bypass automático para `admin`.
2. Hoje não existe nenhuma tela para o super_admin gerenciar isso de forma diferenciada de um admin comum — a tela de Configurações > Usuários é a mesma para quem estiver logado, e o controle de quem PODE abrir essa tela é só `require_role("admin")` no backend (que, por sua vez, também deixa `secretary`/`teacher` de fora, mas deixa QUALQUER admin entrar).
3. `permissions` readonly na exibição da tabela de usuários (`Settings.tsx:340-354`) já mostra os módulos escolhidos, ou "Todos" quando a lista é vazia/nula — esse texto "Todos" hoje também aparece para um `admin` mesmo sem nunca ter marcado nada, porque para admin a ausência de `permissions` é interpretada como acesso irrestrito (consistente com `hasPermission`).

## Fonte

- `frontend/src/pages/Settings.tsx` (linhas 10-25, 340-440) — lido nesta sessão, 2026-09-05
- `frontend/src/contexts/AuthContext.tsx` (linhas 53-59) — lido nesta sessão, 2026-09-05
- `frontend/src/components/Sidebar.tsx` (linhas 12-48, 117-120) — lido integralmente nesta sessão, 2026-09-05
