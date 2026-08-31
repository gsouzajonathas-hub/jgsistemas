# Sprint 05 — Tasks

Caminhos relativos à raiz do repositório. Status inicial de toda task: `pendente`.

---

## T-05.01 | Helper PDF (pdf-lib)

- **objetivo**: Criar `_shared/pdf.ts` com função `generatePdf({ title, blocks, logoUrl })` usando pdf-lib, replicando `report_style.py` (cabeçalho com logo + dados da escola).
- **cria**: `supabase/functions/app/_shared/pdf.ts`, `supabase/tests/pdf_test.ts`
- **altera**: `supabase/functions/app/deno.json` (import map @pdfme/pdf-lib)
- **teste_integracao**: `generatePdf({title:"Boletim", blocks:[]})` retorna Uint8Array com header `%PDF`.
- **teste_funcional**: PDF gerado tem a página 1 enriquecida com logo do instituto.
- **criterio_aceite**: função gera PDF válido (parseável) com timbre/logo.
- **depende_de**: T-01.03
- **paralelizavel**: true
- **status**: pendente

---

## T-05.02 | Helper Excel (SheetJS)

- **objetivo**: Criar `_shared/excel.ts` com `generateXlsx(sheetName, rows, headers)` usando SheetJS, replicando `student_sheet_service.py`.
- **cria**: `supabase/functions/app/_shared/excel.ts`, `supabase/tests/excel_test.ts`
- **altera**: `supabase/functions/app/deno.json` (import map xlsx)
- **teste_integracao**: `generateXlsx("Alunos", [[{n:"Joao"}]], ["n"])` retorna Uint8Array com header `PK`.
- **teste_funcional**: arquivo XLSX abrir em workbook com 1 planilha e 1 linha de dados.
- **criterio_aceite**: função gera XLSX válido com sheet+header+dados.
- **depende_de**: T-01.03
- **paralelizavel**: true
- **status**: pendente

---

## T-05.03 | Attendance CRUD

- **objetivo**: Migrar `POST /api/attendance` (marcar presença) e listagem por turma/data.
- **cria**: `supabase/functions/app/src/routes/attendance.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: POST marca presença de aluno em turma/data e retorna 201.
- **teste_funcional**: GET `/api/attendance?class_id=1&date=2026-09-01` lista presenças.
- **criterio_aceite**: presença marcada e consultada por filtro.
- **depende_de**: T-04.08, T-02.03
- **paralelizavel**: false
- **status**: pendente

---

## T-05.04 | Relatório de frequência PDF

- **objetivo**: Migrar `GET /api/attendance/report` — gera PDF de frequência da turma via `pdf.ts`.
- **cria**: `supabase/functions/app/src/routes/attendance_report.ts`
- **altera**: `supabase/functions/app/src/routes/attendance.ts`
- **teste_integracao**: GET `/api/attendance/report?class_id=1` retorna 200 com `Content-Type: application/pdf`.
- **teste_funcional**: PDF gerado contém nome da turma no cabeçalho.
- **criterio_aceite**: relatório de frequência PDF baixável.
- **depende_de**: T-05.01, T-05.03
- **paralelizavel**: false
- **status**: pendente

---

## T-05.05 | Evaluations + weight_config CRUD

- **objetivo**: Migrar CRUD de avaliações e cálculo de média ponderada por `weight_config`.
- **cria**: `supabase/functions/app/src/routes/evaluations.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: POST avaliação com nota 8.0 e peso 0.3; GET `/api/evaluations/:student_id` retorna a média calculada.
- **teste_funcional**: alterar `weight_config` muda o resultado da média.
- **criterio_aceite**: avaliação persistida e média respeita pesos.
- **depende_de**: T-04.03, T-02.03
- **paralelizavel**: true
- **status**: pendente

---

## T-05.06 | Boletim JSON/PDF/Excel

- **objetivo**: Migrar `GET /api/students/:id/boletim?format=json|pdf|xlsx` consolidando avaliações do aluno.
- **cria**: `supabase/functions/app/src/routes/boletim.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: GET com `format=json` retorna médias por disciplina; `format=pdf` retorna PDF; `format=xlsx` retorna XLSX.
- **teste_funcional**: boletim PDF possui nome do aluno no corpo.
- **criterio_aceite**: boletim exportável em 3 formatos com dados corretos.
- **depende_de**: T-05.01, T-05.02, T-05.05
- **paralelizavel**: false
- **status**: pendente

---

## T-05.07 | Certificados (PDF)

- **objetivo**: Migrar `POST /api/certificates` — gera PDF de certificado timbrado, grava em `certificates` e registra auditoria.
- **cria**: `supabase/functions/app/src/routes/certificates.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: POST gera PDF e insere 1 linha em `certificates`.
- **teste_funcional**: evento de auditoria `create_certificate` registrado.
- **criterio_aceite**: certificado PDF gerado + registro + auditoria.
- **depende_de**: T-05.01, T-03.07
- **paralelizavel**: false
- **status**: pendente

---

> **Total: 7 tasks.**