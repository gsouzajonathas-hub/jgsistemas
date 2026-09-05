---
expx_schema: 1
expx_tool: runx
kind: orquestrador
trabalho_id: OC-2026-0004
titulo: Erro NOT_FOUND ao atualizar
tipo_trabalho: ocorrencia
tipo_ocorrencia: bug
estagio: e5
status: concluido
criado_em: 2026-09-05
atualizado_em: 2026-09-05
concluido_em: 2026-09-05
sprints: [sprint-01]
caminho_critico: [F-01.1]
---

> Frontmatter obrigatorio (expx-schema v1). Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

# Orquestrador — OC-2026-0004 Erro NOT_FOUND ao atualizar

> Porta de entrada da execução. Escrito para quem abriu o repositório agora e não sabe nada. Só caminhos relativos; nunca o valor de um segredo.

## 1. Objetivo

Restaurar o deploy do frontend em produção: o `vercel.json` com os rewrites (`/api`, `/uploads` → Render) e o fallback SPA volta para o root directory do projeto Vercel (`frontend/`), e a cópia da raiz é removida. Com isso, F5 em `/login` e todas as chamadas `/api/*` deixam de retornar 404 da Vercel.

## 2. Mapa e ordem de leitura

1. Este arquivo (`ORQUESTRADOR.md`)
2. `00-OCORRENCIA.md` — o chamado como chegou
3. `01-CAUSA-RAIZ.md` — a causa comprovada (config de deploy fora do root directory) e as decisões D-01/D-02 que governam o plano
4. `base/00-INDICE.md` — e `base/deploy-vercel.md`, a área de deploy mapeada
5. `sprint-01/sprint.md` → `fases.md` → `tasks.md`
6. `BLOQUEIOS.md` — bloqueios registrados durante a execução
7. `QA.md` — achados MÉDIA/BAIXA que permanecem válidos

## 3. Rota de execução

- Sprint 01: F-01.1 — T-01.01 → T-01.02 (sequencial, sem paralelismo)

**Caminho crítico:** T-01.01 → T-01.02

## 4. Ferramentas

- **Testes:** `npm test` — em `frontend/` (vitest run)
- **Lint:** NÃO EXISTE NO PROJETO (sem eslint configurado)
- **Typecheck:** `npx tsc --noEmit` — em `frontend/`
- **MCPs / SDKs:** nenhum além do padrão
- **Segredos:** nenhum — a config de deploy do Vercel não usa segredos

## 5. Papéis dentro de cada task

- **Implementador** — escreve o teste primeiro, vê falhar, implementa o mínimo até passar.
- **Revisor de testes** — antes de aceitar o verde, responde: este teste falharia com uma implementação errada? Se não, o teste volta.
- **Auditor de aceite** — verifica de fato o `criterio_aceite` da task antes de permitir `status: concluida`.

**Agente único:** assume os três papéis em sequência dentro de cada task, nesta ordem, tratando cada papel como um portão — não avança ao papel seguinte sem fechar o anterior. A aprovação final da ocorrência NÃO é feita aqui: é o E4 QA, papel distinto do E3.

## 6. Regras de autonomia

1. Não pergunte nada; não peça autorização para nada.
2. O teste vem antes do código, sempre. O teste de regressão tem que falhar antes do fix — se ele passar antes, pare e volte ao E1.
3. Task só é `concluida` com teste de integração E funcional passando, suíte inteira verde e `criterio_aceite` verificado. Não existe "concluído com ressalva".
4. Escopo travado: não toque em arquivo fora de `01-CAUSA-RAIZ.md` e de `tasks.md`. Nada de refactor de brinde.
5. Dúvida nova ou pré-requisito faltando: registrar em `BLOQUEIOS.md` (`B-NN | task | bloqueio | o que destravaria`), marcar a task `bloqueada`, pular para a próxima paralelizável. Nunca parar e esperar.
6. Só rode em paralelo o que o plano declarou paralelizável; a execução nunca decide paralelismo. Entre sprints, sempre sequencial.
7. Atualize `status` em `tasks.md` a cada transição; ao concluir, acrescente data e resultado da suíte.
8. Critério de saída de fase/sprint não atendido = não avança.

## 7. Definição de pronto da ocorrência

- [ ] `frontend/vercel.json` existe e declara os rewrites `/api/:path*` e `/uploads/:path*` (→ `https://jgsistemas-backend.onrender.com/...`) e o fallback `/(.*)` → `/index.html`.
- [ ] `vercel.json` não existe na raiz do repo.
- [ ] O teste de regressão falhava antes do fix e passa agora.
- [ ] A suíte inteira passa com `npm test` em `frontend/`.
- [ ] Nenhum arquivo fora do escopo declarado foi alterado.
- [ ] Após redeploy da Vercel (externo ao runx): `GET https://jgsistemas.dev.br/login` → 200 e `GET https://jgsistemas.dev.br/api/health` → 200.

## 8. Como retomar uma sessão interrompida

1. Leia este arquivo inteiro.
2. Leia o `status` de cada task em cada `sprint-NN/tasks.md`.
3. Leia `BLOQUEIOS.md`.
4. Continue da primeira task `pendente` ou `em_andamento` cujas dependências (`depende_de`) estão todas `concluida`. Ignore as `bloqueada` até que o bloqueio registrado seja resolvido.