---
expx_schema: 1
expx_tool: runx
kind: tasks
trabalho_id: OC-2026-0001
sprint_id: sprint-01
atualizado_em: 2026-09-04
tasks:
  - id: T-01.01
    titulo: Teste de regressao das rotas de Cursos e Professores
    fase: F-01.1
    status: concluida
    objetivo: Fixar via teste o comportamento esperado das rotas antes de qualquer implementacao
    arquivos:
      cria: []
      altera: [frontend/src/App.test.tsx]
    teste_regressao: Admin logado acessa /courses e /teachers e ve os titulos "Cursos" e "Professores"; hoje o App redireciona para / e o teste falha
    teste_integracao: App montado com admin no localStorage, navegacao para as duas rotas renderiza as paginas correspondentes (vitest e Testing Library)
    teste_funcional: Admin acessa a URL /courses na barra e ve a pagina Cursos em vez de ser redirecionado para o Dashboard
    criterio_aceite: Os casos novos falham (vermelho) com o codigo atual e passam (verde) apos T-01.02 a T-01.04 sem alterar o teste
    depende_de: []
    paralelizavel: false
    concluida_em: 2026-09-04
    suite: verde
  - id: T-01.02
    titulo: Criar pagina Courses.tsx com CRUD
    fase: F-01.1
    status: concluida
    objetivo: Entregar a tela de cursos que o produto nao tinha, seguindo o padrao de Classes.tsx
    arquivos:
      cria: [frontend/src/pages/Courses.tsx, frontend/src/pages/__tests__/Courses.test.tsx]
      altera: []
    teste_regressao: null
    teste_integracao: Courses.test.tsx mocka coursesAPI e valida titulo h1 "Cursos", lista mockada e acoes de criar/editar/excluir chamando list/create/update/delete
    teste_funcional: Na UI, admin cadastra o curso Ingles e ve a linha na lista; excluir curso sem turmas remove a linha e com turmas mostra o erro 400 do backend
    criterio_aceite: Courses.tsx lista via coursesAPI.list, cria/edita/exclui via create/update/delete com o payload do CourseSchema e mostra estado vazio com CTA quando a lista e vazia
    depende_de: [T-01.01]
    paralelizavel: false
    concluida_em: 2026-09-04
    suite: verde
  - id: T-01.03
    titulo: Criar pagina Teachers.tsx com CRUD
    fase: F-01.1
    status: concluida
    objetivo: Entregar a tela de professores que o produto nao tinha, seguindo o padrao de Classes.tsx
    arquivos:
      cria: [frontend/src/pages/Teachers.tsx, frontend/src/pages/__tests__/Teachers.test.tsx]
      altera: []
    teste_regressao: null
    teste_integracao: Teachers.test.tsx mocka teachersAPI e valida titulo h1 "Professores", lista mockada (teachersAPI.listAll) e acoes de criar/editar/excluir chamando listAll/create/update/delete
    teste_funcional: Na UI, admin cadastra o professor Ana Souza e ve a linha na lista; excluir professor sem turmas remove a linha e com turmas mostra o erro 400 do backend
    criterio_aceite: Teachers.tsx lista via teachersAPI.listAll, cria/edita/exclui via create/update/delete com o payload do TeacherSchema e mostra estado vazio com CTA quando a lista e vazia
    depende_de: [T-01.01]
    paralelizavel: false
    concluida_em: 2026-09-04
    suite: verde
  - id: T-01.04
    titulo: Registrar rotas, menu e permissoes de Cursos e Professores
    fase: F-01.1
    status: concluida
    objetivo: Expor as novas paginas no App, no menu lateral e no controle de permissoes
    arquivos:
      cria: []
      altera: [frontend/src/App.tsx, frontend/src/components/Sidebar.tsx, frontend/src/pages/Settings.tsx, frontend/src/App.test.tsx]
    teste_regressao: null
    teste_integracao: Casos de T-01.01 ficam verdes e novo caso em App.test.tsx valida que secretary sem a permissao teachers nao ve a pagina /teachers
    teste_funcional: Admin ve "Cursos" e "Professores" no menu lateral e navega para as paginas; em Configuracoes, um perfil de secretaria pode marcar as permissoes Cursos e Professores
    criterio_aceite: As rotas /courses e /teachers renderizam as paginas; o menu mostra os dois itens com permission courses e teachers; ALL_PERMISSIONS contem courses e teachers
    depende_de: [T-01.02, T-01.03]
    paralelizavel: false
    concluida_em: 2026-09-04
    suite: verde
  - id: T-01.05
    titulo: Suite completa, build e commit
    fase: F-01.2
    status: concluida
    objetivo: Provar que nada quebrou, fechar a sprint e gravar o fix na main
    arquivos:
      cria: []
      altera: []
    teste_regressao: null
    teste_integracao: Execucao da suite inteira (npm test no frontend) valida que nenhum teste existente quebrou com as mudancas
    teste_funcional: npm run build (tsc && vite build) termina com exit 0 no frontend e o commit com os artefatos da ocorrencia e gravado na main
    criterio_aceite: npm test termina com 0 failed, npm run build termina com exit 0 e o commit dos artefatos da ocorrencia esta na main
    depende_de: [T-01.01, T-01.02, T-01.03, T-01.04]
    paralelizavel: false
    concluida_em: 2026-09-04
    suite: verde
