---
expx_schema: 1
expx_tool: sprintx
kind: tasks
trabalho_id: super-admin-master
sprint_id: sprint-04
atualizado_em: 2026-09-05
tasks:
  - id: T-04.01
    titulo: hasPermission com bypass exclusivo do super_admin
    fase: F-04.1
    status: concluida
    objetivo: Remover o bypass automatico de admin em hasPermission mantendo apenas super_admin com acesso irrestrito
    arquivos:
      cria: [frontend/src/contexts/__tests__/AuthContext.test.tsx]
      altera: [frontend/src/contexts/AuthContext.tsx]
    teste_integracao: hasPermission financial com role admin e permissions vazio retorna false hasPermission com role super_admin e permissions vazio retorna true
    teste_funcional: Um admin sem students em permissions chamando hasPermission students recebe false um super_admin sem nenhuma permission setada recebe true para qualquer modulo
    criterio_aceite: hasPermission da bypass total apenas para role igual super_admin qualquer outro role verifica permissions includes permission suite frontend verde
    depende_de: []
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-04.02
    titulo: Sidebar checa o modulo settings
    fase: F-04.1
    status: concluida
    objetivo: Declarar permission settings no item Configuracoes do menu lateral
    arquivos:
      cria: [frontend/src/components/__tests__/Sidebar.test.tsx]
      altera: [frontend/src/components/Sidebar.tsx]
    teste_integracao: Sidebar renderiza o item Configuracoes apenas quando hasPermission settings e verdadeiro
    teste_funcional: Um usuario sem settings em permissions nao ve o link Configuracoes no menu lateral um usuario com settings ve
    criterio_aceite: Item Configuracoes do navGroups declara permission settings teste confirma ocultacao e exibicao conforme a permissao suite frontend verde
    depende_de: []
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-04.03
    titulo: Settings.tsx modulos sempre visiveis e aba Usuarios exclusiva do super_admin
    fase: F-04.1
    status: concluida
    objetivo: Mostrar sempre os 15 checkboxes de modulo no formulario de usuario e restringir a aba Usuarios ao super_admin
    arquivos:
      cria: [frontend/src/pages/__tests__/Settings.adminComum.test.tsx]
      altera: [frontend/src/pages/Settings.tsx, frontend/src/pages/__tests__/Settings.test.tsx]
    teste_integracao: Com role admin selecionado no formulario os 15 checkboxes de modulo aparecem com user role diferente de super_admin logado a aba Usuarios nao e renderizada
    teste_funcional: Super_admin logado ve as abas Escola Usuarios e Aparencia e marca os 15 modulos ao criar um admin um admin comum logado nao ve a aba Usuarios
    criterio_aceite: Bloco de checkboxes deixa de checar form role diferente de admin ALL_PERMISSIONS local tem 15 itens a aba users so aparece quando user role igual super_admin suite frontend verde
    depende_de: []
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-04.04
    titulo: Suite completa build e commit
    fase: F-04.2
    status: concluida
    objetivo: Provar que nada quebrou e fechar a feature na main
    arquivos:
      cria: []
      altera: [frontend/src/App.test.tsx]
    teste_integracao: pytest backend e vitest frontend completos mais npm run build sem nenhuma regressao
    teste_funcional: Super_admin cria um secretary com apenas o modulo students liberado esse secretary loga ve so Alunos no menu e uma chamada direta a GET financial dashboard com o token dele retorna 403
    criterio_aceite: pytest 0 failed vitest 0 failed npm run build exit 0 commit na main com os artefatos da feature
    depende_de: [T-04.01, T-04.02, T-04.03]
    paralelizavel: false
    concluida_em: 2026-09-05
    suite: verde
---

> Um bloco por task. Preenchendo TODOS os campos. Na execução (F6), a linha `status` é atualizada em cada transição; ao concluir, acrescente data e resultado da suíte.

---

