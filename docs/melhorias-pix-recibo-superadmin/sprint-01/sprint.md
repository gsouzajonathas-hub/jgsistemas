# Sprint 01 — Capacidade de teste para as novas áreas

## Objetivo

Prepara a capacidade de testar as três entregas do roadmap (chave PIX, recibo de material e conta super admin): fixtures de backend, padrão de mock do frontend e verificação do baseline das suítes — sem funcionalidade de negócio.

## Fases

| Fase | Título | Roda em paralelo com |
|---|---|---|
| F-01.1 | Fixtures de backend para as três áreas | F-01.2 |
| F-01.2 | Baseline frontend: comandos, mocks e testes de referência | F-01.1 |

Detalhe de cada fase em `fases.md`; tasks em `tasks.md`.

## Critério de saída

As fixtures das três áreas existem em `backend/tests/`, o padrão de mock do `services/api` está documentado em um teste-exemplo, e as duas suítes rodam com os comandos registrados terminando com `0 failed`.

## Riscos conhecidos

- B-01: senha do `admin@jgsistemas.com.br` desconhecida — QA funcional (E4) em produção depende de credencial (registrado em `00-BLOQUEIOS.md`).
- B-02: deploy manual via Vercel CLI obrigatório (integração git aponta para repositório renomeado).
- B-03: redeploy do backend (Render) pendente.
- Lacuna L2 (causa do PIX) só será confirmada com o teste de reprodução da Sprint-02; nenhum fixture depende do desfecho.