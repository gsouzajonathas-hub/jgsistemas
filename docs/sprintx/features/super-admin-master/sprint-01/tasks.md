---
expx_schema: 1
expx_tool: sprintx
kind: tasks
trabalho_id: super-admin-master
sprint_id: sprint-01
atualizado_em: 2026-09-05
tasks:
  - id: T-01.01
    titulo: Fixtures de usuarios com niveis distintos de permissao
    fase: F-01.1
    status: concluida
    objetivo: Disponibilizar fixtures reutilizaveis de super_admin, admin com todos os modulos e admin sem nenhum modulo
    arquivos:
      cria: [backend/tests/test_fixtures_niveis_permissao.py]
      altera: [backend/tests/fixtures.py, backend/tests/test_user_delete_extra.py]
    teste_integracao: Um teste smoke autentica os tres usuarios das fixtures novas contra o TestClient e GET /api/auth/me devolve o role esperado de cada um
    teste_funcional: A fixture super_admin_headers autentica um usuario role super_admin; admin_headers_todos_modulos autentica um admin com os 13 modulos existentes em permissions; admin_headers_sem_modulos autentica um admin com permissions vazio
    criterio_aceite: As tres fixtures existem em backend/tests/fixtures.py e o teste smoke que as usa passa
    depende_de: []
    paralelizavel: false
    concluida_em: 2026-09-05
    suite: verde
  - id: T-01.02
    titulo: Utilitario require_permission e lista ALL_MODULES
    fase: F-01.1
    status: concluida
    objetivo: Criar a dependency que substituira require_role nas rotas de negocio checando o modulo nas permissions do usuario
    arquivos:
      cria: [backend/app/utils/permissions.py, backend/tests/test_permissions_util.py]
      altera: []
    teste_integracao: require_permission chamado com um User real de cada fixture da T-01.01 retorna o proprio usuario para super_admin e para quem tem o modulo, e levanta HTTPException 403 para quem nao tem
    teste_funcional: Dado um User com permissions igual a lista contendo dashboard e module_key igual financial, require_permission levanta 403; com financial na lista, retorna o user
    criterio_aceite: Suite verde cobrindo super_admin sempre passa, usuario com o modulo passa, usuario sem o modulo 403; ALL_MODULES tem exatamente 13 chaves (os modulos ja existentes; audit e settings entram na T-02.02)
    depende_de: [T-01.01]
    paralelizavel: false
    concluida_em: 2026-09-05
    suite: verde
---

> Um bloco por task. Preenchendo TODOS os campos. Na execução (F6), a linha `status` é atualizada em cada transição; ao concluir, acrescente data e resultado da suíte.

---

```yaml
id: T-01.01
titulo: Fixtures de usuarios com niveis distintos de permissao
objetivo: Disponibilizar fixtures reutilizaveis de super_admin, admin com todos os modulos e admin sem nenhum modulo
arquivos:
  cria: [backend/tests/test_fixtures_niveis_permissao.py]
  altera: [backend/tests/fixtures.py, backend/tests/test_user_delete_extra.py]
teste_integracao: Um teste smoke autentica os tres usuarios das fixtures novas contra o TestClient e GET /api/auth/me devolve o role esperado de cada um
teste_funcional: A fixture super_admin_headers autentica um usuario role super_admin; admin_headers_todos_modulos autentica um admin com os 13 modulos existentes em permissions; admin_headers_sem_modulos autentica um admin com permissions vazio
criterio_aceite: As tres fixtures existem em backend/tests/fixtures.py e o teste smoke que as usa passa
depende_de: []
paralelizavel: false
status: concluida
```

> **T-01.01 — CONCLUÍDA (2026-09-05, suíte: 80 passed, 0 failed).** Divergência do plano: as fixtures novas (`admin_headers_todos_modulos`/`admin_headers_sem_modulos`) criam usuários `role="admin"` ativos persistentes no banco de sessão compartilhado — isso quebrou `test_delete_ultimo_admin_ativo_bloqueado` (que assumia implicitamente ser o único admin ativo do banco). Corrigido tornando aquele teste robusto: desativa qualquer outro admin antes de testar a trava do "último admin ativo". Arquivo criado a mais (não previsto no plano original): `backend/tests/test_fixtures_niveis_permissao.py`, com o teste smoke. Também: o número de módulos usado é 13 (os já existentes), não 15 — `audit`/`settings` só existem a partir de T-02.02.

---

```yaml
id: T-01.02
titulo: Utilitario require_permission e lista ALL_MODULES
objetivo: Criar a dependency que substituira require_role nas rotas de negocio checando o modulo nas permissions do usuario
arquivos:
  cria: [backend/app/utils/permissions.py, backend/tests/test_permissions_util.py]
  altera: []
teste_integracao: require_permission chamado com um User real de cada fixture da T-01.01 retorna o proprio usuario para super_admin e para quem tem o modulo, e levanta HTTPException 403 para quem nao tem
teste_funcional: Dado um User com permissions igual a lista contendo dashboard e module_key igual financial, require_permission levanta 403; com financial na lista, retorna o user
criterio_aceite: Suite verde cobrindo super_admin sempre passa, usuario com o modulo passa, usuario sem o modulo 403; ALL_MODULES tem exatamente 13 chaves (os modulos ja existentes; audit e settings entram na T-02.02)
depende_de: [T-01.01]
paralelizavel: false
status: concluida
```

> **T-01.02 — CONCLUÍDA (2026-09-05, suíte: 4 passed, 0 failed — arquivo isolado; suíte completa do backend também verde).** Divergência: a contagem correta de módulos existentes é 13, não 12 como o plano dizia (a lista `ALL_PERMISSIONS`/`ALL_MODULES` tem 13 chaves reais, contadas a partir do código-fonte) — corrigido em toda a documentação do plano.

> Nota de implementação: `ALL_MODULES` nesta task nasce com os 13 módulos já existentes (`dashboard, students, enrollments, courses, teachers, classes, attendance, evaluations, boletins, certificates, financial, schedule, reports`) — `audit` e `settings` entram na T-02.02 (D-04), para não antecipar essa decisão fora de ordem. `require_permission(modulo)` segue a mesma assinatura de uso de `require_role` (retorna um `async def checker(current_user=Depends(get_current_user))`), fazendo bypass total para `current_user.role == "super_admin"` (D-02) e checando `modulo in json.loads(current_user.permissions or "[]")` para qualquer outro role, incluindo `admin`.
