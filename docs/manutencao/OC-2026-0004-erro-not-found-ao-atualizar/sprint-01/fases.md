---
expx_schema: 1
expx_tool: runx
kind: fases
trabalho_id: OC-2026-0004
sprint_id: sprint-01
atualizado_em: 2026-09-05
fases:
  - id: F-01.1
    titulo: Config de deploy restaurada
    status: concluida
    criterio_saida: Teste de regressao falha antes, passa depois; suite inteira verde (npm test em frontend/); vercel.json da raiz removido
    paralelizavel: false
    paralela_com: []
    tasks: [T-01.01, T-01.02]
---

> Frontmatter obrigatorio (expx-schema v1). Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

## Grafo de tasks

```mermaid
%% Grafo de tasks — sprint-01 — gerado pela runx a partir de tasks.md
flowchart LR
  subgraph fase_01_1["F-01.1 — Config de deploy restaurada"]
    T_01_01["T-01.01<br/>Teste da config de deploy"]
    T_01_02["T-01.02<br/>Restaurar config de deploy"]
  end
  T_01_01 --> T_01_02

  classDef concluida fill:#d4f4dd,stroke:#2e7d32,color:#1b3d20
  classDef andamento fill:#fff3cd,stroke:#b8860b,color:#4a3800
  classDef bloqueada fill:#f8d7da,stroke:#c62828,color:#4a1d1f
  classDef pendente  fill:#eceff1,stroke:#78909c,color:#263238
  classDef critico   stroke-width:3px
  classDef regressao fill:#ede4ff,stroke:#6a1b9a,color:#3d1a78,stroke-width:3px

  class T_01_01,T_01_02 concluida
  class T_01_01,T_01_02 critico
```

# Fases — Sprint 1

> Um bloco por fase. Repita o bloco quantas vezes forem necessárias. O paralelismo declarado aqui é definitivo: a execução nunca decide paralelismo sozinha.

---

## F-01.1 — Config de deploy restaurada

**Objetivo:** fazer a Vercel voltar a ler os rewrites e o fallback SPA dentro do root directory (`frontend/`).

**Tasks que a compõem:** T-01.01, T-01.02

**Critério de saída:** teste de regressão falha antes e passa depois; suíte inteira verde (`npm test` em `frontend/`); `vercel.json` da raiz removido.

**Roda em paralelo com:** nenhuma