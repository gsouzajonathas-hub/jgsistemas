# Exclusão em cascata — Alunos, Turmas, Cursos e Planos Financeiros

## O que é e onde vive

Rotas de exclusão (`DELETE`) das entidades principais do sistema:

- `backend/app/routes/students.py:305` — `delete_student`
- `backend/app/routes/classes.py:112` — `delete_class`
- `backend/app/routes/courses.py:69` — `delete_course`
- `backend/app/routes/financial.py:164` — `delete_plan` (financial_plans)

No frontend, cada tela chama a API e mostra alerta genérico quando o backend não retorna
`detail`: `frontend/src/pages/Students.tsx:30-38`, `frontend/src/pages/Classes.tsx` (handler
próximo à linha 27), `frontend/src/pages/Courses.tsx` (linha 42). Todas usam
`ConfirmDialog` (`frontend/src/components/ConfirmDialog.tsx`) para a confirmação — já
padronizado desde a OC-2026-0002.

## Contrato de entrada

- `DELETE /api/students/{student_id}` — sem payload, requer permissão `students`.
- `DELETE /api/classes/{class_id}` — sem payload, requer permissão `classes`.
- `DELETE /api/courses/{course_id}` — sem payload, requer permissão `courses`.
- `DELETE /api/financial/plans/{plan_id}` — sem payload, requer permissão `financial`.

## Contrato de saída

- Sucesso: `200 {"message": "... excluído(a) com sucesso"}` e o registro é removido do banco.
- Bloqueio de negócio (matrícula ativa, turma vinculada, plano em uso): `400` com `detail`
  explicando o motivo — não é o defeito relatado.
- Antes do fix (`a835e9f`): `500` sem `detail` estruturado quando havia dependências
  (`IntegrityError` do Postgres, ou `AttributeError` no caso do plano) — é o defeito relatado,
  pois o frontend cai no fallback genérico "Erro ao excluir X" (`Students.tsx:36`).

## Estrutura de dados

Tabelas com FK para `students.id` (sem `ondelete` — a limpeza é feita na aplicação, não no
banco): `file_uploads.student_id`, `evaluations.student_id`, `attendances.student_id`,
`certificates.student_id`, `carnets.student_id`, `installments.student_id`,
`discounts.student_id`, `material_sales.student_id`, `financial_contracts.student_id`,
`enrollments.student_id` (`backend/app/models/*.py`, ver `01-CAUSA-RAIZ.md` para a lista
completa por arquivo).

Tabelas com FK para `class_groups.id`: `enrollments.class_group_id`,
`evaluations.class_group_id`, `attendances.class_group_id`, `certificates.class_group_id`,
`grade_weight_configs.class_group_id`.

Tabelas com FK para `courses.id`: `class_groups.course_id` (bloqueia exclusão do curso, não é
apagada), `financial_plans.course_id` (nullable — desvinculada, não apagada).

`carnets.enrollment_id` referencia `enrollments.id` — a ordem de exclusão importa: apagar a
matrícula antes do carnê viola essa FK (mecanismo exato da causa raiz, ver `01-CAUSA-RAIZ.md`).

## Funções e trechos relevantes

Trecho atual (pós-fix) de `delete_student`, ordem que evita a violação de FK:

```
await db.execute(sa_delete(Payment).where(Payment.installment_id.in_(inst_ids)))
await db.execute(sa_delete(Installment).where(inst_filter))
# Ordem importa: Carne.enrollment_id referencia enrollments — apaga os carnês
# ANTES das matrículas, senão o Postgres viola a FK (remove o erro de exclusão).
await db.execute(sa_delete(Carne).where(Carne.student_id == student_id))
...
await db.execute(sa_delete(Enrollment).where(Enrollment.student_id == student_id))
```
`backend/app/routes/students.py:332-340`

## Quem chama e quem é chamado

**Chamadores:** `Students.tsx:32` (`studentsAPI.delete`), `Classes.tsx` (handler de exclusão),
`Courses.tsx` (handler de exclusão) — todos via `frontend/src/services/api.ts`.

**Dependências:** banco de dados (Postgres em produção via Supabase, SQLite em dev/local),
sessão `AsyncSession` do SQLAlchemy (`app/database.py`).

## Testes existentes

`backend/tests/test_exclusao_cascata.py` (criado no commit `a835e9f`, 7 testes) cobre:
aluno com todas as dependências saturadas, turma com peso/matrícula inativa/carnê, turma com
matrícula ativa (bloqueio 400), curso com plano vinculado (desvincula), curso com turma
(bloqueio 400), plano em uso por carnê (bloqueio 400), plano limpo (sucesso). Rodados nesta
sessão: **7 passed**. Suíte completa do backend: **154 passed, 1 skipped**.

Não coberto por teste automatizado: exclusão via Supabase Storage direto (arquivos físicos
de upload) — `FileUpload` é apagado do banco, mas o arquivo em disco/Storage não é removido
neste fluxo (não fazia parte do relato do usuário; fora do escopo desta ocorrência).

## Limites e regras de negócio conhecidas

- Turma com matrícula **ativa** não pode ser excluída (`classes.py:118-122`) — bloqueio
  intencional, `400`, não é o defeito.
- Curso com turma vinculada não pode ser excluído (`courses.py:78-85`) — bloqueio intencional.
- Plano financeiro em uso por carnê/parcela não pode ser excluído (`financial.py`, ver
  `01-CAUSA-RAIZ.md`) — bloqueio intencional.

## Riscos para esta ocorrência

Nenhum: o fix já está aplicado e coberto por teste de regressão que satura as FKs
propositalmente. O risco remanescente é de **deploy**: se o ambiente de produção (Render) e
o Supabase (Postgres) não tiverem recebido este commit, o usuário continua vendo o defeito
mesmo com o código corrigido no repositório.

## Fonte

`backend/app/routes/students.py`, `backend/app/routes/classes.py`,
`backend/app/routes/courses.py`, `backend/app/routes/financial.py`,
`backend/app/models/*.py`, `backend/tests/test_exclusao_cascata.py`,
`frontend/src/pages/Students.tsx`, `frontend/src/pages/Classes.tsx`,
`frontend/src/pages/Courses.tsx`, commit `a835e9f` — mapeado em 2026-09-10