---

> Os campos da lista `tasks:` sao EXATAMENTE os do Contrato da Task do SKILL.md, mais `fase`, `concluida_em` e `suite`. `teste_regressao` so e preenchido na primeira task da primeira fase quando o tipo e `bug`; nas demais e `null`, com a chave presente. YAML e prosa carregam a mesma verdade e sao atualizados juntos.

> Frontmatter obrigatorio (expx-schema v1). Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

# Tasks — Sprint 01

> Um bloco por task. Repita o bloco abaixo para cada task da sprint, preenchendo TODOS os campos — nenhum é opcional, qualquer que seja o tamanho da ocorrência. O único campo condicional é `teste_regressao`, que existe apenas na PRIMEIRA task da PRIMEIRA fase. Na execução (E3), a linha `status` é atualizada em cada transição; ao concluir, acrescente data e resultado da suíte.

---

## Primeira task da primeira fase — sempre o teste, antes de qualquer implementação

```yaml
id: T-01.01
titulo: Teste de regressao das rotas de Cursos e Professores
objetivo: Fixar via teste o comportamento esperado das rotas antes de qualquer implementacao
arquivos:
  cria: []
  altera: [frontend/src/App.test.tsx]
teste_regressao: Admin logado acessa /courses e /teachers e ve os titulos "Cursos" e "Professores"; hoje o App redireciona para / e o teste falha
teste_integracao: App montado com admin no localStorage, navegacao para as duas rotas renderiza as paginas correspondentes (vitest e Testing Library)
teste_funcional: Admin acessa a URL /courses na barra e ve a pagina Cursos em vez de ser redirecionado para o Dashboard
criterio_aceite: Os casos novos falham (vermelho) com o codigo atual e passam (verde) apos T-01.02 a T-01.04 sem alterar o teste
depende_de: []
paralelizavel: false
status: em_andamento
```

---

> **T-01.01 — CONCLUÍDA (2026-09-04, suite: verde):** os casos de `/courses` e `/teachers` falharam (vermelho) antes de qualquer implementação e passaram sem alteração após T-01.02 a T-01.04.

---

## Demais tasks

```yaml
id: T-01.02
titulo: Criar pagina Courses.tsx com CRUD
objetivo: Entregar a tela de cursos que o produto nao tinha, seguindo o padrao de Classes.tsx
arquivos:
  cria: [frontend/src/pages/Courses.tsx, frontend/src/pages/__tests__/Courses.test.tsx]
  altera: []
teste_integracao: Courses.test.tsx mocka coursesAPI e valida titulo h1 "Cursos", lista mockada e acoes de criar/editar/excluir chamando list/create/update/delete
teste_funcional: Na UI, admin cadastra o curso Ingles e ve a linha na lista; excluir curso sem turmas remove a linha e com turmas mostra o erro 400 do backend
criterio_aceite: Courses.tsx lista via coursesAPI.list, cria/edita/exclui via create/update/delete com o payload do CourseSchema e mostra estado vazio com CTA quando a lista e vazia
depende_de: [T-01.01]
paralelizavel: false
status: concluida
concluida_em: 2026-09-04
suite: verde
```

