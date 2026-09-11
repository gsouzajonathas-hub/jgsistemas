---
expx_schema: 1
expx_tool: runx
kind: relatorio_tecnico
trabalho_id: OC-2026-0005
titulo: Erro ao excluir aluno, turma e curso
tipo_ocorrencia: bug
fechado_em: 2026-09-10
modulo_afetado: [alunos, turmas, cursos, financeiro]
arquivos_alterados: [backend/app/routes/students.py, backend/app/routes/classes.py, backend/app/routes/courses.py, backend/app/routes/financial.py, backend/tests/test_exclusao_cascata.py]
palavras_chave: [exclusao, cascata, fk, integrityerror, aluno, turma, curso, plano]
regressao_de: null
testes_adicionados: 7
---

> `palavras_chave` e `regressao_de` sao COPIADOS de `01-CAUSA-RAIZ.md`, sem recalcular: `null` la e `null` aqui. Nunca invente um vinculo de regressao no fechamento (regra 15). `evidencia_regressao` nao entra neste YAML — a linha de evidencia vai na secao 4.

# OC-2026-0005 — Erro ao excluir aluno, turma e curso

> Leitor: o próximo desenvolvedor que abrir este código. Caminhos sempre relativos.

**Fechada em:** 2026-09-10

## 1. Ocorrência e tipo

OC-2026-0005 · bug · módulo: alunos, turmas, cursos, financeiro

## 2. Sintoma relatado

Ao excluir aluno, turma ou curso (com dados vinculados) e confirmar no modal, o sistema
exibia "Erro ao excluir [entidade]" e o registro permanecia no sistema e no banco. Relato
literal em `docs/manutencao/OC-2026-0005-erro-excluir-aluno-turma-curso/00-OCORRENCIA.md`.

## 3. Base do que foi mapeado, em resumo

- `base/exclusao-cascata-alunos-turmas-cursos.md` — rotas `DELETE` de aluno, turma, curso e
  plano financeiro (`students.py`, `classes.py`, `courses.py`, `financial.py`), estrutura de
  FKs para `students.id`, `class_groups.id` e `courses.id`, e a ordem de exclusão que evita
  violar `carnets.enrollment_id → enrollments.id`.

## 4. Causa raiz ou análise de impacto

Quatro mecanismos de `IntegrityError`/`AttributeError` no backend, todos convergindo no
mesmo fallback genérico do frontend ("Erro ao excluir X" quando a resposta não traz
`detail`):

1. `delete_student` apagava `Enrollment` antes de `Carne`, violando `carnets.enrollment_id`.
2. `delete_class` não limpava `GradeWeightConfig`/`Certificate`/`Attendance`/`Evaluation`/
   `Enrollment` vinculados antes do `db.delete(cg)`.
3. `delete_course` não desvinculava `FinancialPlan.course_id` antes de apagar o curso.
4. `delete_plan` referenciava o atributo inexistente `Carne.plan_id` (o correto é
   `Installment.plan_id`/`FinancialContract.plan_id`) — `AttributeError`, `500` sempre.

**Prova:** o teste `test_exclusao_cascata.py`, executado nesta sessão num worktree no commit
`a835e9f^` (pai do fix), falha em 3 dos 7 casos exatamente nos mecanismos 2, 3 e 4
(`test_excluir_turma_com_peso_matricula_inativa_e_carne`,
`test_excluir_curso_desvincula_plano_financeiro`,
`test_excluir_plano_em_uso_por_carne_bloqueia`). O mecanismo 1 (ordem `Carne`/`Enrollment`)
está documentado no comentário do próprio fix (`students.py:334-336`) e só se manifesta sob
enforcement real de FK (Postgres de produção) — o SQLite de teste local não recusa a ordem
errada, ver seção 10 (risco residual).

**Regressão:** Não é regressão de trabalho anterior registrado. `git log --follow` em
`backend/app/routes/students.py` mostra o arquivo existente desde o commit inicial
(`e975201`); a ordem de exclusão problemática é estrutural, não introduzida por uma
ocorrência ou feature anterior. Suspeita descartada: coincidência de padrão com
OC-2026-0002 (mesmo sintoma — exclusão quebrando por FK —, mas em tabelas e arquivos
diferentes, `users`/`audit_logs`/`communication_logs`); não há vínculo de código, por isso
`regressao_de: null`.

## 5. Solução aplicada

O fix (commit `a835e9f`, já presente em `origin/main` antes deste relato, trazido a esta
sessão por `git pull`) corrige os quatro mecanismos:

- `students.py`: reordena a exclusão para apagar `Carne` antes de `Enrollment`.
- `classes.py`: adiciona limpeza explícita de `GradeWeightConfig`, `Certificate`,
  `Attendance`, `Evaluation` e `Enrollment` antes do `db.delete(cg)`; desvincula (não apaga)
  o carnê da matrícula.
- `courses.py`: desvincula `FinancialPlan.course_id` (`SET NULL`) antes de apagar o curso.
- `financial.py`: corrige `delete_plan` para checar uso via `Installment.plan_id` e
  `FinancialContract.plan_id`.

Esta ocorrência não implementou nada novo: verificou a cobertura do fix já aplicado,
reexecutou a suíte de forma independente e formalizou o fechamento.

## 6. Decisão técnica e alternativas descartadas

```
D-01 | Adotar o commit a835e9f como o fix desta ocorrencia, sem reimplementar | Investigar e corrigir do zero | Fix ja valida o mecanismo exato do relato, com teste de regressao e suite verde
D-02 | Registrar via runx (OC-2026-0005) para rastreabilidade, mesmo com o fix ja aplicado | Encerrar apenas verbalmente, sem registro | O relato chegou como defeito ativo; falta vinculo formal entre sintoma e commit que resolveu
```

## 7. Sprints, fases e tasks executadas

| Task | Título | Status | Data |
|---|---|---|---|
| T-01.01 | Confirmar que o teste de regressão cobre o defeito relatado | concluida | 2026-09-10 |
| T-01.02 | Rodar a suíte completa do backend como validação final | concluida | 2026-09-10 |

Nenhum bloqueio registrado (`BLOQUEIOS.md` vazio).

## 8. Arquivos alterados

Nenhum arquivo foi alterado **nesta ocorrência** — o fix já estava em `origin/main`. Os
arquivos abaixo foram alterados pelo commit `a835e9f`, adotado como a correção:

- `backend/app/routes/students.py` — ordem de exclusão (Carne antes de Enrollment).
- `backend/app/routes/classes.py` — cascata de dependências da turma.
- `backend/app/routes/courses.py` — desvincula plano financeiro do curso.
- `backend/app/routes/financial.py` — corrige atributo inexistente em `delete_plan`.
- `backend/tests/test_exclusao_cascata.py` — 7 testes novos (criado pelo mesmo commit).

## 9. Testes adicionados

- **Regressão:** `backend/tests/test_exclusao_cascata.py` (7 casos) — confirmado nesta
  sessão que 3 deles falham contra o código anterior ao fix e os 7 passam com o fix.
- **Integração:** os mesmos 7 casos exercitam os endpoints `DELETE /api/students/{id}`,
  `/api/classes/{id}`, `/api/courses/{id}` e `/api/financial/plans/{id}` fim a fim.
- **Funcional:** suíte completa do backend, `154 passed, 1 skipped`, reexecutada de forma
  independente nesta sessão de QA.

## 10. Risco residual

- **Achado MÉDIA (QA):** `test_excluir_aluno_com_todas_dependencias` passa mesmo contra o
  código anterior ao fix, porque o SQLite de teste não tem `PRAGMA foreign_keys=ON` — o
  mecanismo específico "Carne apagado antes de Enrollment viola FK" só é recusado pelo
  Postgres de produção. Sugestão registrada em `QA.md`: ativar `PRAGMA foreign_keys=ON` na
  fixture de teste (mesmo padrão de `test_user_delete_regression.py`, da OC-2026-0002).
- **Lacuna não bloqueante:** exclusão de arquivo físico (Storage/disco) ao excluir aluno não
  foi verificada — fora do relato original, ver `base/00-LACUNAS.md`.
- Ambiente de produção (Render/Supabase) pode ainda não ter recebido este commit no momento
  em que o usuário relatou o defeito — só o deploy resolve isso (ver seção 11).

## 11. O que observar em produção

Depois do deploy do commit `a835e9f` (backend no Render): reproduzir manualmente a exclusão
de um aluno, uma turma e um curso com dados vinculados (matrícula, financeiro, avaliação,
frequência, certificado) e confirmar que cada um é removido com sucesso, sem "Erro ao
excluir". Conferir também a exclusão de um plano financeiro sem uso.

## 12. Sugestões de novas ocorrências percebidas e não feitas

- Ativar `PRAGMA foreign_keys=ON` na fixture de teste do backend, para que os testes de
  exclusão em cascata discriminem localmente os mesmos erros que só o Postgres de produção
  recusaria hoje — evitaria depender de QA manual em produção para pegar regressões futuras
  neste mecanismo.
- Remover arquivos físicos (Storage/disco) associados a um aluno quando ele é excluído —
  hoje só o registro no banco é removido; não constava no relato desta ocorrência.
