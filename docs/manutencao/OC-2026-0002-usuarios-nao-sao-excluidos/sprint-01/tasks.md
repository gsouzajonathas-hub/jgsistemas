---
expx_schema: 1
expx_tool: runx
kind: tasks
trabalho_id: OC-2026-0002
sprint_id: sprint-01
atualizado_em: 2026-09-04
tasks:
  - id: T-01.01
    titulo: Teste de regressao - exclusao de usuario com historico de auditoria
    fase: F-01.1
    status: concluida
    objetivo: Fixar via teste o comportamento esperado do DELETE de usuario com historico antes de qualquer implementacao
    arquivos:
      cria: [backend/tests/test_user_delete_regression.py]
      altera: []
    teste_regressao: Usuario com registro em audit_logs (historico de login/ações) e excluido via DELETE /api/auth/users/{id} retornando 200 e sumindo do banco; hoje retorna 500 (IntegrityError - FK sem ondelete)
    teste_integracao: TestClient com banco SQLite temporario e PRAGMA foreign_keys=ON (espelha o Postgres), fixture cria usuario com AuditLog, DELETE no endpoint e SELECT confirma remocao
    teste_funcional: DELETE /api/auth/users/{id} para usuario com historico retorna {"message": "Usuario excluido com sucesso"} e a lista posterior nao contem o usuario
    criterio_aceite: O teste falha (vermelho) com o codigo atual e passa (verde) apos T-01.02 sem alterar o teste
    depende_de: []
    paralelizavel: false
    concluida_em: 2026-09-04
    suite: verde
  - id: T-01.02
    titulo: Fix delete_user (limpeza de dependencias) + ondelete nos models + guarda do ultimo admin
    fase: F-01.1
    status: concluida
    objetivo: Eliminar o IntegrityError no backend e bloquear a exclusao do ultimo admin ativo
    arquivos:
      cria: [backend/tests/test_user_delete_extra.py]
      altera: [backend/app/routes/auth.py, backend/app/models/audit_log.py, backend/app/models/communication.py]
    teste_regressao: null
    teste_integracao: test_user_delete_extra.py cobre: usuario SEM historico (delete ok), usuario COM communication_logs (sent_by vira NULL e registro permanece), exclusao do ultimo admin ativo (400) e auto-exclusao (400 ja existente)
    teste_funcional: Admin exclui usuario com historico pela API e recebe 200; tenta excluir o ultimo admin ativo e recebe 400 com mensagem clara
    criterio_aceite: Suite backend inteira verde (49 atuais + regressao T-01.01 + extras T-01.02); audit_logs e communication_logs preservados com user_id/sent_by NULL; ultimo admin ativo protegido
    depende_de: [T-01.01]
    paralelizavel: false
    concluida_em: 2026-09-04
    suite: verde
  - id: T-01.03
    titulo: Criar componente ConfirmDialog reutilizavel + teste
    fase: F-01.2
    status: concluida
    objetivo: Entregar o modal de confirmacao de exclusao (mensagem + botao vermelho/amarelo + cancelar) pedido pelo usuario
    arquivos:
      cria: [frontend/src/components/ConfirmDialog.tsx, frontend/src/components/__tests__/ConfirmDialog.test.tsx]
      altera: []
    teste_regressao: null
    teste_integracao: ConfirmDialog.test.tsx monta o componente e valida: mensagem e titulo renderizados, botao de confirmacao com texto e classe de cor (red/amber), clicar em Cancelar chama onCancel, clicar em confirmar chama onConfirm, nao renderiza nada quando open=false
    teste_funcional: Na UI, clicar em "Excluir" qualquer item abre o modal com a mensagem do item e a segunda chance - Cancelar fecha sem chamar a API, confirmar executa a exclusao
    criterio_aceite: ConfirmDialog renderiza apenas quando open=true, exibe titulo/mensagem, botao de acao em vermelho (destrutivo) ou amarelo (aviso), e os callbacks onConfirm/onCancel disparam corretamente
    depende_de: [T-01.02]
    paralelizavel: false
    concluida_em: 2026-09-04
    suite: verde
  - id: T-01.04
    titulo: Aplicar ConfirmDialog + try/catch no Settings.tsx (usuarios) + teste
    fase: F-01.2
    status: concluida
    objetivo: Corrigir o sintoma relatado - exclusao de usuario em Configuracoes com confirmacao em modal e sem falha silenciosa
    arquivos:
      cria: [frontend/src/pages/__tests__/Settings.test.tsx]
      altera: [frontend/src/pages/Settings.tsx]
    teste_regressao: null
    teste_integracao: Settings.test.tsx (padrao de Classes.test.tsx com authAPI mockado): clicar Excluir abre o ConfirmDialog; Cancelar nao chama authAPI.deleteUser; confirmar chama deleteUser e remove da lista; deleteUser rejeitando dispara o alerta de erro (try/catch)
    teste_funcional: Na UI Configurações > Usuarios, admin clica Excluir e ve a tela de confirmacao; confirma e o usuario some; se o backend falhar, aparece mensagem de erro
    criterio_aceite: handleDeleteUser usa ConfirmDialog + try/catch; nenhum window.confirm restante em Settings; teste novo verde e nenhum teste existente quebra
    depende_de: [T-01.03]
    paralelizavel: false
    concluida_em: 2026-09-04
    suite: verde
  - id: T-01.05
    titulo: Aplicar ConfirmDialog nas demais telas com exclusao destrutiva
    fase: F-01.2
    status: concluida
    objetivo: Atender o pedido "toda vez que excluir algum usuario ou qualquer opcao importante" - substituir window.confirm e botoes inline Sim pelas telas de confirmacao
    arquivos:
      cria: []
      altera: [frontend/src/pages/Carnes.tsx, frontend/src/pages/Contratos.tsx, frontend/src/pages/Planos.tsx, frontend/src/pages/Evaluations.tsx, frontend/src/pages/Financial.tsx, frontend/src/pages/Schedule.tsx, frontend/src/pages/Courses.tsx, frontend/src/pages/Teachers.tsx, frontend/src/pages/Students.tsx, frontend/src/pages/Classes.tsx]
    teste_regressao: null
    teste_integracao: Suite existente continua verde (Classes/Courses/Teachers/Evaluations tem testes que exercitam as acoes de exclusao - passam a exercitar o ConfirmDialog; 2 testes ajustados: botao Sim para Sim, excluir)
    teste_funcional: Em cada tela (Carnes, Contratos, Planos, Avaliacoes, Financeiro, Agenda, Cursos, Professores, Alunos, Turmas) clicar em excluir abre a tela de confirmacao com botao vermelho/amarelo e segunda chance
    criterio_aceite: Nenhum window.confirm restante no frontend; todas as exclusoes destrutivas passam pelo ConfirmDialog; suite frontend inteira verde
    depende_de: [T-01.04]
    paralelizavel: false
    concluida_em: 2026-09-04
    suite: verde
  - id: T-01.06
    titulo: Suite completa (backend + frontend), build, commit e push
    fase: F-01.3
    status: concluida
    objetivo: Provar que nada quebrou, fechar a sprint e gravar/empurrar o fix na main
    arquivos:
      cria: []
      altera: []
    teste_regressao: null
    teste_integracao: pytest (backend) e vitest (frontend) inteiros - nenhum teste existente quebrou com as mudancas das tasks anteriores
    teste_funcional: npm run build (tsc && vite build) termina com exit 0 no frontend e o commit com os artefatos da ocorrencia esta na main e pushado em origin/main
    criterio_aceite: pytest 0 failed (49+novos), vitest 0 failed (23+novos), npm run build exit 0, commit e push ok, escopo respeitado (nenhum arquivo fora de 01-CAUSA-RAIZ.md + tasks.md alterado)
    depende_de: [T-01.02, T-01.05]
    paralelizavel: false
    concluida_em: 2026-09-04
    suite: verde
