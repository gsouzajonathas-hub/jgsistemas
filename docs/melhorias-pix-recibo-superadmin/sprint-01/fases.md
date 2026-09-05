# Fases — Sprint 01

> Um bloco por fase. Repita o bloco quantas vezes forem necessárias. O paralelismo declarado aqui é definitivo: a execução nunca decide paralelismo sozinha.

---

## F-01.1 — Fixtures de backend para as três áreas

**Objetivo:** criar no `tests/` do backend as fixtures que as sprints 02, 03 e 04 usarão (settings com `pix_key`, contexto de venda de material, seed de super admin via env), seguindo o padrão idempotente já existente em `tests/fixtures.py`.

**Tasks que a compõem:** T-01.01

**Critério de saída:** `backend/tests/fixtures.py` expõe `settings_com_pix`, `material_sale_ctx` e `valores_super_admin` (helper de env), cada uma coberta por um teste de fumaça verde que valida o formato retornado.

**Roda em paralelo com:** F-01.2

---

## F-01.2 — Baseline frontend: comandos, mocks e testes de referência

**Objetivo:** garantir que o harness vitest roda do zero com 0 failed e fixar o padrão de mock de `services/api` (vi.mock) em um teste-exemplo que as sprints 02, 03 e 04 replicarão.

**Tasks que a compõem:** T-01.02, T-01.03

**Critério de saída:** `npx vitest run` na pasta `frontend/` termina com 0 failed e existe um teste-exemplo (`__tests__/Financial.test.tsx` inicial) demonstrando o mock de `materialsAPI` e `settingsAPI` com `vi.mock('../services/api')`.

**Roda em paralelo com:** F-01.1