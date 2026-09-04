---
expx_schema: 1
expx_tool: runx
kind: sprint
trabalho_id: OC-2026-0001
sprint_id: sprint-01
titulo: Fix criar matricula - UI de Cursos e Professores
status: nao_iniciado
criterio_saida: npm test termina com 0 failed e npm run build com exit 0 no frontend, e os artefatos do fix estao commitados na main
fases: [F-01.1, F-01.2]
riscos: [Deploy do Render segue em update_failed desde o commit eb9299a e o proximo deploy depende de um bem-sucedido - BLOQUEIOS.md B-02, Limpeza dos dados de teste em producao (curso 2, professor 2, turma 1, matricula 16) depende de acesso ao banco - BLOQUEIOS.md B-01]
atualizado_em: 2026-09-04
---

> Frontmatter obrigatorio (expx-schema v1). Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

# Sprint 01 — Fix criar matricula - UI de Cursos e Professores

## Objetivo

Entregar as telas de CRUD de Cursos e Professores (com rotas, menu e permissões) que o produto nunca teve, destravando a cadeia curso → professor → turma → matrícula pela interface.

## Fases

| Fase | Título | Roda em paralelo com |
|---|---|---|
| F-01.1 | Fixar o comportamento | nenhuma |
| F-01.2 | Verificar e entregar | nenhuma |

Detalhe de cada fase em `fases.md`; tasks em `tasks.md`.

> Lembrete de proporcionalidade: crie uma segunda sprint APENAS quando existir um portão real entre blocos entregáveis — algo que precisa estar aplicado antes que o bloco seguinte possa ser testado. "São dois assuntos diferentes" não é portão; isso é duas fases.

## Critério de saída

`npm test` (frontend) termina com 0 failed, `npm run build` (frontend) termina com exit 0 e os artefatos da ocorrência estão commitados na main.

## Riscos conhecidos

- Deploy do Render segue em `update_failed` desde o commit `eb9299a`; qualquer deploy desta ocorrência depende de um bem-sucedido (BLOQUEIOS.md B-02)
- Limpeza dos dados de teste em produção (curso 2, professor 2, turma 1, matrícula 16) depende de acesso ao banco, não disponível (BLOQUEIOS.md B-01)

## Fora de escopo

> Escopo travado (regra 8). O que foi percebido e NÃO será tocado nesta ocorrência. Melhoria avulsa vira sugestão de nova ocorrência no relatório técnico, nunca implementação.

- Backend — endpoints e schemas já funcionam (causa comprovada é de UI)
- Validações de Turmas/Matrículas — decisão D-02 mantém o comportamento atual
- Deploy em produção — registrado em BLOQUEIOS.md B-02; tentado apenas no E5, sem alterar código
- Regras de matrícula, renovação, trancamento — fora da cadeia causal