---

> Os campos da lista `tasks:` sao EXATAMENTE os do Contrato da Task do SKILL.md, mais `fase`, `concluida_em` e `suite`. `teste_regressao` so e preenchido na primeira task da primeira fase quando o tipo e `bug`; nas demais e `null`, com a chave presente. YAML e prosa carregam a mesma verdade e sao atualizados juntos.

> Frontmatter obrigatorio (expx-schema v1). Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

# Tasks — Sprint 01

> Um bloco por task. Repita o bloco abaixo para cada task da sprint, preenchendo TODOS os campos — nenhum é opcional. O único campo condicional é `teste_regressao`, que existe apenas na PRIMEIRA task da PRIMEIRA fase. Na execução (E3), a linha `status` é atualizada em cada transição; ao concluir, acrescente data e resultado da suíte.

---

## Primeira task da primeira fase — sempre o teste, antes de qualquer implementação

```yaml
id: T-01.01
titulo: Teste de regressao - exclusao de usuario com historico de auditoria
objetivo: Fixar via teste o comportamento esperado do DELETE de usuario com historico antes de qualquer implementacao
arquivos:
  cria: [backend/tests/test_user_delete_regression.py]
  altera: []
teste_regressao: Usuario com registro em audit_logs e excluido via DELETE /api/auth/users/{id} retornando 200 e sumindo do banco; hoje retorna 500 (IntegrityError - FK sem ondelete)
teste_integracao: TestClient com banco SQLite temporario e PRAGMA foreign_keys=ON (espelha o Postgres), fixture cria usuario com AuditLog, DELETE no endpoint e SELECT confirma remocao
teste_funcional: DELETE /api/auth/users/{id} para usuario com historico retorna {"message": "Usuario excluido com sucesso"} e a lista posterior nao contem o usuario
criterio_aceite: O teste falha (vermelho) com o codigo atual e passa (verde) apos T-01.02 sem alterar o teste
depende_de: []
paralelizavel: false
status: em_andamento
suite: vermelha
```

