---
expx_schema: 1
expx_tool: sprintx
kind: fechamento
trabalho_id: super-admin-master
titulo: Super admin como master unico de usuarios e permissoes
tipo_trabalho: feature
fechado_em: 2026-09-05
modulo_afetado: [backend, frontend]
arquivos_alterados: [backend/tests/fixtures.py, backend/tests/test_fixtures_niveis_permissao.py, backend/tests/test_user_delete_extra.py, backend/app/utils/permissions.py, backend/tests/test_permissions_util.py, backend/tests/test_gestao_usuarios_master.py, backend/app/routes/auth.py, backend/tests/test_super_admin.py, backend/tests/test_user_delete_regression.py, backend/tests/test_migracao_permissions_admin.py, backend/alembic/versions/f85cb2a46b22_popula_permissions_admins_existentes.py, backend/app/routes/students.py, backend/app/routes/students_profile.py, backend/tests/test_enforcement_students.py, backend/app/routes/enrollments.py, backend/tests/test_enforcement_enrollments.py, backend/app/routes/courses.py, backend/tests/test_enforcement_courses.py, backend/app/routes/teachers.py, backend/tests/test_enforcement_teachers.py, backend/app/routes/classes.py, backend/tests/test_enforcement_classes.py, backend/app/routes/attendance.py, backend/tests/test_enforcement_attendance.py, backend/app/routes/evaluations.py, backend/app/routes/weight_config.py, backend/tests/test_enforcement_evaluations.py, backend/app/routes/boletins.py, backend/tests/test_enforcement_boletins.py, backend/app/routes/certificates.py, backend/tests/test_enforcement_certificates.py, backend/app/routes/financial.py, backend/app/routes/carnes.py, backend/app/routes/materials.py, backend/tests/test_enforcement_financial.py, backend/app/routes/schedule.py, backend/tests/test_enforcement_schedule.py, backend/app/routes/reports.py, backend/tests/test_enforcement_reports.py, backend/app/routes/audit.py, backend/tests/test_enforcement_audit.py, backend/app/routes/settings.py, backend/tests/test_enforcement_settings.py, frontend/src/contexts/AuthContext.tsx, frontend/src/contexts/__tests__/AuthContext.test.tsx, frontend/src/components/Sidebar.tsx, frontend/src/components/__tests__/Sidebar.test.tsx, frontend/src/pages/Settings.tsx, frontend/src/pages/__tests__/Settings.test.tsx, frontend/src/pages/__tests__/Settings.adminComum.test.tsx, frontend/src/App.test.tsx]
palavras_chave: [super_admin, permissoes, master, usuarios, autorizacao, modulos, enforcement, rbac]
resumo: O super_admin passa a ser o unico usuario com poder total e irrestrito sobre usuarios e permissoes; admin comum vira regulavel por modulo como qualquer outro papel, e a ocultacao de modulo passa a ser bloqueada de verdade no backend, nao so visual
decisao_principal: "D-01/D-02: somente super_admin gerencia usuarios (criar, editar, excluir, definir permissoes); admin comum passa a ser regulavel por permissao de modulo igual secretary/teacher, so super_admin mantem bypass automatico total"
risco_residual: "backend/app/routes/backup.py e communication.py continuam usando require_role puro (fora dos 15 modulos declarados, registrado como achado BAIXA em 00-AUDITORIA.md); o caminho critico declarado no ORQUESTRADOR.md cita uma dependencia (T-02.03 antes de T-03.01) que os campos depende_de das tasks nao sustentam (achado MEDIA da auditoria, nao corrigido apos a execucao)"
testes_adicionados: 80
---

# Fechamento — super-admin-master

## O que foi entregue

O sistema agora tem um único "master" de verdade: só a conta `super_admin` cria, edita e exclui usuários e define quais dos 15 módulos cada um pode usar — corrigindo também um bug que impedia o próprio `super_admin` de criar usuários. Um `admin` comum deixou de ter acesso automático a tudo: agora ele só acessa os módulos que o `super_admin` liberar para ele, exatamente como secretaria e professor. E o mais importante: ocultar um módulo para alguém agora bloqueia de verdade no backend (403), não só esconde o item do menu — antes, quem soubesse a URL da API continuava acessando os dados normalmente.

## Decisão principal

D-01/D-02 (`00-DECISOES.md`): somente `super_admin` gerencia usuários; `admin` comum passa a ser regulável por permissão de módulo, sem bypass automático. Foi a decisão de maior impacto porque obrigou a atualizar a fixture de teste `admin_user`, compartilhada por dezenas de testes de outras features, e a corrigir 9 testes pré-existentes que assumiam o comportamento antigo.

## Risco residual

`backend/app/routes/backup.py` e `backend/app/routes/communication.py` continuam usando `require_role` puro — um `admin` comum ainda tem acesso irrestrito a essas duas rotas, porque `backup` e `comunicação` não fazem parte dos 15 módulos declarados em D-04 (fora do escopo desta feature, por decisão implícita — registrado como achado BAIXA em `00-AUDITORIA.md`). Também ficou uma imprecisão descritiva no `ORQUESTRADOR.md`: o `caminho_critico` cita uma dependência entre `T-02.03` e `T-03.01` que os campos `depende_de` reais das tasks não sustentam (achado MÉDIA da auditoria — não invalida a execução, mas o texto do orquestrador não bate 100% com o grafo real).

## Onde isto mexeu

- **Módulos:** backend, frontend
- **Arquivos:** 51 arquivos (ver `arquivos_alterados` no frontmatro deste arquivo e do `ORQUESTRADOR.md`) — 15 rotas de negócio, `auth.py`, `permissions.py` (novo), uma migração Alembic de dados, `AuthContext.tsx`, `Sidebar.tsx`, `Settings.tsx`, e os respectivos arquivos de teste
- **Testes adicionados:** 80 (71 backend + 9 frontend)
