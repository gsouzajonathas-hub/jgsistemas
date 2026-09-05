---
expx_schema: 1
expx_tool: runx
kind: sprint
trabalho_id: OC-2026-0004
sprint_id: sprint-01
titulo: Restaurar config de deploy da Vercel
status: concluido
criterio_saida: Teste de regressao falha antes e passa depois; suite inteira verde (npm test em frontend/); vercel.json da raiz removido
fases: [F-01.1]
riscos: [Config corrigida so vale em producao apos novo deploy da Vercel (externo ao runx)]
atualizado_em: 2026-09-05
---

> Frontmatter obrigatorio (expx-schema v1). Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

# Sprint 1 — Restaurar config de deploy da Vercel

## Objetivo

Fazer a Vercel voltar a aplicar os rewrites (`/api` e `/uploads` → Render) e o fallback SPA, colocando o `vercel.json` de volta no root directory do projeto (`frontend/`), e remover a cópia da raiz que o Vercel ignora.

## Fases

| Fase | Título | Roda em paralelo com |
|---|---|---|
| F-01.1 | Config de deploy restaurada | nenhuma |

Detalhe de cada fase em `fases.md`; tasks em `tasks.md`.

> Lembrete de proporcionalidade: crie uma segunda sprint APENAS quando existir um portão real entre blocos entregáveis — algo que precisa estar aplicado antes que o bloco seguinte possa ser testado. "São dois assuntos diferentes" não é portão; isso é duas fases.

## Critério de saída

O teste de regressão (`frontend/src/__tests__/vercelConfig.test.ts`) falha antes do fix e passa depois; a suíte inteira roda verde com `npm test` em `frontend/`; `vercel.json` não existe mais na raiz do repo.

## Riscos conhecidos

- A config corrigida só vale em produção após um novo deploy da Vercel (integração git ou `vercel --prod`) — externo ao runx — registrado em `01-CAUSA-RAIZ.md` (D-01) e `base/deploy-vercel.md`.

## Fora de escopo

> Escopo travado (regra 8). O que foi percebido e NÃO será tocado nesta ocorrência. Melhoria avulsa vira sugestão de nova ocorrência no relatório técnico, nunca implementação.

- Mudar configuração no dashboard da Vercel (Root Directory, variáveis) — sem acesso ao dashboard; decisão D-01 mantém a config no repositório.
- Backend (Render) — nenhuma mudança; o backend está no ar.
- Código do frontend (`frontend/src/`) — nenhuma mudança além do teste de config.
- Remover `.vercel/project.json` da raiz (link antigo do CLI) — inerte; fica como sugestão no relatório técnico.