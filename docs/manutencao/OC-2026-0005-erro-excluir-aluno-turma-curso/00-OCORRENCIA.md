---
expx_schema: 1
expx_tool: runx
kind: ocorrencia
trabalho_id: OC-2026-0005
titulo: Erro ao excluir aluno, turma e curso
tipo_ocorrencia: bug
recebido_em: 2026-09-10
origem: null
tem_reproducao: true
modulo_afetado: [alunos, turmas, cursos, financeiro]
atualizado_em: 2026-09-10
---

> Frontmatter obrigatorio (expx-schema v1). Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

# OC-2026-0005 — Erro ao excluir aluno, turma e curso

## Identificação

| Campo | Valor |
|---|---|
| identificador | OC-2026-0005 |
| titulo | Erro ao excluir aluno, turma e curso |
| tipo | bug |
| aberta em | 2026-09-10 |

## Relato original do cliente

> Para alçterações no sistema , Onde tem a opção excluir , quando a gente clica aí aparece a mensagem se deseja excluir colocamos sim. Aí aparece a mensagem. Erro ao excluir, aluno, turma , curso.. Em todos os modais que tem opção de excluir ou dados seja de aluno, de curso, de turma e outros precisa realmente deletar a funçã escolhida.. tanto no sistema quanto no banco d dados no supabase

## Passos de reprodução

1. Abrir uma tela com registro vinculado a outras tabelas (ex.: um aluno com matrícula/financeiro, uma turma com matrícula/avaliação, um curso com turma ou plano vinculado).
2. Clicar em "Excluir" no registro e confirmar "Sim" no modal de confirmação.
3. Resultado observado: alerta "Erro ao excluir [aluno/turma/curso]" e o registro permanece no sistema e no banco — esperado: o registro é removido do sistema e do banco de dados.

## Ambiente, versão e dados relevantes

- **Ambiente:** NÃO DETERMINADO (usuário não especificou produção ou local)
- **Versão:** NÃO DETERMINADO
- **Usuário/perfil:** NÃO DETERMINADO
- **Dados envolvidos:** NÃO DETERMINADO (nenhum ID de registro citado)
- **Evidências anexadas:** mensagem de erro citada literalmente ("Erro ao excluir")
