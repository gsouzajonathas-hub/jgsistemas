# Fases — Sprint 03

> Um bloco por fase. Repita o bloco quantas vezes forem necessárias. O paralelismo declarado aqui é definitivo: a execução nunca decide paralelismo sozinha.

---

## F-03.1 — Backend: numeração REC-{ano}-{contagem} no recibo de material

**Objetivo:** alinhar o número do recibo de material ao formato usado pelo Financeiro, calculando a contagem anual de vendas de material no ano da venda e gerando o arquivo com o nome `recibo-REC-{ano}-{contagem}.pdf`.

**Tasks que a compõem:** T-03.01, T-03.02

**Critério de saída:** teste pytest prova que o PDF retorna com o `Content-Disposition` no formato `recibo-REC-{ano}-{contagem}.pdf` e que contagens de anos distintos não colidem.

**Roda em paralelo com:** F-03.2

---

## F-03.2 — Frontend: botão Recibo na listagem de vendas de material

**Objetivo:** adicionar, na linha de cada venda de material da SalesTab, um botão "Recibo" que chama `materialsAPI.receipt(sale.id)`, baixa o blob e dispara o download — seguindo o padrão `downloadReceipt` do Financeiro.

**Tasks que a compõem:** T-03.03, T-03.04

**Critério de saída:** teste vitest prova que o clique no botão chama a API de recibo e dispara o download do blob; visualmente o botão aparece por venda.

**Roda em paralelo com:** F-03.1