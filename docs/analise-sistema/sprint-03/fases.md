# Fases — Sprint 03

> Um bloco por fase. O paralelismo declarado aqui é definitivo: a execução nunca decide paralelismo sozinha.

---

## F-03.1 — Tipos e grupos de API ausentes

**Objetivo:** criar os tipos `ClassGroup`, `Evaluation` (e auxiliares usados pelas páginas) e os 7 grupos de API ausentes (`teachersAPI`, `classesAPI`, `attendanceAPI`, `evaluationsAPI`, `weightConfigAPI`, `boletinsAPI`, `certificatesAPI`) com os endpoints mapeados na base.

**Tasks que a compõem:** T-03.01, T-03.02

**Critério de saída:** `tsc` não acusa mais imports inexistentes de `api.ts`/`types/index.ts` vindos das páginas órfãs (verificação por `tsc --noEmit`).

**Roda em paralelo com:** nenhuma

---

## F-03.2 — Rotas, permissões e correção das páginas órfãs

**Objetivo:** registrar as 5 rotas no App.tsx com PermissionRoute e permissões novas, corrigir o Header (`/classes`) e substituir os imports quebrados nas 5 páginas pelos grupos/tipos criados na F-03.1.

**Tasks que a compõem:** T-03.03, T-03.04, T-03.05

**Critério de saída:** `tsc --noEmit` limpo; as 5 páginas renderizam na navegação com os dados mockados no teste (vitest) e sem console.error de import.

**Roda em paralelo com:** nenhuma

---

## F-03.3 — Testes vitest e build limpo

**Objetivo:** escrever testes vitest para as 5 páginas reativadas (render com mocks dos grupos de API) e garantir `npm run build` sem erros.

**Tasks que a compõem:** T-03.06, T-03.07

**Critério de saída:** `vitest run` verde (0 failed); `npm run build` em `frontend/` conclui com código de saída 0.

**Roda em paralelo com:** nenhuma

---

## F-03.4 — Checklist manual do fluxo E2E

**Objetivo:** validar no navegador o fluxo completo da D-12 com os dois lados rodando localmente (start.bat/start.ps1 ou uvicorn+vite), registrando cada etapa no checklist.

**Tasks que a compõem:** T-03.08

**Critério de saída:** arquivo de checklist preenchido com todas as etapas marcadas como validado, sem pendência.

**Roda em paralelo com:** nenhuma