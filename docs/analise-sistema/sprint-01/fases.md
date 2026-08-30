# Fases — Sprint 01

> Um bloco por fase. O paralelismo declarado aqui é definitivo: a execução nunca decide paralelismo sozinha.

**Status do sprint: concluida · 2026-08-29 · suíte backend 35 passed + frontend 2 passed, 0 failed**

---

## F-01.1 — Fundação de testes backend (pytest + fixtures)

**Status: concluida · 2026-08-29 ·** pytest roda com harness (conftest + fixtures idempotentes) e suíte global 35 passed, 0 failed.

**Objetivo:** permitir rodar `pytest` no backend com banco de teste isolado (SQLite temporário) e fixtures de dados reutilizáveis (admin autenticado, aluno, turma, professor).

**Tasks que a compõem:** T-01.01, T-01.03

**Critério de saída:** `pytest` em `backend/` roda e termina com ≥ 2 testes passando e 0 falhas; fixture `auth_headers` (admin) e fixtures de aluno/turma/professor importáveis por qualquer teste.

**Roda em paralelo com:** F-01.2

---

## F-01.2 — Fundação de testes frontend (vitest + testing-library)

**Status: concluida · 2026-08-29 ·** `vitest run` roda com 2 testes passando, 0 falhas; vitest 4.1.11 com pool forks.

**Objetivo:** permitir rodar `vitest run` no frontend com jsdom + testing-library e um primeiro teste smoke de componente.

**Tasks que a compõem:** T-01.02

**Critério de saída:** `vitest run` em `frontend/` roda e termina com ≥ 1 teste passando e 0 falhas; script `test` disponível em `package.json`.

**Roda em paralelo com:** F-01.1