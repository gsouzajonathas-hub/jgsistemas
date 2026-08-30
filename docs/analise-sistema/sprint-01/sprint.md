# Sprint 01 — Capacidade de Testar (Fundação)

## Objetivo

Entregar a infraestrutura mínima para executar testes automatizados nos dois lados — pytest no backend e vitest no frontend — com fixtures de dados (usuário admin autenticado, aluno, turma, professor). Esta sprint NÃO entrega funcionalidade de negócio (regra estrutural do método): sem ela, o TDD das sprints seguintes não é executável.

## Fases

| Fase | Título | Roda em paralelo com |
|---|---|---|
| F-01.1 | Fundação de testes backend (pytest + fixtures) | F-01.2 |
| F-01.2 | Fundação de testes frontend (vitest + testing-library) | F-01.1 |

Detalhe de cada fase em `fases.md`; tasks em `tasks.md`.

## Critério de saída

Os comandos `pytest` (em `backend/`) e `vitest run` (em `frontend/`) executam sem erro e terminam com a suíte inicial verde (mínimo 2 testes passando, 0 falhas); fixtures de usuário/admin/aluno/turma/professor consumíveis por testes de sprints seguintes.

## Riscos conhecidos

- Repositório tem ZERO testes hoje — o harness começa do nada, sem padrão a seguir (`base/06-testes.md`).
- Backend async (SQLAlchemy async + aiosqlite) exige fixture de engine/database própria para os testes — risco de vazar engine do app para a suíte (`base/01-backend-nucleo.md`, `backend/app/database.py:8-18`).
- Deploy Render tem `autoDeploy: true` sem CI — a fundação de testes não impede deploy quebrado até existir pipeline (`base/05-configuracao-infra.md`, `render.yaml:16`); escopo desta sprint é apenas executar testes localmente.
- npm não possui script de teste — adicionar `test`/`test:run` exige mexer em `frontend/package.json:6-10` (`base/04-frontend.md`).