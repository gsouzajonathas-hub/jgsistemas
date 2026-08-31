# Sprint 05 — Fases

## F01 — Utils de geração PDF (pdf-lib) + Excel (SheetJS)

- **objetivo**: Criar `_shared/pdf.ts` (pdf-lib) e `_shared/excel.ts` (SheetJS) com helpers de documento timbrado (logo + header do instituto) que replicam `report_style.py`.
- **Tasks**: T-05.01, T-05.02
- **Critério de saída**: helper gera buffer PDF e buffer XLSX com dados de exemplo sem erro.
- **Roda em paralelo com**: nenhuma (fundação da sprint).

## F02 — Attendance + relatório de frequência (PDF)

- **objetivo**: Migrar `POST /api/attendance` (marcar presença) e `GET /api/attendance/report` (relatório PDF).
- **Tasks**: T-05.03, T-05.04
- **Critério de saída**: presença persistida; relatório PDF baixável.
- **Roda em paralelo com**: F03 (arquivos distintos).

## F03 — Evaluations + weight_config

- **objetivo**: Migrar CRUD de avaliações e configuração de pesos (nota para prova/trabalho/média).
- **Tasks**: T-05.05
- **Critério de saída**: avaliação persistida; cálculo de média respeita peso.
- **Roda em paralelo com**: F02.

## F04 — Boletins (JSON/PDF/Excel)

- **objetivo**: Portar `boletim` — gera boletim do aluno em JSON, PDF e Excel a partir das avaliações.
- **Tasks**: T-05.06
- **Critério de saída**: endpoint de boletim devolve JSON, PDF ou XLSX conforme formato solicitado.
- **Roda em paralelo com**: F05.

## F05 — Certificados (PDF)

- **objetivo**: Migrar emissão de certificados com geração de PDF timbrado e registro em `certificates`.
- **Tasks**: T-05.07
- **Critério de saída**: certificado PDF gerado e registro de auditoria criado.
- **Roda em paralelo com**: F04.