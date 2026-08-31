# Sprint 05 — Acadêmico (frequência, avaliações, boletins PDF/Excel, certificados)

## Objetivo

Migrar os módulos acadêmicos, incluindo a geração de PDF (substituindo reportlab) e Excel
(substituindo openpyxl) usando bibliotecas puras em Deno: **@pdfme/pdf-lib** para PDF e **SheetJS (xlsx)** para Excel.
Inclui: attendance (com relatório), evaluations + weight_config, boletins (JSON+PDF+Excel), certificados (PDF).

## Fases

| Fase | Descrição |
|---|---|
| F01 | Utils de geração PDF (pdf-lib) + Excel (SheetJS) |
| F02 | Attendance + relatório de frequência (PDF) |
| F03 | Evaluations + weight_config |
| F04 | Boletins (JSON/PDF/Excel) |
| F05 | Certificados (PDF) |

## Critério de saída

- [ ] Geração de PDF via pdf-lib e Excel via SheetJS funcionando em Edge Function (sem openpyxl/reportlab).
- [ ] Controle de presença com relatório PDF.
- [ ] Cálculo de médias com peso configurável.
- [ ] Emissão de boletim (PDF/Excel) e certificado (PDF).

## Riscos conhecidos

- reportlab/openpyxl não rodam em Deno — **deve** usar pdf-lib + SheetJS (D-02).
- Geração de PDF grande pode exceder mal em Edge Function (limite de memória); trabalhar com buffers, não base64 intermediário.
- @pdfme usa templates; valide tamanho no limite free.

## Dependências de decisões

- D-02 (reecrita Deno pure libs), D-13 (rotas sob `/api`)