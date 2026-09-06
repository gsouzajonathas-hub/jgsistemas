---
expx_schema: 1
expx_tool: sprintx
kind: fases
trabalho_id: super-admin-master
sprint_id: sprint-01
atualizado_em: 2026-09-05
fases:
  - id: F-01.1
    titulo: Harness de permissao
    status: concluido
    criterio_saida: require_permission cobre super_admin usuario com modulo e usuario sem modulo com suite verde
    paralelizavel: false
    paralela_com: []
    tasks: [T-01.01, T-01.02]
---

```mermaid
%% Grafo de tasks — sprint-01 — gerado pela sprintx a partir de tasks.md
flowchart LR
  subgraph fase_01_1["F-01.1 — Harness de permissao"]
    T_01_01["T-01.01<br/>Fixtures de niveis…"]
    T_01_02["T-01.02<br/>require_permission…"]
  end

  T_01_01 --> T_01_02

  classDef concluida fill:#d4f4dd,stroke:#2e7d32,color:#1b3d20
  classDef andamento fill:#fff3cd,stroke:#b8860b,color:#4a3800
  classDef bloqueada fill:#f8d7da,stroke:#c62828,color:#4a1d1f
  classDef pendente  fill:#eceff1,stroke:#78909c,color:#263238
  classDef critico   stroke-width:3px

  class T_01_01 concluida
  class T_01_02 concluida
  class T_01_01,T_01_02 critico
```

---

## F-01.1 — Harness de permissão

**Objetivo:** Entregar fixtures de usuários com níveis distintos de permissão e o utilitário `require_permission`, sem tocar nenhuma rota de negócio.

**Tasks que a compõem:** T-01.01, T-01.02

**Critério de saída:** `require_permission("financial")` retorna o usuário para `super_admin` e para quem tem o módulo, e levanta 403 para quem não tem — comprovado por teste automatizado.

**Roda em paralelo com:** nenhuma
