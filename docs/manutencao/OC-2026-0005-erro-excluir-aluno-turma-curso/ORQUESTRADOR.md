---
expx_schema: 1
expx_tool: runx
kind: orquestrador
trabalho_id: OC-2026-0005
titulo: Erro ao excluir aluno, turma e curso
tipo_trabalho: ocorrencia
tipo_ocorrencia: bug
estagio: e5
status: concluido
criado_em: 2026-09-10
atualizado_em: 2026-09-10
concluido_em: 2026-09-10
sprints: [sprint-01]
caminho_critico: [T-01.01, T-01.02]
---

> Frontmatter obrigatorio (expx-schema v1). Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

# Orquestrador — OC-2026-0005 Erro ao excluir aluno, turma e curso

> Porta de entrada da execução. Escrito para quem abriu o repositório agora e não sabe nada. Só caminhos relativos; nunca o valor de um segredo.

## 1. Objetivo

Excluir aluno, turma, curso e plano financeiro (com dados vinculados) falhava com "Erro ao
excluir" — violação de FK/AttributeError no backend. O fix já está no código (commit
`a835e9f`, trazido por `git pull` de origin/main), com teste de regressão dedicado já verde.
Esta ocorrência verifica a cobertura, roda a suíte completa e fecha o registro formal.

## 2. Mapa e ordem de leitura

1. Este arquivo (`ORQUESTRADOR.md`)
2. `00-OCORRENCIA.md` — o chamado como chegou
3. `01-CAUSA-RAIZ.md` — a causa comprovada e as decisões que governam o plano
4. `base/00-INDICE.md` — e `base/exclusao-cascata-alunos-turmas-cursos.md`
5. `sprint-01/sprint.md` → `fases.md` → `tasks.md`
6. `BLOQUEIOS.md` — vazio nesta ocorrência
7. `QA.md` — achados MÉDIA/BAIXA que permanecem válidos (quando o E4 gravar)

## 3. Rota de execução

- Sprint 01: F-01.1 (única).

**Caminho crítico:** T-01.01 → T-01.02 (sequencial; nada paralelo nesta ocorrência).

## 4. Ferramentas

- **Testes (backend):** `cd backend && ./venv/Scripts/python.exe -m pytest -q` (Windows;
  `venv/bin/python -m pytest -q` em Linux/Mac)
- **Testes (frontend):** `cd frontend && npm run test` (vitest)
- **Lint:** NÃO EXISTE NO PROJETO (sem `eslint`/`ruff` configurado nos scripts do repo)
- **Typecheck (frontend):** `cd frontend && npm run build` (roda `tsc` antes do `vite build`)
- **MCPs / SDKs:** nenhum além do padrão
- **Segredos:** nenhum tocado nesta ocorrência — `SECRET_KEY`, `DATABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY` continuam em `.env`/variáveis de ambiente do Render, fora do
  escopo desta correção

## 5. Papéis dentro de cada task

- **Implementador** — não se aplica: o fix já existe no código, trazido pelo `git pull`.
- **Revisor de testes** — verificado nesta sessão: os testes de `test_exclusao_cascata.py`
  saturam de fato as FKs do cenário relatado (carnê+matrícula, peso/certificado/frequência,
  plano vinculado), não apenas o caminho feliz.
- **Auditor de aceite** — critério de aceite de cada task conferido por execução real da
  suíte (não por leitura de código apenas).

**Agente único:** esta ocorrência não teve papel de implementador (nada para implementar);
o revisor e o auditor foram exercidos ao rodar e ler a suíte. A aprovação final é o E4 QA.

## 6. Regras de autonomia

1. Não pergunte nada; não peça autorização para nada.
2. Nenhum código de produção é alterado nesta ocorrência — o fix já está aplicado.
3. Task só é `concluida` com a suíte relevante rodada e verde.
4. Escopo travado: nada além dos arquivos listados em `01-CAUSA-RAIZ.md` é tocado.
5. Dúvida nova ou pré-requisito faltando: registrar em `BLOQUEIOS.md`.
6. Nada paralelo nesta ocorrência.
7. `status` de cada task atualizado com data e resultado da suíte.
8. Critério de saída de fase/sprint não atendido = não avança.

## 7. Definição de pronto da ocorrência

- [x] `test_exclusao_cascata.py` — 7 testes, todos `PASSED`.
- [x] Suíte completa do backend — `154 passed, 1 skipped`.
- [x] E4 QA registrado com veredito (APROVADO, 1 achado MÉDIA).
- [x] `docs/relatorios/` com os dois relatórios (técnico e uso) e `INDICE.md` atualizado.
- [x] Nenhum arquivo fora do escopo declarado foi alterado (nenhum arquivo de produção foi
      tocado nesta ocorrência).

## 8. Como retomar uma sessão interrompida

1. Leia este arquivo inteiro.
2. Leia o `status` de cada task em `sprint-01/tasks.md` (ambas já `concluida`).
3. Leia `BLOQUEIOS.md` (vazio).
4. Continue pelo E4 QA (`references/04-qa.md`), já que o E2/E3 desta ocorrência não geram
   código novo — vá direto à validação e ao fechamento.
