---
expx_schema: 1
expx_tool: runx
kind: ocorrencia
trabalho_id: OC-2026-0006
titulo: Erro persiste ao excluir aluno em producao
tipo_ocorrencia: bug
recebido_em: 2026-09-11
origem: chat-usuario
tem_reproducao: true
modulo_afetado: [alunos, exclusao, deploy-render]
atualizado_em: 2026-09-11
---

# OC-2026-0006 — Erro persiste ao excluir aluno em produção

> Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

## O que o usuário relatou (verbatim)

> "o erro de excluir o aluno persiste mesmo após o fix da OC-2026-0005" — a exclusão de aluno continua falhando em produção, com qualquer aluno (não é um caso isolado).

## Status da investigação

**PARADA NO LIMITE REAL (sem chute):** o código de exclusão está correto e comprovado por teste, mas não há como confirmar se a versão corrigida está rodando no Render — o motivo está registrado em `01-CAUSA-RAIZ.md` (bloqueio BL-01: `/api/health` não expõe versão nem consulta o banco).

Resumo do que já é **certeza**:

1. `backend/app/routes/students.py:305-346` (`delete_student`) está correto — cobre os **11 relacionamentos** que apontam para o aluno, na ordem certa (FileUpload, Evaluation, Attendance, Certificate, payments/parcelas via carnê, carnês antes das matrículas, Discount, MaterialSale, FinancialContract, Enrollment, Student).
2. Suíte de regressão passa 100%, incluindo `backend/tests/test_exclusao_cascata.py::test_excluir_aluno_com_todas_dependencias` — cria aluno com **todas** as dependências possíveis (carnê, matrícula, responsável, financeiro, avaliação, frequência, certificado) e exclui com sucesso (assert 200 + contagem zero em 12 tabelas).
3. O erro acontece com **qualquer** aluno em produção — não é aluno específico nem dado corrompido.

**Hipótese mais forte (NÃO confirmada):** o Render ainda serve uma versão anterior ao fix da OC-2026-0005 (commit `a835e9f`, "fix(exclusao): cascata correta de FKs ao excluir aluno/turma/curso/plano e 500 ao excluir plano"). Um deploy que falhou silenciosamente seria tratado como "saudável" pelo health check atual.

## Passos de reprodução

1. Logar em `https://jgsistemas.dev.br` como admin.
2. Ir em Alunos → selecionar um aluno (qualquer um).
3. Clicar em "Excluir" e confirmar no modal.
4. O backend responde com erro (500/fK) — a exclusão não acontece.

> Reprodução **local não foi possível**: o mesmo cenário passou na suíte (teste de regressão verde em SQLite com `PRAGMA foreign_keys=ON`, espelhando o Postgres). Por isso o foco da investigação migrou para o lado do deploy.

## Ambiente, versão e dados relevantes

- **Ambiente:** produção — backend em `jgsistemas-backend.onrender.com` (Render, Docker), banco Supabase Postgres.
- **Versão:** o repositório `main` já contém o fix (`a835e9f`); a versão **efetivamente rodando** no Render é desconhecida (ver BL-01).
- **Usuário/perfil:** admin (relato via chat).
- **Dados envolvidos:** qualquer aluno — o erro não depende de dados específicos.
- **Evidências anexadas:** relato do usuário; ausência de erro reproduzível em local.