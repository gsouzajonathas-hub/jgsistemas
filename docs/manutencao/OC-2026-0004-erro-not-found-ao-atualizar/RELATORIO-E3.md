# Relatório de encerramento do E3 — OC-2026-0004

> Encerramento do estágio de fix. Execução TDD concluída em 2026-09-05.

## O que foi feito

- **T-01.01 — Teste da config de deploy**: criado `frontend/src/__tests__/vercelConfig.test.ts` (importa `frontend/vercel.json` e valida os 3 rewrites). Falhou antes do fix nas duas verificações.
- **T-01.02 — Restaurar config de deploy**: criado `frontend/vercel.json` com `$schema` + os 3 rewrites (sem `buildCommand`/`outputDirectory` — o build atual já funciona pelo default da Vercel no root directory `frontend/`; declarar comandos errados para o contexto era justamente o bug) e **removido** `vercel.json` da raiz do repo.

## Evidências

### Antes do fix (vermelho)

- `npx tsc --noEmit` (em `frontend/`): `src/__tests__/vercelConfig.test.ts(2,26): error TS2307: Cannot find module '../../vercel.json' or its corresponding type declarations.`
- `npx vitest run src/__tests__/vercelConfig.test.ts --pool=threads`: `Failed to resolve import "../../vercel.json" from "src/__tests__/vercelConfig.test.ts". Does the file exist?` — suíte falhou.

### Depois do fix (verde)

- `npx tsc --noEmit` (em `frontend/`): OK.
- `npx vitest run --pool=threads --maxWorkers=2` (em `frontend/`): **Test Files 16 passed (16) · Tests 45 passed (45)** — Duration ~65s.

## Observações ambientais (sem mudança fora do escopo)

- `pool: forks` (configurado no `vitest.config.ts`) não consegue iniciar o worker nesta máquina Windows (`Timeout waiting for worker to respond`, 60s, antes de carregar qualquer arquivo). A suite foi validada com `--pool=threads`.
- A suite com threads e paralelismo total estourou memória (`FATAL ERROR: Zone Allocation failed`). Validada com `--maxWorkers=2`.
- Sugestão para nova ocorrência: reavaliar o pool/limites do vitest no Windows (fora do escopo desta OC).

## Pendências externas (fora do alcance do runx)

- Redeploy da Vercel (integração ao git ou `vercel --prod`) para produção passar a usar o novo `frontend/vercel.json`.
- Validação pós-deploy: `GET https://jgsistemas.dev.br/login` → 200 e `GET https://jgsistemas.dev.br/api/health` → 200 (deixar de voltar 404 de rota).