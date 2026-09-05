# Tasks — Sprint 03

> Um bloco por task. Repita o bloco abaixo para cada task da sprint, preenchendo TODOS os campos — nenhum é opcional. Na execução (F6), a linha `status` é atualizada em cada transição; ao concluir, acrescente data e resultado da suíte.

---

```yaml
id: T-03.01
titulo: Teste do content-disposition REC-{ano}-{contagem}.pdf
objetivo: Escrever teste pytest em backend/tests/test_material_receipt.py que cria uma venda de material (fixture material_sale_ctx), chama GET /api/materials/sales/{id}/receipt e assere status 200, media_type application/pdf e Content-Disposition contendo f"recibo-REC-{ano}-{contagem}.pdf".
arquivos:
  cria: [backend/tests/test_material_receipt.py]
  altera: []
teste_integracao: O teste cobre o endpoint real com autenticação e fixtures idempotentes.
teste_funcional: Dada uma venda no ano 2026, o header de resposta contém recibo-REC-2026-00001.pdf (ou contagem coerente com o total).
criterio_aceite: Teste falha (red) antes da implementação — prova que o formato atual MAT-{id:06d} não atende — e passa após T-03.02.
depende_de: [T-01.01]
paralelizavel: false
status: concluida  # 2026-09-05 · RED: 2 falharam — Content-Disposition atual "recibo-material-1.pdf", sem REC
```

---

```yaml
id: T-03.02
titulo: Implementar numeração REC-{ano}-{contagem} no serviço/rota
objetivo: Em backend/app/routes/materials.py (rotina material_receipt, L182) e/ou backend/app/services/material_receipt_service.py (L105), substituir f"MAT-{sale.id:06d}" pela contagem anual de vendas de material no ano da venda, replicando o critério do Financeiro (financial.py:577-580): contar as vendas daquele ano e montar f"REC-{ano}-{contagem:05d}"; o helper build_material_receipt_pdf já recebe receipt_number — só alimentá-lo corretamente.
arquivos:
  cria: []
  altera: [backend/app/routes/materials.py, backend/app/services/material_receipt_service.py]
teste_integracao: T-03.01 verde; GET do recibo retorna PDF com o número esperado.
teste_funcional: Duas vendas no mesmo ano geram REC-{ano}-00001 e REC-{ano}-00002; vendas em anos diferentes não colidem.
criterio_aceite: T-03.01 verde; pytest completo 0 failed; nenhum teste existente quebrou.
depende_de: [T-03.01]
paralelizavel: false
status: concluida  # 2026-09-05 · suíte: 65 passed, 0 failed (REC-{ano}-{contagem:05d} na rota + helper com fallback)
```

---

```yaml
id: T-03.03
titulo: Teste vitest do clique no botão Recibo
objetivo: Em frontend/src/__tests__/Financial.test.tsx (teste-exemplo da T-01.03), stubbar materialsAPI.receipt resolvendo um Blob, clicar no botão "Recibo" da linha da venda e asserir que a API foi chamada com o id da venda e que o download foi disparado (URL.createObjectURL/click spy).
arquivos:
  cria: []
  altera: [frontend/src/__tests__/Financial.test.tsx]
teste_integracao: Teste renderiza a SalesTab com mock de services/api.
teste_funcional: Clicando em "Recibo" na venda X, materialsAPI.receipt(X) é chamado e um blob é baixado.
criterio_aceite: Teste falha (red) antes do botão existir e passa após T-03.04.
depende_de: [T-01.03]
paralelizavel: false
status: concluida  # 2026-09-05 · RED: 3 tests, 1 failed — botão Recibo não existe na SalesTab
```

---

```yaml
id: T-03.04
titulo: Botão Recibo na SalesTab (padrão downloadReceipt)
objetivo: Em frontend/src/pages/Financial.tsx, na linha de cada venda de material (SalesTab), adicionar ação "Recibo" que chama materialsAPI.receipt(sale.id), converte a resposta em blob e dispara o download com o nome vindo do Content-Disposition — reaproveitando o fluxo downloadReceipt já usado para mensalidades (L69-84).
arquivos:
  cria: []
  altera: [frontend/src/pages/Financial.tsx]
teste_integracao: T-03.03 verde com a implementação.
teste_funcional: Na tela de materiais didáticos, cada venda tem o botão Recibo clicável que baixa o PDF.
criterio_aceite: T-03.03 verde; build frontend exit 0; nenhum teste existente quebrou.
depende_de: [T-03.03]
paralelizavel: false
status: concluida  # 2026-09-05 · suíte: 38 passed/12 files (tsc --noEmit limpo); botão Recibo + download com Content-Disposition
```