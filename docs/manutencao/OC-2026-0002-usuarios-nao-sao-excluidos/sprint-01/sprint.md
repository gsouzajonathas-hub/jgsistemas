---
expx_schema: 1
expx_tool: runx
kind: sprint
trabalho_id: OC-2026-0002
sprint_id: sprint-01
titulo: Fix exclusao de usuarios e confirmacao de exclusao
status: em_andamento
criterio_saida: pytest no backend termina com 0 failed (49 atuais + novos), vitest no frontend com 0 failed (23 atuais + novos), npm run build com exit 0, e os artefatos da ocorrencia estao commitados na main
fases: [F-01.1, F-01.2, F-01.3]
riscos: [Deploy manual via Vercel CLI obrigatorio - a integracao git do Vercel aponta para o repo renomeado e nao consegue deploy automatico (B-02), QA em producao depende da senha do admin@jgsistemas.com.br que nao esta registrada em nenhum doc (B-01)]
atualizado_em: 2026-09-04
---

> Frontmatter obrigatorio (expx-schema v1). Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

# Sprint 01 — Fix exclusao de usuarios e confirmacao de exclusao

## Objetivo

Tornar a exclusão de usuários funcional em Configurações (causa raiz comprovada no E1: FK sem `ondelete` bloqueia o DELETE no backend + ausência de try/catch no frontend) e implementar a confirmação de exclusão pedida pelo usuário: **tela/modal de confirmação com mensagem e botão vermelho/amarelo** para usuários e demais exclusões importantes do sistema.

## Fases

| Fase | Título | Roda em paralelo com |
|---|---|---|
| F-01.1 | Corrigir exclusao no backend | nenhuma |
| F-01.2 | Confirmacao de exclusao no frontend | nenhuma |
| F-01.3 | Verificar e entregar | nenhuma |

Detalhe de cada fase em `fases.md`; tasks em `tasks.md`.

## Critério de saída

- Backend: `python -m pytest -q` (na pasta `backend/`) termina com 0 failed — 49 testes atuais + T-01.01/T-01.02 novos verdes.
- Frontend: `npm test` (na pasta `frontend/`) termina com 0 failed — 23 testes atuais + novos verdes; `npm run build` termina com exit 0.
- O commit com os artefatos da ocorrência (docs + código) está na main e foi pushado.

## Riscos conhecidos

- **B-01 — QA em produção:** a senha do `admin@jgsistemas.com.br` não está registrada em nenhum doc (nunca escrever o valor); sem ela, o QA em produção (E4) fica bloqueado. Solicitar ao usuário no E4.
- **B-02 — Deploy:** a integração git do Vercel aponta para o repositório renomeado (`jonathasGodinho/jgsistemas` → `gsouzajonathas-hub/jgsistemas`) e o relink via API falhou; deploy desta ocorrência será **manual via Vercel CLI da raiz do repo** (padrão já validado na OC-2026-0001).

## Fora de escopo

> Escopo travado (regra 8). O que foi percebido e NÃO será tocado nesta ocorrência. Melhoria avulsa vira sugestão de nova ocorrência no relatório técnico, nunca implementação.

- Migração de banco (ALTER TABLE nas FKs de produção) — descartada na decisão D-01; o fix roda no schema existente.
- Alterar a lógica de permissões, perfis ou o fluxo de criação/edição de usuários (já funcionam — validação do E3 confirma).
- Deploy do backend no Render (B-02 da OC-2026-0001) — não faz parte desta cadeia causal.
- Cleanup dos dados de teste da OC-2026-0001 (B-01 dela) — bloqueio alheio, não tocado aqui.