```yaml
id: T-04.01
titulo: hasPermission com bypass exclusivo do super_admin
objetivo: Remover o bypass automatico de admin em hasPermission mantendo apenas super_admin com acesso irrestrito
arquivos:
  cria: [frontend/src/contexts/__tests__/AuthContext.test.tsx]
  altera: [frontend/src/contexts/AuthContext.tsx]
teste_integracao: hasPermission financial com role admin e permissions vazio retorna false; hasPermission com role super_admin e permissions vazio retorna true
teste_funcional: Um admin sem students em permissions chamando hasPermission students recebe false; um super_admin sem nenhuma permission setada recebe true para qualquer modulo
criterio_aceite: hasPermission da bypass total apenas para role igual super_admin; qualquer outro role verifica permissions.includes(permission); suite frontend verde
depende_de: []
paralelizavel: true
status: concluida
```

> **T-04.01 — CONCLUÍDA (2026-09-05, suíte: 4 passed, 0 failed).**

---

```yaml
id: T-04.02
titulo: Sidebar checa o modulo settings
objetivo: Declarar permission settings no item Configuracoes do menu lateral
arquivos:
  cria: [frontend/src/components/__tests__/Sidebar.test.tsx]
  altera: [frontend/src/components/Sidebar.tsx]
teste_integracao: Sidebar renderiza o item Configuracoes apenas quando hasPermission settings e verdadeiro
teste_funcional: Um usuario sem settings em permissions nao ve o link Configuracoes no menu lateral; um usuario com settings ve
criterio_aceite: Item Configuracoes do navGroups declara permission settings; teste confirma ocultacao e exibicao conforme a permissao; suite frontend verde
depende_de: []
paralelizavel: true
status: concluida
```

> **T-04.02 — CONCLUÍDA (2026-09-05, suíte: 2 passed, 0 failed).**

---

```yaml
id: T-04.03
titulo: Settings.tsx modulos sempre visiveis e aba Usuarios exclusiva do super_admin
objetivo: Mostrar sempre os 15 checkboxes de modulo no formulario de usuario e restringir a aba Usuarios ao super_admin
arquivos:
  cria: [frontend/src/pages/__tests__/Settings.adminComum.test.tsx]
  altera: [frontend/src/pages/Settings.tsx, frontend/src/pages/__tests__/Settings.test.tsx]
teste_integracao: Com role admin selecionado no formulario os 15 checkboxes de modulo aparecem; com user.role diferente de super_admin logado, a aba Usuarios nao e renderizada
teste_funcional: Super_admin logado ve as abas Escola, Usuarios e Aparencia e marca os 15 modulos ao criar um admin; um admin comum logado nao ve a aba Usuarios
criterio_aceite: Bloco de checkboxes deixa de checar form.role !== 'admin'; ALL_PERMISSIONS local tem 15 itens; a aba 'users' so aparece quando user?.role === 'super_admin'; suite frontend verde
depende_de: []
paralelizavel: true
status: concluida
```

> **T-04.03 — CONCLUÍDA (2026-09-05, suíte: 8 passed, 0 failed (Settings.test.tsx + Settings.adminComum.test.tsx)).**

---

```yaml
id: T-04.04
titulo: Suite completa build e commit
objetivo: Provar que nada quebrou e fechar a feature na main
arquivos:
  cria: []
  altera: [frontend/src/App.test.tsx]
teste_integracao: pytest (backend) e vitest (frontend) completos, mais npm run build, sem nenhuma regressao
teste_funcional: Super_admin cria um secretary com apenas o modulo students liberado; esse secretary loga, ve so Alunos no menu, e uma chamada direta a GET /api/financial/dashboard com o token dele retorna 403
criterio_aceite: pytest 0 failed; vitest 0 failed; npm run build exit 0; commit na main com os artefatos da feature
depende_de: [T-04.01, T-04.02, T-04.03]
paralelizavel: false
status: concluida
```

> **T-04.04 — CONCLUÍDA (2026-09-05, suíte: backend 148 passed/0 failed; frontend 96-101 passed/0 failed — 5 testes não rodaram por instabilidade conhecida do worker no Windows, confirmados individualmente à parte; build exit 0).** Divergência: 3 testes pré-existentes em `App.test.tsx` assumiam que `admin` com `permissions: []` acessava `/classes`, `/courses` e `/teachers` sem restrição — corrigidos para incluir o módulo específico em `permissions`, refletindo D-02 (admin comum regulado por permissão).
