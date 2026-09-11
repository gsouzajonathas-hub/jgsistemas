# Área de conhecimento — Exclusao de aluno, cascata de FKs e verificacao de deploy

> Arquivo de área: NÃO leva frontmatter (o painel lê apenas o índice e as lacunas).

## O que o sistema faz hoje

- `DELETE /api/students/{student_id}` (`backend/app/routes/students.py:305-346`) — a rota mais recente cobre **os 11 relacionamentos** que apontam para o aluno:
  1. `FileUpload.student_id` — apaga antes.
  2. `Evaluation.student_id` — apaga antes.
  3. `Attendance.student_id` — apaga antes.
  4. `Certificate.student_id` — apaga antes.
  5. `Payment.installment_id` (parcelas de carnês do aluno) — apaga via subselect nos `Installment.id`.
  6. `Installment.student_id` / `Installment.carnet_id` — apaga pelo filtro composto (`or_`).
  7. `Carne` **antes** das matrículas — comentário no código: "Ordem importa: Carne.enrollment_id referencia enrollments — apaga os carnês ANTES das matrículas, senão o Postgres viola a FK" (`students.py:334-336`).
  8. `Discount.student_id` — apaga.
  9. `MaterialSale.student_id` — apaga.
  10. `FinancialContract.student_id` — apaga.
  11. `Enrollment.student_id` — apaga por último (antes do `Student`).
- `backend/app/main.py:259-261` — `/api/health` retorna **apenas** `{"status":"ok","message":"Sistema de gestão escolar"}`: texto fixo, **não consulta o banco nem expõe versão/build** do código rodando.

## Comportamento comprovado

- `backend/tests/test_exclusao_cascata.py::test_excluir_aluno_com_todas_dependencias` (linha 55): cria aluno com **todas** as dependências possíveis — matrícula, carnê (com `enrollment_id`), parcela + pagamento, desconto, upload de arquivo, responsável, venda de material, contrato financeiro, avaliação, frequência e certificado — e o `DELETE` retorna 200 com contagem zero nas 12 tabelas. **VERDE** na suíte local.
- O mesmo erro de produção **não reproduz localmente**: o código e o banco de teste (SQLite com `PRAGMA foreign_keys=ON`) excluem qualquer aluno.

## Lacunas identificadas

- L-01 (bloqueio real da investigação): **não há como saber qual versão do código está rodando no Render.** O `/api/health` responde texto fixo; um deploy que falhou silenciosamente (build quebrado, imagem antiga, restart sem pull) continuaria "saudável". Para confirmar a hipótese do deploy defasado (OC-2026-0005/`a835e9f`), o health check precisa expor versão (ex.: commit SHA injetado no build/`GIT_SHA`) e opcionalmente validar conectividade com o banco. Sem isso, a OC-2026-0006 fica pendente de confirmação.

## Referências

- `docs/manutencao/OC-2026-0005-*` (fix da exclusão em cascata — commit `a835e9f`).
- `docs/manutencao/OC-2026-0002-usuarios-nao-sao-excluidos/` — ocorrência anterior do mesmo padrão (FK sem cascade → 500, fix na rota).
- `.claude/skills/runx/references/00-schema.md` — contrato de frontmatter.