---
expx_schema: 1
expx_tool: runx
kind: tasks
trabalho_id: OC-2026-0004
sprint_id: sprint-01
atualizado_em: 2026-09-05
tasks:
  - id: T-01.01
    titulo: Teste da config de deploy
    fase: F-01.1
    status: concluida
    objetivo: Fixar o contrato da config de deploy antes de corrigir
    arquivos:
      cria: [frontend/src/__tests__/vercelConfig.test.ts]
      altera: []
    teste_regressao: Le frontend/vercel.json e valida os rewrites /api/:path* e /uploads/:path* para o Render e o fallback SPA /(.*) para /index.html — hoje o arquivo nao existe e o teste falha
    teste_integracao: O teste roda na suite (npm test em frontend/) e falha contra o estado atual
    teste_funcional: npm test -- vercelConfig falha no repo atual e passa apos o fix
    criterio_aceite: O teste falha antes do fix e passa depois
    depende_de: []
    paralelizavel: false
    concluida_em: 2026-09-05
    suite: 16 arquivos / 45 testes verdes (vitest run pool threads maxWorkers 2); tsc --noEmit OK
  - id: T-01.02
    titulo: Restaurar config de deploy
    fase: F-01.1
    status: concluida
    objetivo: Fazer a Vercel voltar a ler os rewrites e o fallback SPA
    arquivos:
      cria: [frontend/vercel.json]
      altera: [vercel.json]
    teste_regressao: null
    teste_integracao: A suite inteira (npm test em frontend/) roda verde com o teste de config validando o frontend/vercel.json
    teste_funcional: frontend/vercel.json existe com os 3 rewrites e vercel.json nao existe na raiz do repo
    criterio_aceite: npm test verde em frontend/ e vercel.json ausente na raiz
    depende_de: [T-01.01]
    paralelizavel: false
    concluida_em: 2026-09-05
    suite: 16 arquivos / 45 testes verdes (vitest run pool threads maxWorkers 2); tsc --noEmit OK
---

> Os campos da lista `tasks:` sao EXATAMENTE os do Contrato da Task do SKILL.md, mais `fase`, `concluida_em` e `suite`. `teste_regressao` so e preenchido na primeira task da primeira fase quando o tipo e `bug`; nas demais e `null`, com a chave presente. YAML e prosa carregam a mesma verdade e sao atualizados juntos.

> Frontmatter obrigatorio (expx-schema v1). Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

# Tasks — Sprint 1

> Um bloco por task. Repita o bloco abaixo para cada task da sprint, preenchendo TODOS os campos — nenhum é opcional, qualquer que seja o tamanho da ocorrência. O único campo condicional é `teste_regressao`, que existe apenas na PRIMEIRA task da PRIMEIRA fase. Na execução (E3), a linha `status` é atualizada em cada transição; ao concluir, acrescente data e resultado da suíte.

---

## Primeira task da primeira fase — sempre o teste, antes de qualquer implementação

```yaml
id: T-01.01
titulo: Teste da config de deploy
objetivo: Fixar o contrato da config de deploy antes de corrigir
arquivos:
  cria: [frontend/src/__tests__/vercelConfig.test.ts]
  altera: []
teste_regressao: Lê `frontend/vercel.json` e valida os rewrites `/api/:path*` e `/uploads/:path*` (→ Render) e o fallback SPA `/(.*)` → `/index.html` — hoje o arquivo não existe e o teste falha
teste_integracao: O teste roda na suíte (`npm test` em `frontend/`) e falha contra o estado atual
teste_funcional: `npm test -- vercelConfig` falha no repo atual e passa após o fix
criterio_aceite: O teste falha antes do fix e passa depois
depende_de: []
paralelizavel: false
status: concluida
concluida_em: 2026-09-05
suite: 16 arquivos / 45 testes verdes — vitest run com --pool=threads --maxWorkers=2; tsc --noEmit OK
```

---

## Demais tasks

```yaml
id: T-01.02
titulo: Restaurar config de deploy
objetivo: Fazer a Vercel voltar a ler os rewrites e o fallback SPA
arquivos:
  cria: [frontend/vercel.json]
  altera: [vercel.json]
teste_integracao: A suíte inteira (`npm test` em `frontend/`) roda verde com o teste de config validando o `frontend/vercel.json`
teste_funcional: `frontend/vercel.json` existe com os 3 rewrites e `vercel.json` não existe na raiz do repo
criterio_aceite: `npm test` verde em `frontend/` e `vercel.json` ausente na raiz
depende_de: [T-01.01]
paralelizavel: false
status: concluida
concluida_em: 2026-09-05
suite: 16 arquivos / 45 testes verdes — vitest run com --pool=threads --maxWorkers=2; tsc --noEmit OK
```