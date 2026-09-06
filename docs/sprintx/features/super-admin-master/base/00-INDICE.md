---
expx_schema: 1
expx_tool: sprintx
kind: base_indice
trabalho_id: super-admin-master
atualizado_em: 2026-09-05
areas:
  - arquivo: 01-auth-backend.md
    titulo: Autenticacao roles e gestao de usuarios backend
    lacunas: 0
  - arquivo: 02-permissoes-frontend.md
    titulo: Permissoes por modulo e gestao de usuarios frontend
    lacunas: 0
  - arquivo: 03-testes-convencoes.md
    titulo: Convencoes de teste do projeto
    lacunas: 0
  - arquivo: 04-contexto-historico-super-admin.md
    titulo: Contexto historico introducao do super admin
    lacunas: 0
---

# Índice da base — super-admin-master

| Arquivo | Área | Resumo |
|---|---|---|
| `01-auth-backend.md` | Autenticação, roles e gestão de usuários (backend) | Mapeia `require_role`, rotas de `/auth/users` e `/auth/register`; achado central: bug que impede super_admin de criar usuário, e ausência total de validação de `permissions` no backend |
| `02-permissoes-frontend.md` | Permissões por módulo e gestão de usuários (frontend) | `ALL_PERMISSIONS`, `hasPermission`, filtragem do `Sidebar` e formulário de usuário em Configurações |
| `03-testes-convencoes.md` | Convenções de teste do projeto | Comandos, fixtures de backend (`client`, `db_session`, `auth_headers`, `admin_user`) e o padrão usado em `test_super_admin.py` |
| `04-contexto-historico-super-admin.md` | Contexto histórico — introdução do super_admin | Decisões D-08/D-09 já fechadas na OC-2026-0003 que criaram o role `super_admin` |

Lacunas registradas: ver `00-LACUNAS.md` (2 lacunas, nenhuma bloqueante).
