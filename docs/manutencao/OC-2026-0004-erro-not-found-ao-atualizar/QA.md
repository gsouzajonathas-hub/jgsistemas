# QA — OC-2026-0004 Erro NOT_FOUND ao atualizar

> Estágio E4. Validação de aceite das mudanças do E2/E3, registrada em 2026-09-05.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| Suíte de testes — 16 arquivos / 45 testes (`npx vitest run --pool=threads --maxWorkers=2` em `frontend/`) | ✅ verde |
| Typecheck (`npx tsc --noEmit` em `frontend/`) | ✅ OK |
| `frontend/vercel.json` parseado e com os 3 rewrites esperados (validação independente em Python) | ✅ |
| `vercel.json` removido da raiz | ✅ |
| Escopo via git — única mudança rastreada: `D vercel.json`; criações: `frontend/vercel.json`, `frontend/src/__tests__/vercelConfig.test.ts`, `docs/manutencao/OC-2026-0004-.../` | ✅ sem mudança fora do escopo |
| Teste de regressão discrimina (URL de destino errada ou fallback ausente → assertion falha) | ✅ |

## Achados residuais (MÉDIA / BAIXA)

- **MÉDIA (ambiente)**: `pool: forks` do `vitest.config.ts` não inicia o worker no Windows nesta máquina (timeout interno de 60s, antes de carregar qualquer arquivo). Considerar `pool: threads` com `maxWorkers` no config — sugerida como nova ocorrência; fora do escopo desta OC.
- **BAIXA**: `.vercel/project.json` na raiz do repo (link do CLI Vercel, inerte para o deploy) — candidato a remoção numa próxima limpeza.
- **BAIXA**: `buildCommand`/`outputDirectory` do antigo `vercel.json` da raiz não foram recriados em `frontend/vercel.json` de propósito — o build atual funciona pelo default da Vercel no root directory `frontend/`. Se o deploy padrão mudar, declarar `buildCommand: "npm ci && npm run build"` e `outputDirectory: "dist"` no contexto `frontend/`.
- **BAIXA (pendência externa)**: produção só valida de fato após o redeploy da Vercel. Validação pós-deploy: `GET /` → 200 (SPA), `GET /login` → 200 (fallback SPA), `GET /api/health` → 200, `POST /api/auth/login` → resposta do backend (nunca 404 de rota).

## Veredito

- Mudanças do E2/E3 **aprovadas no ambiente local** (config, escopo e suíte validados).
- Aprovação final da ocorrência condicionada à validação em produção após o redeploy da Vercel (item BAIXA acima).