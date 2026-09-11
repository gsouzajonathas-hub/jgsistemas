---
expx_schema: 1
expx_tool: runx
kind: qa
trabalho_id: OC-2026-0005
veredito: aprovado
executado_em: 2026-09-10
achados:
  - severidade: media
    arquivo: backend/tests/test_exclusao_cascata.py
    problema: test_excluir_aluno_com_todas_dependencias passa mesmo contra o codigo anterior ao fix (commit a835e9f^), porque o SQLite de teste nao tem PRAGMA foreign_keys=ON — o mecanismo especifico "Carne apagado antes de Enrollment viola FK" so e recusado pelo Postgres de producao, nao pelo SQLite local
    correcao_sugerida: Ativar PRAGMA foreign_keys=ON na fixture de banco de teste (mesmo padrao ja usado em test_user_delete_regression.py da OC-2026-0002), para que este teste discrimine de fato o mecanismo de ordem de FK e nao apenas o resultado final dos dados
atualizado_em: 2026-09-10
---

> Sem achados, use `achados: []`. Existe achado `severidade: alta` → `veredito: reprovado`, sem excecao. O campo `veredito` espelha a linha VEREDITO da prosa.

# QA — OC-2026-0005 erro-excluir-aluno-turma-curso

> Escrito no E4, por quem NÃO implementou (o fix já existia no código antes desta sessão; aqui apenas se valida). Nenhum arquivo de código, teste ou plano foi alterado neste estágio.

**Data:** 2026-09-10

## Verificações

| # | Item | Resultado |
|---|---|---|
| 1 | O teste de regressão falhava antes e passa agora | OK — verificado executando `test_exclusao_cascata.py` num worktree no commit `a835e9f^` (pai do fix): 3 de 7 testes falham (`test_excluir_turma_com_peso_matricula_inativa_e_carne`, `test_excluir_curso_desvincula_plano_financeiro`, `test_excluir_plano_em_uso_por_carne_bloqueia`); os 7 passam no código atual |
| 2 | Cada task tem os dois testes e eles testam o que dizem testar | OK — `teste_integracao`/`teste_funcional` de T-01.01 e T-01.02 batem com o que foi executado |
| 3 | Nenhum teste passaria com a implementação errada | ACHADO (MÉDIA) — ver tabela abaixo: `test_excluir_aluno_com_todas_dependencias` não discrimina o mecanismo de ordem de FK localmente |
| 4 | A suíte inteira passa, incluindo o que não foi tocado | OK — reexecutada nesta sessão, independente do relato do E3: `154 passed, 1 skipped in 157.88s` |
| 5 | O critério de aceite de cada task foi atendido de fato | OK — critérios de T-01.01 e T-01.02 verificados por execução real, não por marcação |
| 6 | Os critérios de saída de cada fase e sprint foram atendidos | OK |
| 7 | Nada fora do escopo declarado foi alterado (diff conferido) | OK — `git status --porcelain` no repositório principal mostra apenas pastas novas em `docs/manutencao/` e `docs/super-admin-master/` (esta última pré-existente, não desta ocorrência); nenhum arquivo de `backend/` ou `frontend/` foi alterado nesta sessão |
| 8 | O comportamento descrito na investigação é o comportamento real | OK — os quatro trechos citados em `01-CAUSA-RAIZ.md` conferem com o código lido em `students.py`, `classes.py`, `courses.py` e `financial.py` |

## Conferência do diff contra o escopo

**Arquivos no diff e não autorizados** (ALTA): nenhum — esta sessão não alterou nenhum
arquivo de `backend/` ou `frontend/`; o fix já estava em `origin/main` antes do relato.

**Arquivos autorizados e ausentes do diff** (MÉDIA): não se aplica — nenhuma task desta
ocorrência declarou `arquivos.cria`/`arquivos.altera` (verificação apenas).

## Achados

| severidade | arquivo | problema | correção sugerida |
|---|---|---|---|
| MÉDIA | `backend/tests/test_exclusao_cascata.py` | `test_excluir_aluno_com_todas_dependencias` passa mesmo contra o código anterior ao fix (confirmado rodando o teste num worktree no commit `a835e9f^`) — o SQLite de teste não tem `PRAGMA foreign_keys=ON`, então o mecanismo específico "Carne apagado antes de Enrollment viola FK no Postgres" não é exercido localmente; o teste só prova o resultado final dos dados, não a ordem de exclusão | Ativar `PRAGMA foreign_keys=ON` na fixture de banco de teste (mesmo padrão já usado em `test_user_delete_regression.py` da OC-2026-0002), para que este teste discrimine de fato o mecanismo de ordem de FK |

## Saída da suíte

```
Verificação isolada (worktree no commit a835e9f^, ANTES do fix):
FAILED tests/test_exclusao_cascata.py::test_excluir_turma_com_peso_matricula_inativa_e_carne
FAILED tests/test_exclusao_cascata.py::test_excluir_curso_desvincula_plano_financeiro
FAILED tests/test_exclusao_cascata.py::test_excluir_plano_em_uso_por_carne_bloqueia
3 failed, 4 passed in 29.72s

Suíte completa (código atual, HEAD e741032, COM o fix) — reexecutada nesta sessão de QA:
........................................................................ [ 46%]
.......................................s................................ [ 92%]
...........                                                              [100%]
154 passed, 1 skipped in 157.88s (0:02:37)
```

## Veredito

VEREDITO: APROVADO — a ocorrência está pronta para fechamento.
