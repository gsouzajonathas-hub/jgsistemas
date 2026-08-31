# Sprint 04 — Fases

## F01 — Storage upload/download assinado

- **objetivo**: Portar `utils/uploads.py` para Storage — validação de tipo/tamanho, upload para bucket privado `uploads`, URL assinada; bucket público `public` para logo.
- **Tasks**: T-04.01, T-04.02
- **Critério de saída**: upload válido retorna object key + URL assinada; arquivo executável/HTML rejeitado (400).
- **Roda em paralelo com**: nenhuma (dependência de domain da sprint).

## F02 — Alunos + perfil + responsáveis

- **objetivo**: Migrar student CRUD + `students_profile` + `responsibles` com validações (CPF, data de nascimento, contatos).
- **Tasks**: T-04.03, T-04.04
- **Critério de saída**: CRUD completo de student com profile aninhado e responsáveis.
- **Roda em paralelo com**: F04 (arquivos distintos).

## F03 — Uploads aplicados aos alunos (foto/documentos/logo)

- **objetivo**: Integrar Storage (F01) às rotas de aluno — salvar foto, documentos, e aplicar logo em configurações via bucket público.
- **Tasks**: T-04.05, T-04.06
- **Critério de saída**: aluno aceita upload de foto/documento e armazena a key assinada; logo salva em bucket público.
- **Roda em paralelo com**: F02 (paralelo), depende de F01/T-04.01.

## F04 — Professores + cursos

- **objetivo**: Migrar CRUD de `teachers` e `courses` com percursos de status (ativo/inativo).
- **Tasks**: T-04.07
- **Critério de saída**: CRUD de professores e cursos.
- **Roda em paralelo com**: F02, F05.

## F05 — Turmas + matrículas

- **objetivo**: Migrar `classes` (turmas, horários) e `enrollments` (matrícula + renovação/cancelamento/trancamento e status).
- **Tasks**: T-04.08, T-04.09
- **Critério de saída**: CRUD de turmas e matrículas com transição de status válida.
- **Roda em paralelo com**: F04.