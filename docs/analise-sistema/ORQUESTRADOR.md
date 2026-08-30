# Orquestrador — analise-sistema

> Porta de entrada da execução. Escrito para quem abriu o repositório agora e não sabe nada. Só caminhos relativos; nunca o valor de um segredo.

## 1. Objetivo

Reativar de ponta a ponta os módulos de Turmas, Frequência, Avaliações, Boletim e Certificados do sistema de gestão escolar (hoje desligados no backend e quebrados no frontend), criando a fundação de testes (pytest + vitest), corrigindo as lacunas decididas (404 em student-profile, timeout SMTP 30s, remoção de `subscriptions`) e validando o fluxo completo via teste de integração + checklist manual no navegador — com tudo rodando local e pronto para entregar ao cliente.

## 2. Mapa e ordem de leitura

1. Este arquivo (`ORQUESTRADOR.md`)
2. `00-DECISOES.md` — decisões que governam o plano (D-01 a D-16)
3. `base/00-INDICE.md` — e os arquivos da base que ele lista (núcleo backend, rotas, serviços, frontend, infra, testes)
4. `sprint-01/sprint.md` → `fases.md` → `tasks.md`
5. `sprint-02/sprint.md` → `fases.md` → `tasks.md`
6. `sprint-03/sprint.md` → `fases.md` → `tasks.md`
7. `00-BLOQUEIOS.md` — bloqueios registrados durante a execução
8. `00-AUDITORIA.md` — achados MÉDIA/BAIXA que permanecem válidos (criado na F5)

## 3. Rota de execução

- Sprint 01: F-01.1 ∥ F-01.2 (paralelas entre si)
- Sprint 02: F-02.1 ∥ F-02.2 (paralelas entre si) → F-02.3
- Sprint 03: F-03.1 → F-03.2 → F-03.3 → F-03.4 (sequencial)
- Sprints rodam em sequência: 01 → 02 → 03 (nenhum paralelismo entre sprints foi declarado).

**Caminho crítico:** T-01.01 → T-01.03 → T-02.01 → T-02.02 → (T-02.03 → T-02.07) → [frontend] T-03.01 → T-03.02 → (T-03.04 ∥ T-03.05) → T-03.03 → T-03.06 → T-03.07 → T-03.08 (que também aguarda T-02.07). As branches backend e frontend convergem em T-03.08 (checklist manual), que é o fim do caminho crítico.

## 4. Ferramentas

- **MCPs / SDKs:** nenhum além do padrão; as integrações existentes (Z-API, SMTP, Supabase) são usadas sob mock/monkeypatch nos testes — nunca chamadas reais na suíte.
- **Testes backend:** `pytest` (rodar em `backend/`, com `backend/requirements-dev.txt` instalado)
- **Testes frontend:** `npm run test` (em `frontend/`; equivale a `vitest run`)
- **Lint:** NÃO EXISTE NO PROJETO
- **Typecheck:** `npx tsc --noEmit` (em `frontend/`); build completo via `npm run build` (tsc && vite build)
- **Segredos:** `SECRET_KEY`, `DATABASE_URL`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `CORS_ORIGINS`, `FRONTEND_URL`, `SMTP_HOST/PORT/USER/PASS/FROM`, `ZAPI_INSTANCE_URL`/`ZAPI_TOKEN`, `SUPABASE_URL`/`SUPABASE_ANON_KEY`, `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` — ficam em `.env` local (fora do git,`.gitignore`) e em env vars do deploy quando houver (D-10). NUNCA escreva o valor.

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

Para a feature inteira estar entregue, TODOS os itens abaixo são verdade:

1. `pytest` em `backend/` verde (0 failed), incluindo o teste E2E completo (professor → turma → matrícula → frequência → avaliações → boletim → certificado), o teste financeiro crítico e os testes das correções (D-12, D-16).
2. As 4 tabelas (`attendances`, `evaluations`, `certificates`, `grade_weight_configs`) são criadas pelo startup (D-05); os 7 routers respondem em `/api/*` (D-04).
3. `vitest run` em `frontend/` verde (0 failed) com as 5 páginas reativadas testadas.
4. `npm run build` em `frontend/` termina com código de saída 0 (build limpo — D-12).
5. As 5 rotas (`/classes`, `/attendance`, `/evaluations`, `/boletins`, `/certificates`) acessíveis por usuário com a permissão correspondente e bloqueadas sem ela.
6. `GET /api/student-profile/{id}` de aluno inexistente responde 404 (D-15); envio de e-mail com timeout=30s (D-14); `subscriptions` ausente do script de migração (D-13).
7. Ações de frequência, avaliações e turmas gravam em `audit_logs` (D-08).
8. Checklist manual do fluxo E2E (`sprint-03/checklist-e2e-manual.md`) preenchido com todas as etapas marcadas como validado no navegador (D-16).

## 8. Como retomar uma sessão interrompida

1. Leia este arquivo inteiro.
2. Leia o `status` de cada task em cada `sprint-NN/tasks.md`.
3. Leia `00-BLOQUEIOS.md`.
4. Continue da primeira task `pendente` ou `em_andamento` cujas dependências (`depende_de`) estão todas `concluida`. Ignore as `bloqueada` até que o bloqueio registrado seja resolvido.