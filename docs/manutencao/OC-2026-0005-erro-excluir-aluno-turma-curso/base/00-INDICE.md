---
expx_schema: 1
expx_tool: runx
kind: base_indice
trabalho_id: OC-2026-0005
atualizado_em: 2026-09-10
areas:
  - arquivo: exclusao-cascata-alunos-turmas-cursos.md
    titulo: Exclusão em cascata — Alunos, Turmas, Cursos e Planos Financeiros
    lacunas: 1
---

# Índice da base — OC-2026-0005

Histórico: `docs/manutencao/OC-2026-0002-usuarios-nao-sao-excluidos` tratou o mesmo tipo de
defeito (exclusão quebrando por FK), mas para a entidade `users` — módulo e arquivos
diferentes dos desta ocorrência; não é a mesma causa (ver `01-CAUSA-RAIZ.md`).

- `exclusao-cascata-alunos-turmas-cursos.md` — rotas de exclusão de aluno, turma, curso e
  plano financeiro, estrutura de FKs envolvida, e o fix já aplicado no commit `a835e9f`.
