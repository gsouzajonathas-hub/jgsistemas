---
expx_schema: 1
expx_tool: runx
kind: orquestrador
trabalho_id: OC-2026-0002
titulo: Usuarios nao sao excluidos nas configuracoes
tipo_trabalho: ocorrencia
tipo_ocorrencia: bug
estagio: e5
status: concluido
criado_em: 2026-09-04
atualizado_em: 2026-09-05
concluido_em: 2026-09-05
sprints: [sprint-01]
caminho_critico: [T-01.01, T-01.02, T-01.03, T-01.04]
---

> Frontmatter obrigatorio (expx-schema v1). Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

# Orquestrador — OC-2026-0002: Usuarios nao sao excluidos nas configuracoes

> Porta de entrada da execução. Escrito para quem abriu o repositório agora e não sabe nada. Só caminhos relativos; nunca o valor de um segredo.

## 1. Objetivo

O usuário relatou que **não consegue excluir usuários em Configurações** e pediu que, além de validar Criar/Editar/Excluir, **toda exclusão de usuário ou de qualquer opção importante abra uma tela de confirmação com mensagem clara e botão vermelho ou amarelo** (segunda chance antes de executar). A causa raiz foi comprovada no E1 por teste de regressão: usuários com histórico de auditoria não podem ser excluídos porque as FKs `audit_logs.user_id` e `communication_logs.sent_by` não têm `ondelete` (IntegrityError → 500), e o frontend engole a falha (sem try/catch). Esta ocorrência corrige a exclusão no backend, cria o modal de confirmação `ConfirmDialog` e o aplica em todas as telas com exclusão destrutiva.

## 2. Mapa e ordem de leitura

1. Este arquivo (`ORQUESTRADOR.md`)
2. `00-OCORRENCIA.md` — o chamado como chegou
3. `01-CAUSA-RAIZ.md` — a causa comprovada e as decisões D-01 a D-05 que governam o plano
4. `base/00-INDICE.md` — e os arquivos da base que ele lista (área de exclusão de usuários, lacunas)
5. `sprint-01/sprint.md` → `fases.md` → `tasks.md`
6. `BLOQUEIOS.md` — B-01 (senha admin) e B-02 (deploy manual via CLI)
7. `QA.md` — a criar no E4

## 3. Rota de execução

- Sprint 01: F-01.1 → F-01.2 → F-01.3 — sequencial; todas as tasks têm `depende_de` não vazio (exceto T-01.01) e nenhuma é paralelizável.

**Caminho crítico:** T-01.01 → T-01.02 → T-01.03 → T-01.04 (T-01.05 e T-01.06 entram na cadeia em seguida). T-01.01 já está com `suite: vermelha` — a prova do E1.

## 4. Ferramentas

- **Testes:** backend `python -m pytest -q` (na pasta `backend/`); frontend `npm test` (na pasta `frontend/` — vitest)
- **Lint:** NÃO EXISTE NO PROJETO
- **Typecheck:** `npm run build` (na pasta `frontend/` — roda `tsc && vite build`); backend não tem typecheck
- **MCPs / SDKs:** nenhum além do padrão
- **Segredos:** senha do `admin@jgsistemas.com.br` — só com o usuário (NUNCA escrever o valor); token da Vercel e do Render — `.env` local de quem opera. NUNCA escreva o valor.

## 5. Papéis dentro de cada task

- **Implementador** — escreve o teste primeiro, vê falhar, implementa o mínimo até passar.
- **Revisor de testes** — antes de aceitar o verde, responde: este teste falharia com uma implementação errada? Se não, o teste volta.
- **Auditor de aceite** — verifica de fato o `criterio_aceite` da task antes de permitir `status: concluida`.

**Agente único:** assume os três papéis em sequência dentro de cada task, nesta ordem, tratando cada papel como um portão. A aprovação final da ocorrência NÃO é feita aqui: é o E4 QA, papel distinto do E3.

## 6. Regras de autonomia

