# Tasks — Sprint 03

> Um bloco por task. Na execução (F6), a linha `status` é atualizada em cada transição; ao concluir, acrescente data e resultado da suíte.

---

```yaml
id: T-03.01
titulo: Tipos ClassGroup, Evaluation e auxiliares
status_atual: concluida · 2026-08-30 · suíte: tsc --noEmit limpo (0 erros) + vitest 10 passed / 0 failed
objetivo: Definir em types/index.ts os tipos ClassGroup, Evaluation e auxiliares (Teacher, AttendanceRecord, Certificate, Boletim) usados pelas 5 páginas órfãs, seguindo o padrão das interfaces existentes (D-04).
arquivos:
  cria: []
  altera: [frontend/src/types/index.ts]
teste_integracao: `tsc --noEmit` em frontend/ não reporta mais erro de import ClassGroup/Evaluation nas páginas.
teste_funcional: rodar `tsc --noEmit` em frontend/ termina sem erros de tipo para os novos tipos.
criterio_aceite: tsc --noEmit sem erros de ClassGroup/Evaluation; tipos exportados e consumíveis.
depende_de: [T-01.02]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-03.02
titulo: Grupos de API ausentes (7 grupos)
status_atual: concluida · 2026-08-30 · suíte: tsc --noEmit limpo (0 erros) + vitest 10 passed / 0 failed
objetivo: Criar teachersAPI, classesAPI, attendanceAPI, evaluationsAPI, weightConfigAPI, boletinsAPI e certificatesAPI em services/api.ts, com endpoints mapeados em base/02-api-rotas.md e axios no padrão do arquivo (D-04).
arquivos:
  cria: []
  altera: [frontend/src/services/api.ts]
teste_integracao: `tsc --noEmit` em frontend/ não reporta mais erro de import dos 7 grupos nas páginas órfãs.
teste_funcional: rodar `tsc --noEmit` em frontend/ termina sem erros de tipo para os novos grupos.
criterio_aceite: os 7 grupos exportados e tipados; tsc --noEmit sem erros desses imports.
depende_de: [T-03.01]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-03.03
titulo: Rotas e permissões no App.tsx + Header corrigido
status_atual: concluida · 2026-08-30 · suíte: vitest 10 passed / 0 failed (inclui App.test.tsx de roteamento) · fix MÉDIA auditoria: Sidebar com 5 entradas, ALL_PERMISSIONS + 5 chaves de permissão em Settings; Header com títulos
objetivo: Registrar /classes, /attendance, /evaluations, /boletins e /certificates com PermissionRoute e permissões novas (classes, attendance, evaluations, boletins, certificates); corrigir a entrada /classes do Header.tsx:11.
arquivos:
  cria: []
  altera: [frontend/src/App.tsx, frontend/src/components/Header.tsx]
teste_integracao: render do App com MemoryRouter apontando para /classes e usuário com permissão classes exibe o conteúdo da página Classes sem redirect.
teste_funcional: rodar `vitest run` em frontend/ termina verde com o teste de roteamento passando.
criterio_aceite: as 5 rotas acessíveis por usuário com permissão e bloqueadas sem permissão (redirect); Header sem rota morta; vitest verde.
depende_de: [T-03.04, T-03.05]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-03.04
titulo: Corrigir páginas Classes e Attendance
status_atual: concluida · 2026-08-30 · suíte: vitest 10 passed / 0 failed · teste de render criado na própria task (ajuste MÉDIA auditoria: cria em __tests__)
objetivo: Substituir os imports quebrados de Classes.tsx e Attendance.tsx pelos grupos/tipos criados, mantendo o layout existente (D-04).
arquivos:
  cria: [frontend/src/pages/__tests__/classes.test.tsx, frontend/src/pages/__tests__/attendance.test.tsx]
  altera: [frontend/src/pages/Classes.tsx, frontend/src/pages/Attendance.tsx]
teste_integracao: render das duas páginas com mocks dos grupos de API não lança exceção e exibe elementos esperados (título da página).
teste_funcional: rodar `vitest run` em frontend/ termina verde com os testes das duas páginas passando.
criterio_aceite: Classes.tsx e Attendance.tsx compilam (tsc --noEmit) e renderizam no teste sem erro.
depende_de: [T-03.02]
paralelizavel: true
status: concluida
```