---

```yaml
id: T-01.03
titulo: Criar pagina Teachers.tsx com CRUD
objetivo: Entregar a tela de professores que o produto nao tinha, seguindo o padrao de Classes.tsx
arquivos:
  cria: [frontend/src/pages/Teachers.tsx, frontend/src/pages/__tests__/Teachers.test.tsx]
  altera: []
teste_integracao: Teachers.test.tsx mocka teachersAPI e valida titulo h1 "Professores", lista mockada (teachersAPI.listAll) e acoes de criar/editar/excluir chamando listAll/create/update/delete
teste_funcional: Na UI, admin cadastra o professor Ana Souza e ve a linha na lista; excluir professor sem turmas remove a linha e com turmas mostra o erro 400 do backend
criterio_aceite: Teachers.tsx lista via teachersAPI.listAll, cria/edita/exclui via create/update/delete com o payload do TeacherSchema e mostra estado vazio com CTA quando a lista e vazia
depende_de: [T-01.01]
paralelizavel: false
status: concluida
concluida_em: 2026-09-04
suite: verde
```

---

```yaml
id: T-01.04
titulo: Registrar rotas, menu e permissoes de Cursos e Professores
objetivo: Expor as novas paginas no App, no menu lateral e no controle de permissoes
arquivos:
  cria: []
  altera: [frontend/src/App.tsx, frontend/src/components/Sidebar.tsx, frontend/src/pages/Settings.tsx, frontend/src/App.test.tsx]
teste_integracao: Casos de T-01.01 ficam verdes e novo caso em App.test.tsx valida que secretary sem a permissao teachers nao ve a pagina /teachers
teste_funcional: Admin ve "Cursos" e "Professores" no menu lateral e navega para as paginas; em Configuracoes, um perfil de secretaria pode marcar as permissoes Cursos e Professores
criterio_aceite: As rotas /courses e /teachers renderizam as paginas; o menu mostra os dois itens com permission courses e teachers; ALL_PERMISSIONS contem courses e teachers
depende_de: [T-01.02, T-01.03]
paralelizavel: false
status: concluida
concluida_em: 2026-09-04
suite: verde
```

---

```yaml
id: T-01.05
titulo: Suite completa, build e commit
objetivo: Provar que nada quebrou, fechar a sprint e gravar o fix na main
arquivos:
  cria: []
  altera: []
teste_integracao: Execucao da suite inteira (npm test no frontend) valida que nenhum teste existente quebrou com as mudancas
teste_funcional: npm run build (tsc && vite build) termina com exit 0 no frontend e o commit com os artefatos da ocorrencia e gravado na main
criterio_aceite: npm test termina com 0 failed, npm run build termina com exit 0 e o commit dos artefatos da ocorrencia esta na main
depende_de: [T-01.01, T-01.02, T-01.03, T-01.04]
paralelizavel: false
status: concluida
concluida_em: 2026-09-04
suite: verde
```

---

```yaml
id: T-01.05
titulo: Suite completa, build e commit
objetivo: Provar que nada quebrou, fechar a sprint e gravar o fix na main
arquivos:
  cria: []
  altera: []
teste_integracao: Execucao da suite inteira (npm test no frontend) valida que nenhum teste existente quebrou com as mudancas
teste_funcional: npm run build (tsc && vite build) termina com exit 0 no frontend e o commit com os artefatos da ocorrencia e gravado na main
criterio_aceite: npm test termina com 0 failed, npm run build termina com exit 0 e o commit dos artefatos da ocorrencia esta na main
depende_de: [T-01.01, T-01.02, T-01.03, T-01.04]
paralelizavel: false
status: pendente
```