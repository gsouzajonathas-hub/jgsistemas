---
expx_schema: 1
expx_tool: runx
kind: orquestrador
trabalho_id: OC-2026-0001
titulo: Nao consigo criar matricula
tipo_trabalho: ocorrencia
tipo_ocorrencia: bug
estagio: e2
status: em_andamento
criado_em: 2026-09-04
atualizado_em: 2026-09-04
concluido_em: null
sprints: [sprint-01]
caminho_critico: [T-01.01, T-01.02, T-01.03, T-01.04, T-01.05]
---

> Frontmatter obrigatorio (expx-schema v1). Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

# Orquestrador — OC-2026-0001 Nao consigo criar matricula

> Porta de entrada da execução. Escrito para quem abriu o repositório agora e não sabe nada. Só caminhos relativos; nunca o valor de um segredo.

## 1. Objetivo

O usuário não consegue criar matrícula porque o sistema não tem tela para cadastrar curso e professor (causa comprovada no E1 — o backend cria a cadeia inteira com sucesso; o que falta é UI). Esta ocorrência entrega as telas de Cursos e Professores com CRUD, expõe rotas, menu e permissões, e valida que a cadeia curso → professor → turma → matrícula passa a ser possível pela interface.

## 2. Mapa e ordem de leitura

1. Este arquivo (`ORQUESTRADOR.md`)
2. `00-OCORRENCIA.md` — o chamado como chegou
3. `01-CAUSA-RAIZ.md` — a causa comprovada e as decisões D-01 a D-03 que governam o plano
4. `base/00-INDICE.md` — e os arquivos da base que ele lista (área de matrículas, lacunas)
5. `sprint-01/sprint.md` → `fases.md` → `tasks.md`
6. `BLOQUEIOS.md` — B-01 (limpeza de dados de teste) e B-02 (deploy do Render)
7. `QA.md` — achados MÉDIA/BAIXA que permanecem válidos (a criar no E4)

## 3. Rota de execução

- Sprint 01: F-01.1 → F-01.2 — sequencial; nenhuma fase ou task declarada paralelizável (todas as tasks têm `depende_de` não vazio, exceto T-01.01, e o diagrama não declara paralelismo — paralelismo é ausência de aresta).

**Caminho crítico:** T-01.01 → T-01.02 → T-01.03 → T-01.04 → T-01.05

## 4. Ferramentas

- **Testes:** frontend `npm test` (na pasta `frontend/`); backend `python -m pytest -q` (na pasta `backend/`)
- **Lint:** NÃO EXISTE NO PROJETO
- **Typecheck:** `npm run build` (na pasta `frontend/` — roda `tsc && vite build`); backend não tem typecheck
- **MCPs / SDKs:** nenhum além do padrão
- **Segredos:** `RESEND_API_KEY` e `RESEND_FROM` — painel do Render; `SECRET_KEY` e `DATABASE_URL` — painel do Render; token de API do Render — `.env` local de quem opera. NUNCA escreva o valor.

## 5. Papéis dentro de cada task

- **Implementador** — escreve o teste primeiro, vê falhar, implementa o mínimo até passar.
- **Revisor de testes** — antes de aceitar o verde, responde: este teste falharia com uma implementação errada? Se não, o teste volta.
- **Auditor de aceite** — verifica de fato o `criterio_aceite` da task antes de permitir `status: concluida`.

**Agente único:** assume os três papéis em sequência dentro de cada task, nesta ordem, tratando cada papel como um portão — não avança ao papel seguinte sem fechar o anterior. A aprovação final da ocorrência NÃO é feita aqui: é o E4 QA, papel distinto do E3.

## 6. Regras de autonomia

1. Não pergunte nada; não peça autorização para nada.
2. O teste vem antes do código, sempre. O teste de regressão (T-01.01) tem que falhar antes do fix — se ele passar antes, pare e volte ao E1.
3. Task só é `concluida` com teste de integração E funcional passando, suíte inteira verde e `criterio_aceite` verificado. Não existe "concluído com ressalva".
4. Escopo travado: não toque em arquivo fora de `01-CAUSA-RAIZ.md` e de `tasks.md`. Nada de refactor de brinde.
5. Dúvida nova ou pré-requisito faltando: registrar em `BLOQUEIOS.md` (`B-NN | task | bloqueio | o que destravaria`), marcar a task `bloqueada`, pular para a próxima paralelizável. Nunca parar e esperar.
6. Só rode em paralelo o que o plano declarou paralelizável; a execução nunca decide paralelismo. Entre sprints, sempre sequencial.
7. Atualize `status` em `tasks.md` e `fases.md` a cada transição; ao concluir, acrescente data e resultado da suíte.
8. Critério de saída de fase/sprint não atendido = não avança.

## 7. Definição de pronto da ocorrência

- [ ] Teste de regressão das rotas /courses e /teachers falhava antes do fix e passa agora.
- [ ] O menu lateral mostra "Cursos" e "Professores" e as rotas /courses e /teachers renderizam as páginas para admin.
- [ ] As páginas de Cursos e Professores permitem criar, editar e excluir via coursesAPI/teachersAPI e mostram estado vazio com chamada à ação.
- [ ] As permissões `courses` e `teachers` aparecem em Configurações (ALL_PERMISSIONS) e um perfil de secretaria sem elas não acessa /teachers.
- [ ] `npm test` termina com 0 failed e `npm run build` com exit 0.
- [ ] Nenhum arquivo fora do escopo declarado (01-CAUSA-RAIZ.md + tasks.md) foi alterado.
- [ ] QA em produção: a cadeia curso → professor → turma → matrícula é criada pela UI.

## 8. Como retomar uma sessão interrompida

1. Leia este arquivo inteiro.
2. Leia o `status` de cada task em `sprint-01/tasks.md`.
3. Leia `BLOQUEIOS.md`.
4. Continue da primeira task `pendente` ou `em_andamento` cujas dependências (`depende_de`) estão todas `concluida`. Ignore as `bloqueada` até que o bloqueio registrado seja resolvido.