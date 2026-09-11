---
expx_schema: 1
expx_tool: runx
kind: fases
trabalho_id: OC-2026-0005
sprint_id: sprint-01
atualizado_em: 2026-09-10
fases:
  - id: F-01.1
    titulo: Verificacao e fechamento
    status: concluido
    criterio_saida: Testes de cascata e suite completa verdes
    paralelizavel: false
    paralela_com: []
    tasks: [T-01.01, T-01.02]
---

```mermaid
%% Grafo de tasks — sprint-01 — gerado pela runx a partir de tasks.md
flowchart LR
  subgraph fase_01_1["F-01.1 — Verificacao e fechamento"]
    T_01_01["T-01.01<br/>Confirma teste de…"]
    T_01_02["T-01.02<br/>Suite completa verde"]
  end
  T_01_01 --> T_01_02

  classDef concluida fill:#d4f4dd,stroke:#2e7d32,color:#1b3d20
  classDef andamento fill:#fff3cd,stroke:#b8860b,color:#4a3800
  classDef bloqueada fill:#f8d7da,stroke:#c62828,color:#4a1d1f
  classDef pendente  fill:#eceff1,stroke:#78909c,color:#263238
  classDef critico   stroke-width:3px
  classDef regressao fill:#ede4ff,stroke:#6a1b9a,color:#3d1a78,stroke-width:3px

  class T_01_01 concluida
  class T_01_02 concluida
  class T_01_01,T_01_02 critico
```

# Fases — Sprint 01 — OC-2026-0005

## F-01.1 — Verificação e fechamento

**Objetivo:** comprovar que o fix já presente no código (commit `a835e9f`) cobre o cenário
relatado, com o teste de regressão específico e a suíte completa verdes.

**Tasks:** T-01.01, T-01.02.

**Critério de saída:** os 7 testes de `test_exclusao_cascata.py` e a suíte completa do
backend passam, sem novo teste vermelho.

**Paralelismo:** nenhuma outra fase nesta sprint.
