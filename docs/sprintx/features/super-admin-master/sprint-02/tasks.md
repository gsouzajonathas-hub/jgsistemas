---
expx_schema: 1
expx_tool: sprintx
kind: tasks
trabalho_id: super-admin-master
sprint_id: sprint-02
atualizado_em: 2026-09-05
tasks:
  - id: T-02.01
    titulo: Super admin exclusivo na gestao de usuarios
    fase: F-02.1
    status: concluida
    objetivo: Restringir criacao edicao e exclusao de usuarios exclusivamente ao role super_admin corrigindo o bug que impedia o proprio super_admin de criar usuarios
    arquivos:
      cria: [backend/tests/test_gestao_usuarios_master.py]
      altera: [backend/app/routes/auth.py, backend/tests/test_super_admin.py, backend/tests/test_user_delete_extra.py, backend/tests/test_user_delete_regression.py]
    teste_integracao: POST auth register PUT auth users id e DELETE auth users id chamados com token de super_admin retornam sucesso chamados com token de admin comum retornam 403
    teste_funcional: Super_admin cria um usuario novo e o usuario aparece em GET auth users com 200 admin comum tentando a mesma chamada de criacao recebe 403 Acesso negado
    criterio_aceite: _optional_admin_user reconhece apenas role igual super_admin require_role admin vira require_role super_admin nas tres rotas de auth users teste de regressao do bug passa e teste de admin comum bloqueado passa
    depende_de: [T-01.01]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-02.02
    titulo: Incluir audit e settings nos modulos controlaveis
    fase: F-02.1
    status: concluida
    objetivo: Adicionar as chaves audit e settings a lista de modulos tanto no backend quanto no frontend totalizando 15
    arquivos:
      cria: []
      altera: [backend/app/utils/permissions.py, backend/tests/test_permissions_util.py, frontend/src/pages/Settings.tsx, frontend/src/pages/__tests__/Settings.test.tsx]
    teste_integracao: ALL_MODULES no backend e ALL_PERMISSIONS no frontend contem as chaves audit e settings junto com os 13 modulos existentes
    teste_funcional: Um teste backend confirma len de ALL_MODULES igual 15 com audit e settings presentes um teste frontend confirma que o formulario de usuario renderiza checkboxes para Auditoria e Configuracoes
    criterio_aceite: ALL_MODULES tem 15 chaves incluindo audit e settings ALL_PERMISSIONS no frontend tem 15 entradas incluindo as mesmas chaves suite backend e frontend verdes
    depende_de: [T-01.02]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-02.03
    titulo: Migracao popula permissoes dos admins existentes
    fase: F-02.2
    status: concluida
    objetivo: Garantir que todo usuario com role admin ja existente no banco receba automaticamente os 15 modulos sem perder acesso no deploy
    arquivos:
      cria: [backend/alembic/versions/f85cb2a46b22_popula_permissions_admins_existentes.py, backend/tests/test_migracao_permissions_admin.py]
      altera: []
    teste_integracao: Contra um banco com um usuario role admin e permissions nulo rodar alembic upgrade head deixa esse usuario com permissions contendo os 15 modulos
    teste_funcional: Apos a migracao GET auth users mostra o admin existente com os 15 modulos em permissions sem nenhuma edicao manual
    criterio_aceite: Revisao alembic nova aplica UPDATE em users set permissions com os 15 modulos where role igual admin and permissions is null upgrade head e downgrade rodam sem erro teste cobrindo o cenario passa
    depende_de: [T-02.02]
    paralelizavel: false
    concluida_em: 2026-09-05
    suite: verde
---

> Um bloco por task. Preenchendo TODOS os campos. Na execução (F6), a linha `status` é atualizada em cada transição; ao concluir, acrescente data e resultado da suíte.

---

```yaml
id: T-02.01
titulo: Super admin exclusivo na gestao de usuarios
objetivo: Restringir criacao edicao e exclusao de usuarios exclusivamente ao role super_admin corrigindo o bug que impedia o proprio super_admin de criar usuarios
arquivos:
  cria: [backend/tests/test_gestao_usuarios_master.py]
  altera: [backend/app/routes/auth.py]
teste_integracao: POST auth register PUT auth users id e DELETE auth users id chamados com token de super_admin retornam sucesso chamados com token de admin comum retornam 403
teste_funcional: Super_admin cria um usuario novo e o usuario aparece em GET auth users com 200 admin comum tentando a mesma chamada de criacao recebe 403 Acesso negado
criterio_aceite: _optional_admin_user reconhece apenas role igual super_admin require_role admin vira require_role super_admin nas tres rotas de auth users teste de regressao do bug passa e teste de admin comum bloqueado passa
depende_de: [T-01.01]
paralelizavel: true
status: concluida
```