1. Não pergunte nada; não peça autorização para nada.
2. O teste vem antes do código, sempre. O teste de regressão (T-01.01) JÁ FALHOU no E1 — se ele passar antes do fix, pare e volte ao E1.
3. Task só é `concluida` com teste de integração E funcional passando, suíte inteira verde e `criterio_aceite` verificado. Não existe "concluído com ressalva".
4. Escopo travado: não toque em arquivo fora de `01-CAUSA-RAIZ.md` e de `tasks.md`. Nada de refactor de brinde.
5. Dúvida nova ou pré-requisito faltando: registrar em `BLOQUEIOS.md`, marcar a task `bloqueada`, pular para a próxima paralelizável. Nunca parar e esperar.
6. Só rode em paralelo o que o plano declarou paralelizável; a execução nunca decide paralelismo.
7. Atualize `status` em `tasks.md` e `fases.md` a cada transição; ao concluir, acrescente data e resultado da suíte.
8. Critério de saída de fase/sprint não atendido = não avança.

## 7. Definição de pronto da ocorrência

- [ ] O teste de regressão T-01.01 (usuário com histórico) falhava antes do fix e passa agora, sem alteração do teste.
- [ ] Usuários com ou sem histórico são excluídos via API (200); registros de auditoria e comunicação permanecem com user_id/sent_by NULL; último admin ativo não pode ser excluído (400).
- [ ] Todas as exclusões destrutivas (Settings/Usuários + Carnes, Contratos, Planos, Avaliações, Financeiro, Agenda, Cursos, Professores, Alunos, Turmas) passam pelo modal `ConfirmDialog` com botão vermelho/amarelo; nenhum `window.confirm` restante.
- [ ] `pytest` (backend) 0 failed, `vitest` (frontend) 0 failed, `npm run build` exit 0.
- [ ] Nenhum arquivo fora do escopo declarado (01-CAUSA-RAIZ.md + tasks.md) foi alterado.
- [ ] Deploy manual via Vercel CLI da raiz do repo feito e `/api/health` respondendo 200 em produção.
- [ ] QA em produção (E4): exclusão de usuário pela UI em `https://jgsistemas.dev.br` (depende de B-01 — senha admin).

## 8. Como retomar uma sessão interrompida

1. Leia este arquivo inteiro.
2. Leia o `status` de cada task em `sprint-01/tasks.md`.
3. Leia `BLOQUEIOS.md`.
4. Continue da primeira task `pendente` ou `em_andamento` cujas dependências (`depende_de`) estão todas `concluida`. Ignore as `bloqueada` até que o bloqueio registrado seja resolvido.

---

### RETOMADA — 2026-09-04 (E3 em andamento)

**Onde paramos:** E1 completo (causa raiz comprovada por teste VERMELHO — `backend/tests/test_user_delete_regression.py` rodado e falhando com IntegrityError) e E2 completo (plano gravado em `sprint-01/`). Estágio atual: `e3`.

**Próximos passos:**
1. T-01.02: fix do backend (`delete_user` com limpeza de dependências + `ondelete` nos models + guarda do último admin) + testes extras; rodar `pytest` inteiro.
2. T-01.03: criar `ConfirmDialog` + teste.
3. T-01.04: aplicar em Settings + teste.
4. T-01.05: aplicar nas demais telas (10 páginas).
5. T-01.06: suíte completa, build, commit, push.
6. Deploy manual via Vercel CLI da raiz + verificação `/api/health`.
7. E4 QA em produção (pedir senha admin ao usuário) e E5 relatório.

**Bloqueios vigentes:** B-01 (senha admin para QA), B-02 (deploy manual obrigatório — integração git Vercel aponta para repo renomeado).

---

### ENCERRAMENTO — 2026-09-05

B-02 confirmado resolvido (ver `BLOQUEIOS.md`) — Render e Vercel respondendo 200 em produção após os fixes das ocorrências OC-2026-0003 e OC-2026-0004.

O fix de exclusão de usuários (limpeza de FKs, guarda do último admin) e o `ConfirmDialog` aplicado em todas as telas destrutivas estão implementados, testados (suíte verde) e em produção desde o commit `c54e498`. O dono do produto autorizou o encerramento da ocorrência nesta data com base nessa evidência, **sem o E4 (QA funcional manual em produção) ter sido executado formalmente** — decisão dele, registrada aqui para histórico. Se qualquer problema na exclusão de usuários ou no ConfirmDialog aparecer depois, reabrir como nova ocorrência.