---

> **T-01.01 — ESCRITO E EXECUTADO NO E1 (2026-09-04, suite: VERMELHA).** Resultado da execução:
>
> ```
> E sqlalchemy.exc.IntegrityError: (sqlite3.IntegrityError) FOREIGN KEY constraint failed
> E [SQL: DELETE FROM users WHERE users.id = ?]
> FAILED tests/test_user_delete_regression.py::test_delete_usuario_com_historico — 1 failed in 9.68s
> ```
>
> Prova comprovada da causa raiz. O teste NÃO é alterado no E3 — apenas o código (T-01.02) muda até ele ficar verde.

---

## Demais tasks

```yaml
id: T-01.02
titulo: Fix delete_user (limpeza de dependencias) + ondelete nos models + guarda do ultimo admin
objetivo: Eliminar o IntegrityError no backend e bloquear a exclusao do ultimo admin ativo
arquivos:
  cria: [backend/tests/test_user_delete_extra.py]
  altera: [backend/app/routes/auth.py, backend/app/models/audit_log.py, backend/app/models/communication.py]
teste_integracao: test_user_delete_extra.py cobre: usuario SEM historico (delete ok), usuario COM communication_logs (sent_by vira NULL e registro permanece), exclusao do ultimo admin ativo (400) e auto-exclusao (400 ja existente)
teste_funcional: Admin exclui usuario com historico pela API e recebe 200; tenta excluir o ultimo admin ativo e recebe 400 com mensagem clara
criterio_aceite: Suite backend inteira verde (49 atuais + regressao T-01.01 + extras T-01.02); audit_logs e communication_logs preservados com user_id/sent_by NULL; ultimo admin ativo protegido
depende_de: [T-01.01]
paralelizavel: false
status: pendente
```

---