> **T-02.01 — CONCLUÍDA (2026-09-05, suíte: 90 passed, 0 failed).** Divergência significativa de escopo: D-01 é uma mudança de comportamento que quebrou 9 testes pré-existentes que assumiam que qualquer `admin` podia gerenciar usuários (`test_super_admin.py`, `test_user_delete_extra.py`, `test_user_delete_regression.py`) — todos atualizados para usar `super_admin_headers` em vez de `auth_headers` nas chamadas de gestão de usuários, já que esse é exatamente o novo comportamento pretendido. `test_exclusao_de_super_admin_bloqueada` precisou de um segundo usuário `super_admin` como alvo (não o mesmo do token), para não colidir com a checagem de auto-exclusão. Também corrigida a mensagem de erro do bootstrap ("Apenas o super admin pode criar usuários").

> Nota de implementação: em `backend/app/routes/auth.py`, `_optional_admin_user` (linha 83) troca `user.role == "admin"` por `user.role == "super_admin"`; as três ocorrências de `Depends(require_role("admin"))` em `list_users`, `delete_user` e `update_user` (linhas 264, 284, 341) trocam para `Depends(require_role("super_admin"))`. O bypass interno de `require_role` para `super_admin` (`utils/auth.py:90-91`) mantém o comportamento correto sem mudança adicional.

---

```yaml
id: T-02.02
titulo: Incluir audit e settings nos modulos controlaveis
objetivo: Adicionar as chaves audit e settings a lista de modulos tanto no backend quanto no frontend totalizando 15
arquivos:
  cria: []
  altera: [backend/app/utils/permissions.py, backend/tests/test_permissions_util.py, frontend/src/pages/Settings.tsx, frontend/src/pages/__tests__/Settings.test.tsx]
teste_integracao: ALL_MODULES no backend e ALL_PERMISSIONS no frontend contem as chaves audit e settings junto com os 13 modulos existentes
teste_funcional: Um teste backend confirma len de ALL_MODULES igual 15 com audit e settings presentes um teste frontend confirma que o formulario de usuario renderiza checkboxes para Auditoria e Configuracoes
criterio_aceite: ALL_MODULES tem 15 chaves incluindo audit e settings ALL_PERMISSIONS no frontend tem 15 entradas incluindo as mesmas chaves suite backend e frontend verdes
depende_de: [T-01.02]
paralelizavel: true
status: concluida
```

> **T-02.02 — CONCLUÍDA (2026-09-05, suíte: backend 91 passed / frontend Settings.test.tsx 6 passed).** Também atualizou `test_permissions_util.py` (teste de T-01.02, que passa a validar 15 chaves em vez de 13 — esse teste descreve o estado ATUAL do sistema, não um congelamento histórico). O teste novo em `Settings.test.tsx` precisou de `getAllByText(...).length >= 2` para "Configurações", porque esse texto já existe em outro elemento da página.

---

```yaml
id: T-02.03
titulo: Migracao popula permissoes dos admins existentes
objetivo: Garantir que todo usuario com role admin ja existente no banco receba automaticamente os 15 modulos sem perder acesso no deploy
arquivos:
  cria: [backend/alembic/versions/f85cb2a46b22_popula_permissions_admins_existentes.py, backend/tests/test_migracao_permissions_admin.py]
  altera: []
teste_integracao: Contra um banco com um usuario role admin e permissions nulo rodar alembic upgrade head deixa esse usuario com permissions contendo os 15 modulos
teste_funcional: Apos a migracao GET auth users mostra o admin existente com os 15 modulos em permissions sem nenhuma edicao manual
criterio_aceite: Revisao alembic nova aplica UPDATE em users set permissions com os 15 modulos where role igual admin and permissions is null upgrade head e downgrade rodam sem erro teste cobrindo o cenario passa
depende_de: [T-02.02]
paralelizavel: false
status: concluida
```

> **T-02.03 — CONCLUÍDA (2026-09-05, suíte: 1 passed no teste isolado da migração; 91 passed na suíte completa).** O teste roda a migração de verdade via subprocesso Alembic contra um banco SQLite temporário próprio (não o compartilhado), simulando o cenário real: um admin pré-existente sem `permissions` ganha os 15 módulos, e um admin com `permissions` customizado (`["financial"]`) não é sobrescrito.

> Nota de implementação: `downgrade()` desta revisão não precisa reverter os dados (não há como saber quais admins tinham `permissions IS NULL` antes) — só precisa ser segura para rodar sem erro (no-op ou log). Condicionar sempre a `WHERE role = 'admin' AND permissions IS NULL`, nunca sobrescrever `permissions` de quem já tiver algo customizado.
