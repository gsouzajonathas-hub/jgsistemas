# Sprint 07 — Contrato do Frontend, Deploy e Relatório Técnico

## Objetivo

Fechar a entrega D-14: manter o contrato do frontend (axios baseURL `/api`) inalterado, configurar o deploy
na Vercel com rewrite para o Supabase Edge Function `app`, remover código supabase-sync do backend (D-05),
limpar configs legadas (Render/Fly), e produzir o **relatório técnico final em PT** com tempo total.

## Fases

| Fase | Descrição |
|---|---|
| F01 | Alinhar contrato do frontend + remover supabase-sync |
| F02 | Configs de deploy (Vercel rewrite → functions app) |
| F03 | Relatório técnico final em PT |

## Critério de saída

- [ ] Frontend chama `/api/*` e o rewrite da Vercel aponta para `https://<ref>.supabase.co/functions/v1/app` (D-13).
- [ ] Código de supabase-sync removido do backend e do frontend (D-05).
- [ ] Render.yaml removido/desativado; sem dependência do backend Python.
- [ ] Relatório técnico final em PT sobre o projeto completo, com tempo total de implementação registrado.

## Riscos conhecidos

- O rewrite real só funciona com projeto Supabase linkado (credentials — PENDENTE-01, não bloqueante). Até lá, documenta-se a config e a task final vira "aguardando acesso".
- Remover supabase-sync pode quebrar o frontend se ainda houver dependência; garantir que o token store segue via JWT próprio (D-06).

## Dependências de decisões

- D-13 (uma Edge Function `app` + rewrite), D-05 (remove supabase-sync), D-14 (critério de pronto)