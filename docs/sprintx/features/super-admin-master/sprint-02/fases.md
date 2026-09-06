---
expx_schema: 1
expx_tool: sprintx
kind: fases
trabalho_id: super-admin-master
sprint_id: sprint-02
atualizado_em: 2026-09-05
fases:
  - id: F-02.1
    titulo: Master exclusivo e modulos novos
    status: concluido
    criterio_saida: Gestao de usuarios restrita a super_admin e ALL_MODULES ALL_PERMISSIONS com 15 chaves
    paralelizavel: true
    paralela_com: []
    tasks: [T-02.01, T-02.02]
  - id: F-02.2
    titulo: Migracao de dados
    status: concluido
    criterio_saida: Admins existentes preservam acesso apos alembic upgrade head
    paralelizavel: false
    paralela_com: []
    tasks: [T-02.03]
---

```mermaid
%% Grafo de tasks — sprint-02 — gerado pela sprintx a partir de tasks.md
flowchart LR
  subgraph fase_02_1["F-02.1 — Master exclusivo e modulos novos"]
    T_02_01["T-02.01<br/>Super admin exclusivo…"]
    T_02_02["T-02.02<br/>Incluir audit e settings"]
  end
  subgraph fase_02_2["F-02.2 — Migracao de dados"]
    T_02_03["T-02.03<br/>Migracao popula…"]
  end

  T_02_02 --> T_02_03

  classDef concluida fill:#d4f4dd,stroke:#2e7d32,color:#1b3d20
  classDef andamento fill:#fff3cd,stroke:#b8860b,color:#4a3800
  classDef bloqueada fill:#f8d7da,stroke:#c62828,color:#4a1d1f
  classDef pendente  fill:#eceff1,stroke:#78909c,color:#263238
  classDef critico   stroke-width:3px

  class T_02_01 concluida
  class T_02_02 concluida
  class T_02_03 concluida
  class T_02_02,T_02_03 critico
```

---

## F-02.1 — Master exclusivo e módulos novos

**Objetivo:** Corrigir o bug do super_admin e tornar a gestão de usuários exclusiva dele; ampliar a lista de módulos para 15.

**Tasks que a compõem:** T-02.01, T-02.02

**Critério de saída:** As três rotas de `/auth/users*` só aceitam `super_admin`; `ALL_MODULES`/`ALL_PERMISSIONS` têm 15 chaves.

**Roda em paralelo com:** nenhuma

---

## F-02.2 — Migração de dados

**Objetivo:** Popular `permissions` dos admins existentes com os 15 módulos antes do enforcement real entrar em vigor.

**Tasks que a compõem:** T-02.03

**Critério de saída:** `alembic upgrade head` deixa qualquer admin pré-existente com os 15 módulos em `permissions`.

**Roda em paralelo com:** nenhuma
