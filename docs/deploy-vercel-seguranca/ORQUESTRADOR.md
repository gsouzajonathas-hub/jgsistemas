# Orquestrador — deploy-vercel-seguranca

> Porta de entrada da execução. Escrito para quem abriu o repositório agora e não sabe nada. Só caminhos relativos; nunca o valor de um segredo.

## 1. Objetivo

Migrar por completo o backend FastAPI/Python para o ecossistema Supabase como **uma Edge Function única `app`** (Deno/TypeScript) com roteamento interno, preservando o contrato do frontend (axios baseURL `/api`). Banco Supabase Postgres limpo, uploads em Supabase Storage, auth JWT HS256 próprio, geração de PDF/XLSX com libs puras (pdf-lib/SheetJS), email via Resend, configs de deploy na Vercel e relatório técnico final em PT.

## 2. Mapa e ordem de leitura

1. Este arquivo (`ORQUESTRADOR.md`)
2. `00-DECISOES.md` — decisões D-01..D-14 que governam o plano
3. `base/00-INDICE.md` — e os arquivos da base que ele lista
4. `sprint-01/sprint.md` → `fases.md` → `tasks.md`
5. `sprint-02/` → `sprint-03/` → `sprint-04/` → `sprint-05/` → `sprint-06/` → `sprint-07/`, cada um (sprint.md → fases.md → tasks.md)
6. `00-BLOQUEIOS.md` — bloqueios registrados durante a execução
7. `00-AUDITORIA.md` — achados MÉDIA/BAIXA que permanecem válidos

## 3. Rota de execução

- **Sprint 01** (capacidade de testar): F01 → (F02 ∥ F03)
- **Sprint 02** (infra core): F01 → (F02 ∥ F03)
- **Sprint 03** (auth): F01 → (F02 ∥ F03 ∥ F04)
- **Sprint 04** (cadastro): F01 → (F02 ∥ F04) | F03 (depende F01) | F05 (depende F04)
- **Sprint 05** (acadêmico): F01 → (F02 ∥ F03) → (F04 ∥ F05)
- **Sprint 06** (financeiro/agenda/relatórios): F01 → (F02 ∥ F03) + (F04 ∥ F05 ∥ F07); F06 (relatórios, depende T-06.06)
- **Sprint 07** (deploy/relatório): F01 → F02; F03 (relatório) no estado final

**Caminho crítico:** T-01.01 → T-01.02 → T-01.03 → T-01.04 → (T-02.03 → T-03.01 → T-03.03 → T-03.04) → T-04.03 → T-04.04 → ... → T-05.06 → T-06.06 → T-07.04. Este é o fio que define a duração total — cada sprint depende do esqueleto `app` (T-01.03) e do JWT middleware (T-02.03).

## 4. Ferramentas

- **MCPs / SDKs:** Supabase CLI 2.115.0 (`supabase`), Docker Desktop 29.4.3, Node v24.13.1; SDKs Deno: `@supabase/supabase-js`, `hono`, `bcryptjs`, `@pdfme/pdf-lib`, `xlsx` (SheetJS), WebCrypto `crypto.subtle`.
- **Testes:** `supabase test .` (Deno test via Edge Runtime; testes em `supabase/tests/`)
- **Lint:** NÃO EXISTE NO PROJETO (para Edge Functions; `deno fmt` opcional se Deno instalado)
- **Typecheck:** NÃO EXISTE NO PROJETO (Deno faz typecheck na execução; validar via `supabase functions serve`)
- **Segredos:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, `CORS_ORIGINS`, `FRONTEND_URL` — ficam em `supabase/functions/app/.env` (NUNCA committar; `.env.example` documenta).

## 5. Agentes

- **Implementador** — escreve primeiro os dois testes da task, vê ambos falharem, implementa até passarem.
- **Revisor de testes** — antes de aceitar o verde, responde: este teste falharia com uma implementação errada? Se não, o teste volta.
- **Auditor de aceite** — verifica de fato o `criterio_aceite` da task antes de permitir `status: concluida`.

**Agente único:** assume os três papéis em sequência dentro de cada task, nesta ordem, tratando cada papel como um portão — não avança ao papel seguinte sem fechar o anterior.

## 6. Regras de autonomia

1. Não pergunte nada; não peça autorização para nada.
2. O teste vem antes do código, sempre.
3. Task só é `concluida` com teste de integração E funcional passando e `criterio_aceite` verificado. Não existe "concluído com ressalva".
4. Dúvida nova ou pré-requisito faltando: registrar em `00-BLOQUEIOS.md` (`B-NN | task | bloqueio | o que destravaria`), marcar a task `bloqueada`, pular para a próxima paralelizável. Nunca parar e esperar.
5. Só rode em paralelo o que o plano declarou paralelizável; a execução nunca decide paralelismo.
6. Atualize `status` em `tasks.md` a cada transição; ao concluir, acrescente data e resultado da suíte.
7. Critério de saída de fase/sprint não atendido = não avança.

## 7. Definição de pronto global

- Edge Function `app` migra todos os endpoints do FastAPI com JWT próprio (D-06) e roteamento interno (D-13), sem login Supabase (D-05).
- Banco Supabase Postgres limpo (D-03); uploads em Storage com buckets privado/público (D-04).
- Geração PDF (pdf-lib) e XLSX (SheetJS); email via Resend (D-08/D-09); WhatsApp off (D-11).
- Contrato do frontend preservado (baseURL `/api`); build do frontend OK; supabase-sync removido (D-05).
- Configs de deploy Vercel prontas (rewrite → `functions/v1/app`) (D-13/D-10).
- Testes de integração e funcionais verdes por task; relatório técnico final em PT com tempo total (D-14).
- Deploy remoto real documentado como guia (codebase + testes contra stack local; credencial de produção é PENDENTE-01).

## 8. Como retomar uma sessão interrompida

1. Leia este arquivo inteiro.
2. Leia o `status` de cada task em cada `sprint-NN/tasks.md`.
3. Leia `00-BLOQUEIOS.md`.
4. Continue da primeira task `pendente` ou `em_andamento` cujas dependências (`depende_de`) estão todas `concluida`. Ignore as `bloqueada` até que o bloqueio registrado seja resolvido.
