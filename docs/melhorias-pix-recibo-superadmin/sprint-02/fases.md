# Fases — Sprint 02

> Um bloco por fase. Repita o bloco quantas vezes forem necessárias. O paralelismo declarado aqui é definitivo: a execução nunca decide paralelismo sozinha.

---

## F-02.1 — Backend: reprodução L2 e persistência do PIX

**Objetivo:** provar por teste onde está o defeito do PIX (persistência) antes de tocar em código — seguindo a regra da lacuna L2 — e, se o backend falhar, corrigir de forma mínima.

**Tasks que a compõem:** T-02.01, T-02.02, T-02.03

**Critério de saída:** existe um teste de reprodução que falha (ou passa) com evidência documentada em `base/00-LACUNAS.md`; se houver correção no backend, teste de regressão garante que PUT nunca zera `pix_key`.

**Roda em paralelo com:** F-02.2

---

## F-02.2 — Frontend: seguro no salvamento do PIX (D-12) e cache coerente

**Objetivo:** alterar o `handleSave` de `Settings.tsx` para manter o formulário digitado e mostrar "Erro ao salvar. Tente novamente." em falha (D-12), e garantir que o cache global (`useSettings`) reflete o que o servidor confirmou (evita a hipótese H2 de cache velho).

**Tasks que a compõem:** T-02.04, T-02.05

**Critério de saída:** testes vitest provam que em falha da API o formulário mantém a chave digitada e a mensagem aparece; em sucesso o cache recebe a resposta do servidor.

**Roda em paralelo com:** F-02.1