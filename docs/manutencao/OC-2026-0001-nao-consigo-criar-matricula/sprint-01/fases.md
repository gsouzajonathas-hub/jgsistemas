---
expx_schema: 1
expx_tool: runx
kind: fases
trabalho_id: OC-2026-0001
sprint_id: sprint-01
atualizado_em: 2026-09-04
fases:
  - id: F-01.1
    titulo: Fixar o comportamento
    status: concluida
    criterio_saida: Todos os testes novos (App.test.tsx, Courses.test.tsx, Teachers.test.tsx) passam com npm test, incluindo o teste de regressao que falhava antes do fix
    paralelizavel: false
    paralela_com: []
    tasks: [T-01.01, T-01.02, T-01.03, T-01.04]
  - id: F-01.2
    titulo: Verificar e entregar
    status: concluida
    criterio_saida: npm run build termina com exit 0 e npm test com 0 failed; commit com os artefatos da ocorrencia gravado na main
    paralelizavel: false
    paralela_com: []
    tasks: [T-01.05]
---

> Frontmatter obrigatorio (expx-schema v1). Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

## Grafo de tasks

> SUBSTITUA o bloco abaixo INTEIRO pelo grafo desta sprint, gerado no E2 pelas regras de `references/07-diagrama.md`. Um no por task (identificador trocando `-` e `.` por `_`: `T-01.01` → `T_01_01`), uma aresta `-->` por `depende_de`, um `subgraph` por fase, caminho critico na classe `critico`, status por cor, e a task do `teste_regressao` na classe `regressao`. Formato do rotulo: `"<id><br/><titulo cortado em 28>"`.
>
> As arestas ficam FORA dos subgraphs, depois do ultimo `end`. Sem `linkStyle`, sem `style` por no, sem aresta inventada a partir de `paralelizavel` — paralelismo e ausencia de aresta.
>
> Acima de 25 tasks na sprint: uma visao geral das fases mais um diagrama por fase, nunca um diagrama que nao caiba numa tela.
>
> O E3 atualiza SOMENTE as linhas `class` conforme o status de cada task muda. Diagrama e derivado: se ele nao for gerado, nada trava — mas se os campos se contradisserem (`paralelizavel: true` com `depende_de` nao vazio, seta para id inexistente, ciclo), NAO gere o bloco: reporte a contradicao como erro de plano.

```mermaid
%% Grafo de tasks — sprint-01 — gerado pela runx a partir de tasks.md
flowchart LR
  subgraph fase_01_1["F-01.1 — Fixar o comportamento"]
    T_01_01["T-01.01<br/>Teste de regressao das rotas"]
    T_01_02["T-01.02<br/>Criar pagina Courses.tsx"]
    T_01_03["T-01.03<br/>Criar pagina Teachers.tsx"]
    T_01_04["T-01.04<br/>Rotas menu e permissoes"]
  end
  subgraph fase_01_2["F-01.2 — Verificar e entregar"]
    T_01_05["T-01.05<br/>Suíte completa e commit"]
  end
  T_01_01 --> T_01_02
  T_01_01 --> T_01_03
  T_01_02 --> T_01_04
  T_01_03 --> T_01_04
  T_01_04 --> T_01_05

  classDef concluida fill:#d4f4dd,stroke:#2e7d32,color:#1b3d20
  classDef andamento fill:#fff3cd,stroke:#b8860b,color:#4a3800
  classDef bloqueada fill:#f8d7da,stroke:#c62828,color:#4a1d1f
  classDef pendente  fill:#eceff1,stroke:#78909c,color:#263238
  classDef critico   stroke-width:3px
  classDef regressao fill:#ede4ff,stroke:#6a1b9a,color:#3d1a78,stroke-width:3px

  class T_01_01 concluida
  class T_01_02 concluida
  class T_01_03 concluida
  class T_01_04 concluida
  class T_01_05 concluida
  class T_01_01,T_01_02,T_01_04,T_01_05 critico
```

# Fases — Sprint 01

> Um bloco por fase. Repita o bloco quantas vezes forem necessárias. O paralelismo declarado aqui é definitivo: a execução nunca decide paralelismo sozinha.

---

## F-01.1 — Fixar o comportamento

**Objetivo:** fixar via teste o comportamento ausente (rotas de Cursos e Professores), entregar as duas páginas de CRUD e expô-las no App, no menu e nas permissões.

**Tasks que a compõem:** T-01.01, T-01.02, T-01.03, T-01.04

**Critério de saída:** todos os testes novos (App.test.tsx, Courses.test.tsx, Teachers.test.tsx) passam com `npm test`, incluindo o teste de regressão que falhava antes do fix.

**Roda em paralelo com:** nenhuma

---

## F-01.2 — Verificar e entregar

**Objetivo:** provar que nada quebrou, fechar a sprint e gravar o fix na main.

**Tasks que a compõem:** T-01.05

**Critério de saída:** `npm run build` termina com exit 0 e `npm test` com 0 failed; commit com os artefatos da ocorrência gravado na main.

**Roda em paralelo com:** nenhuma