---

```yaml
id: T-03.05
titulo: Corrigir páginas Evaluations, Boletim e Certificates
status_atual: concluida · 2026-08-30 · suíte: vitest 10 passed / 0 failed · teste de render criado na própria task (ajuste MÉDIA auditoria: cria em __tests__)
objetivo: Substituir os imports quebrados de Evaluations.tsx, Boletim.tsx e Certificates.tsx pelos grupos/tipos criados, mantendo o layout existente (D-04).
arquivos:
  cria: [frontend/src/pages/__tests__/evaluations.test.tsx, frontend/src/pages/__tests__/boletim.test.tsx, frontend/src/pages/__tests__/certificates.test.tsx]
  altera: [frontend/src/pages/Evaluations.tsx, frontend/src/pages/Boletim.tsx, frontend/src/pages/Certificates.tsx]
teste_integracao: render das três páginas com mocks dos grupos de API não lança exceção e exibe elementos esperados (título da página).
teste_funcional: rodar `vitest run` em frontend/ termina verde com os testes das três páginas passando.
criterio_aceite: as 3 páginas compilam (tsc --noEmit) e renderizam no teste sem erro.
depende_de: [T-03.02]
paralelizavel: true
status: concluida
```

---

```yaml
id: T-03.06
titulo: Suíte vitest das 5 páginas reativadas
status_atual: concluida · 2026-08-30 · suíte: vitest 10 passed / 0 failed (7 arquivos) · reset do cache do useSettings entre testes implementado
objetivo: Consolidar os testes das 5 páginas (criados em T-03.04/T-03.05) com mocks automatizados e reset do cache do useSettings entre testes.
arquivos:
  cria: []
  altera: []
teste_integracao: cada teste renderiza a página com mocks de API e assere elementos-chave (título, lista de dados fake).
teste_funcional: rodar `vitest run` em frontend/ termina verde com as 5 suítes passando.
criterio_aceite: 5 arquivos de teste criados, vitest verde com 0 failed.
depende_de: [T-03.03]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-03.07
titulo: Build limpo (tsc + vite)
status_atual: concluida · 2026-08-30 · build: npm run build exit 0 (tsc && vite build, 1m15s) · dist/index.html gerado · único aviso: chunk >500 kB (pré-existente, não bloqueia)
objetivo: Garantir que `npm run build` (tsc && vite build) conclui sem erros após todas as correções das páginas órfãs (D-12 critério de build limpo).
arquivos:
  cria: []
  altera: []
teste_integracao: executar `npm run build` em frontend/ e asserir dist/ gerado com index.html presente.
teste_funcional: rodar `npm run build` em frontend/ termina com código de saída 0.
criterio_aceite: build frontend conclui com saída 0 e gera dist/.
depende_de: [T-03.06]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-03.08
titulo: Checklist manual do fluxo E2E no navegador
status_atual: concluida · 2026-08-30 · checklist manual preenchido (todas as etapas validado) · suíte: validação manual no navegador — 0 erros de console em todas as telas; boletim PDF e certificado PDF respondem 200 via API
objetivo: Rodar backend e frontend localmente (start.bat/start.ps1 ou uvicorn+vite), autenticar como admin e executar o fluxo completo da D-12 nas telas, marcando cada etapa no checklist (D-16).
arquivos:
  cria: [docs/analise-sistema/sprint-03/checklist-e2e-manual.md]
  altera: []
teste_integracao: fluxo executado no navegador gera frequência, avaliações, boletim PDF e certificado PDF visíveis na interface.
teste_funcional: seguir o checklist com usuário admin local; cada etapa valida o resultado correspondente na tela.
criterio_aceite: checklist preenchido com as etapas do fluxo E2E marcadas como validado; nenhuma etapa pendente.
depende_de: [T-02.07, T-03.07]
paralelizavel: false
status: concluida
```