```yaml
id: T-01.03
titulo: Criar componente ConfirmDialog reutilizavel + teste
objetivo: Entregar o modal de confirmacao de exclusao (mensagem + botao vermelho/amarelo + cancelar) pedido pelo usuario
arquivos:
  cria: [frontend/src/components/ConfirmDialog.tsx, frontend/src/components/__tests__/ConfirmDialog.test.tsx]
  altera: []
teste_integracao: ConfirmDialog.test.tsx monta o componente e valida: mensagem e titulo renderizados, botao de confirmacao com texto e classe de cor (red/amber), clicar em Cancelar chama onCancel, clicar em confirmar chama onConfirm, nao renderiza nada quando open=false
teste_funcional: Na UI, clicar em "Excluir" qualquer item abre o modal com a mensagem do item e a segunda chance - Cancelar fecha sem chamar a API, confirmar executa a exclusao
criterio_aceite: ConfirmDialog renderiza apenas quando open=true, exibe titulo/mensagem, botao de acao em vermelho (destrutivo) ou amarelo (aviso), e os callbacks onConfirm/onCancel disparam corretamente
depende_de: [T-01.02]
paralelizavel: false
status: pendente
```

---

```yaml
id: T-01.04
titulo: Aplicar ConfirmDialog + try/catch no Settings.tsx (usuarios) + teste
objetivo: Corrigir o sintoma relatado - exclusao de usuario em Configuracoes com confirmacao em modal e sem falha silenciosa
arquivos:
  cria: [frontend/src/pages/__tests__/Settings.test.tsx]
  altera: [frontend/src/pages/Settings.tsx]
teste_integracao: Settings.test.tsx (padrao de Classes.test.tsx com authAPI mockado): clicar Excluir abre o ConfirmDialog; Cancelar nao chama authAPI.deleteUser; confirmar chama deleteUser e remove da lista; deleteUser rejeitando dispara o alerta de erro (try/catch)
teste_funcional: Na UI Configurações > Usuarios, admin clica Excluir e ve a tela de confirmacao; confirma e o usuario some; se o backend falhar, aparece mensagem de erro
criterio_aceite: handleDeleteUser usa ConfirmDialog + try/catch; nenhum window.confirm restante em Settings; teste novo verde e nenhum teste existente quebra
depende_de: [T-01.03]
paralelizavel: false
status: pendente
```

---

```yaml
id: T-01.05
titulo: Aplicar ConfirmDialog nas demais telas com exclusao destrutiva
objetivo: Atender o pedido "toda vez que excluir algum usuario ou qualquer opcao importante"
arquivos:
  cria: []
  altera: [frontend/src/pages/Carnes.tsx, frontend/src/pages/Contratos.tsx, frontend/src/pages/Planos.tsx, frontend/src/pages/Evaluations.tsx, frontend/src/pages/Financial.tsx, frontend/src/pages/Schedule.tsx, frontend/src/pages/Courses.tsx, frontend/src/pages/Teachers.tsx, frontend/src/pages/Students.tsx, frontend/src/pages/Classes.tsx]
teste_integracao: Suite existente continua verde (Classes/Courses/Teachers/Evaluations tem testes que exercitam as acoes de exclusao - passam a exercitar o ConfirmDialog)
teste_funcional: Em cada tela clicar em excluir abre a tela de confirmacao com botao vermelho/amarelo e segunda chance
criterio_aceite: Nenhum window.confirm restante no frontend; todas as exclusoes destrutivas passam pelo ConfirmDialog; suite frontend inteira verde
depende_de: [T-01.04]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-01.06
titulo: Suite completa (backend + frontend), build, commit e push
objetivo: Provar que nada quebrou, fechar a sprint e gravar/empurrar o fix na main
arquivos:
  cria: []
  altera: []
teste_integracao: pytest (backend) e vitest (frontend) inteiros - nenhum teste existente quebrou com as mudancas
teste_funcional: npm run build (tsc && vite build) termina com exit 0 no frontend e o commit com os artefatos da ocorrencia esta na main e pushado em origin/main
criterio_aceite: pytest 0 failed (49+novos), vitest 0 failed (23+novos), npm run build exit 0, commit e push ok, escopo respeitado
depende_de: [T-01.02, T-01.05]
paralelizavel: false
status: concluida
```