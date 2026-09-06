---
expx_schema: 1
expx_tool: sprintx
kind: fases
trabalho_id: super-admin-master
sprint_id: sprint-04
atualizado_em: 2026-09-05
fases:
  - id: F-04.1
    titulo: Ajustes de frontend
    status: concluido
    criterio_saida: hasPermission Sidebar e Settings.tsx refletem o master exclusivo com suite frontend verde
    paralelizavel: true
    paralela_com: []
    tasks: [T-04.01, T-04.02, T-04.03]
  - id: F-04.2
    titulo: Suite completa e entrega
    status: concluido
    criterio_saida: pytest vitest e build terminam verdes e o commit esta na main
    paralelizavel: false
    paralela_com: []
    tasks: [T-04.04]
---

```mermaid
%% Grafo de tasks — sprint-04 — gerado pela sprintx a partir de tasks.md
flowchart LR
  subgraph fase_04_1["F-04.1 — Ajustes de frontend"]
    T_04_01["T-04.01<br/>hasPermission bypass…"]
    T_04_02["T-04.02<br/>Sidebar checa settings"]
    T_04_03["T-04.03<br/>Settings.tsx modulos…"]
  end
  subgraph fase_04_2["F-04.2 — Suite completa e entrega"]
    T_04_04["T-04.04<br/>Suite completa build…"]
  end

  T_04_01 --> T_04_04
  T_04_02 --> T_04_04
  T_04_03 --> T_04_04

  classDef concluida fill:#d4f4dd,stroke:#2e7d32,color:#1b3d20
  classDef andamento fill:#fff3cd,stroke:#b8860b,color:#4a3800
  classDef bloqueada fill:#f8d7da,stroke:#c62828,color:#4a1d1f
  classDef pendente  fill:#eceff1,stroke:#78909c,color:#263238
  classDef critico   stroke-width:3px

  class T_04_01 concluida
  class T_04_02 concluida
  class T_04_03 concluida
  class T_04_04 concluida
  class T_04_01,T_04_04 critico
```

---

## F-04.1 — Ajustes de frontend

**Objetivo:** Refletir na interface que só o `super_admin` tem acesso automático a tudo, e que os 15 módulos são configuráveis para qualquer usuário, inclusive `admin`.

**Tasks que a compõem:** T-04.01, T-04.02, T-04.03

**Critério de saída:** `hasPermission` só dá bypass a `super_admin`; `Sidebar` esconde Configurações sem o módulo; a aba Usuários só existe para `super_admin`.

**Roda em paralelo com:** nenhuma

---

## F-04.2 — Suíte completa e entrega

**Objetivo:** Fechar a feature com a suíte inteira verde, build limpo e commit na main.

**Tasks que a compõem:** T-04.04

**Critério de saída:** `pytest` 0 failed; `vitest` 0 failed; `npm run build` exit 0; commit feito.

**Roda em paralelo com:** nenhuma
