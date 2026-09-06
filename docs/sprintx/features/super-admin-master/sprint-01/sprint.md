---
expx_schema: 1
expx_tool: sprintx
kind: sprint
trabalho_id: super-admin-master
sprint_id: sprint-01
titulo: Fundacao harness de permissao
status: concluido
criterio_saida: require_permission cobre super_admin e usuario com/sem modulo e a suite backend roda verde
fases: [F-01.1]
riscos: []
atualizado_em: 2026-09-05
---

# Sprint 01 — Fundação (harness de permissão)

## Objetivo

Entregar a capacidade de testar as sprints seguintes: fixtures de usuários com diferentes níveis de permissão (super_admin, admin com módulos completos, admin sem módulos) e o utilitário `require_permission(modulo)` que todas as rotas de negócio vão passar a usar — nenhuma rota de negócio é tocada nesta sprint.

## Fases

| Fase | Título | Roda em paralelo com |
|---|---|---|
| F-01.1 | Harness de permissão | nenhuma |

Detalhe de cada fase em `fases.md`; tasks em `tasks.md`.

## Critério de saída

`require_permission("financial")` (ou qualquer módulo) retorna o usuário para `super_admin` e para quem tem o módulo em `permissions`, e levanta `HTTPException(403)` para quem não tem — comprovado por teste automatizado, sem nenhuma rota real ainda alterada.

## Riscos conhecidos

- Nenhum risco registrado.
