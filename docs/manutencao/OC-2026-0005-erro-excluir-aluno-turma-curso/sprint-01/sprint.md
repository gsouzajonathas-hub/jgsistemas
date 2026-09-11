---
expx_schema: 1
expx_tool: runx
kind: sprint
trabalho_id: OC-2026-0005
sprint_id: sprint-01
titulo: Verificar e fechar a correcao de exclusao em cascata
status: concluido
criterio_saida: Suite completa do backend verde e os 7 testes de test_exclusao_cascata.py verdes
fases: [F-01.1]
riscos: [Ambiente de producao (Render/Vercel/Supabase) pode ainda nao ter recebido o commit a835e9f - so o deploy resolve isso, fora do escopo do runx]
atualizado_em: 2026-09-10
---

# Sprint 01 — OC-2026-0005

## Objetivo

O fix do defeito relatado (erro ao excluir aluno/turma/curso/plano por violação de FK) já
está no código, trazido por `git pull` de origin/main (commit `a835e9f`), com teste de
regressão dedicado já verde. Esta sprint não implementa nada novo: verifica que a correção
cobre exatamente o cenário relatado e fecha a ocorrência com QA e relatórios formais.

## Fases

- **F-01.1 — Verificação e fechamento** (única).

## Critério de saída

- `backend/tests/test_exclusao_cascata.py` — 7 testes, todos `PASSED`.
- Suíte completa do backend (`pytest`) — `154 passed, 1 skipped`, sem novo teste vermelho.

## Riscos conhecidos

- Ambiente de produção pode ainda não ter recebido este commit — o runx registra que o fix
  está pronto e testado; o deploy em si é ação externa (regra do SKILL.md).

## Fora de escopo

- Alterar `ondelete`/`CASCADE` a nível de banco (FK constraints) — a limpeza acontece na
  aplicação, mesmo padrão já adotado na OC-2026-0002; não foi pedido e mudaria o schema.
- Professores (`teachers.py`) e Materiais (`materials.py`) — já usam o padrão
  "bloqueia se em uso" (guard), sem o mecanismo de FK saturada do relato; não apresentam o
  defeito, não foram tocados.
- Excluir o arquivo físico (Storage/disco) ao excluir um aluno — não constava no relato,
  registrado como lacuna não bloqueante em `base/00-LACUNAS.md`.
- Deploy em Render/Vercel — executado fora desta sprint, após o fechamento (E5).
