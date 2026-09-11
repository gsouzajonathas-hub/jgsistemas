---
expx_schema: 1
expx_tool: runx
kind: relatorio_uso
trabalho_id: OC-2026-0005
titulo: Erro ao excluir aluno, turma e curso
tipo_ocorrencia: bug
fechado_em: 2026-09-10
modulo_afetado: [alunos, turmas, cursos, financeiro]
---

# Erro ao excluir aluno, turma e curso

## O que estava acontecendo

Ao tentar excluir um aluno, uma turma ou um curso que já tinha informações relacionadas
(como matrícula, financeiro, notas, frequência ou certificado), o sistema mostrava a
mensagem "Erro ao excluir" e o registro continuava aparecendo normalmente, como se nada
tivesse acontecido. O mesmo acontecia ao tentar excluir um plano financeiro.

## O que muda a partir de agora

Ao confirmar a exclusão de um aluno, uma turma, um curso ou um plano financeiro, o sistema
agora remove o registro corretamente, mesmo quando ele já tem informações relacionadas. As
regras de proteção continuam valendo: uma turma com matrícula ativa, um curso com turma
vinculada ou um plano em uso ainda avisam antes de excluir e pedem para resolver isso
primeiro.

## Se é preciso fazer algo diferente

Não é preciso fazer nada diferente. Basta usar a exclusão normalmente, pelo mesmo caminho de
sempre.

## Se é preciso refazer alguma coisa que ficou errada no período

Nada precisa ser refeito. Como a exclusão não acontecia de fato quando dava esse erro,
nenhum aluno, turma ou curso foi perdido ou ficou incompleto por causa dele. Se algum
registro que você tentou excluir antes ainda estiver no sistema, basta tentar excluir de
novo.
