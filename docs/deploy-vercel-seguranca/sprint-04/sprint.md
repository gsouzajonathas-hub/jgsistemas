# Sprint 04 — Cadastro Core (alunos, responsáveis, uploads, professores, cursos, turmas, matrículas)

## Objetivo

Migrar os módulos de cadastro base: alunos (com perfil e documentos), responsáveis, upload de arquivos
para Supabase Storage (D-04), professores, cursos, turmas e matrículas (renovação, cancelamento, trancamento).

## Fases

| Fase | Descrição |
|---|---|
| F01 | Storage upload/download (assinado) |
| F02 | Alunos + perfil + responsáveis |
| F03 | Uploads de fotos/documentos aplicados aos alunos |
| F04 | Professores + cursos |
| F05 | Turmas + matrículas |

## Critério de saída

- [ ] Upload sobe arquivo para Storage, valida MIME/tamanho (5MB), gera URL assinada (bucket privado) e rejeita executável/HTML (D-04).
- [ ] CRUD `students` com `students_profile` e `responsibles`.
- [ ] Matrícula com fluxos de renovação, cancelamento e trancamento (status em `enrollments`).

## Riscos conhecidos

- Storage bucket privado requer geração de URL assinada via `storage.from().createSignedUrl()`.
- Validação de conteúdo (magic bytes) é mais complexa em Edge Functions; usar verificação por extensão + MIME header.

## Dependências de decisões

- D-04 (Supabase Storage), D-13 (rotas sob `/api`)