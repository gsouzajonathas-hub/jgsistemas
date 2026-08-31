# Sprint 04 — Tasks

Caminhos relativos à raiz do repositório. Status inicial de toda task: `pendente`.

---

## T-04.01 | Storage helper upload + validacao de arquivo

- **objetivo**: Criar `_shared/storage.ts` com `uploadFile()`, `createSignedUrl()`, validação por extensão/MIME e limite 5MB; rejeitar executável/HTML (mira `uploads.py`).
- **cria**: `supabase/functions/app/_shared/storage.ts`, `supabase/tests/storage_test.ts`
- **altera**: —
- **teste_integracao**: `uploadFile("foto.jpg", byte[])` sobe objeto em `uploads` e retorna key; upload de `.html` retorna erro.
- **teste_funcional**: `createSignedUrl(bucket, path, 3600)` retorna URL assinada válida.
- **criterio_aceite**: upload valida tipo/tamanho, rejeita perigoso, e retorna URL assinada.
- **depende_de**: T-01.05
- **paralelizavel**: true
- **status**: pendente

---

## T-04.02 | Buckets Storage (privado `uploads` + público `public`)

- **objetivo**: Criar buckets `uploads` (privado) e `public` (logo) via código Edge Function (Storage API, service_role) no boot, garantindo visibilidade correta e RLS restrita; validar no `supabase start` local.
- **cria**: `supabase/functions/app/_shared/buckets.ts` (idempotente: cria buckets se ausentes), `supabase/tests/buckets_test.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts` (registrar rotina de bootstrap de buckets)
- **teste_integracao**: executa bootstrap; query `storage.buckets` lista 2 buckets com `public=false` e `public=true` respectivos.
- **teste_funcional**: acesso anônimo a objeto do bucket privado sem URL assinada retorna 400.
- **criterio_aceite**: buckets existem com visibilidade correta e acesso anônimo negado no privado.
- **depende_de**: T-01.05
- **paralelizavel**: true
- **status**: pendente

---

## T-04.03 | Students CRUD base

- **objetivo**: Migrar `CRUD /api/students` — list (com busca/filtros), get por id, create, update, delete.
- **cria**: `supabase/functions/app/src/routes/students.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: POST `/api/students` com dados válidos retorna 201 e persistiza em `students`.
- **teste_funcional**: GET `/api/students?search=Joao` retorna 200 com array filtrado.
- **criterio_aceite**: CRUD de alunos com busca por nome.
- **depende_de**: T-02.03, T-01.05
- **paralelizavel**: false
- **status**: pendente

---

## T-04.04 | Students profile + responsíveis

- **objetivo**: Migrar leitura/escrita de `students_profile` (dados detalhados) e `responsibles` (pais/contatos) ligados ao aluno.
- **cria**: `supabase/functions/app/src/routes/student_profile.ts`
- **altera**: `supabase/functions/app/src/routes/students.ts` (aninhar profile+responsibles no get)
- **teste_integracao**: GET `/api/students/:id` retorna `profile` e `responsibles` aninhados.
- **teste_funcional**: criar aluno com responsável persiste 1 linha em `responsibles`.
- **criterio_aceite**: GET de aluno inclui profile e responsáveis corretamente.
- **depende_de**: T-04.03
- **paralelizavel**: true
- **status**: pendente

---

## T-04.05 | Upload de foto e documentos do aluno

- **objetivo**: Integrar `uploadFile` (T-04.01) às rotas de aluno — endpoints `POST /api/students/:id/photo` e `POST /api/students/:id/documents`.
- **cria**: `supabase/functions/app/src/routes/uploads.ts`
- **altera**: `supabase/functions/app/src/routes/students.ts`
- **teste_integracao**: POST multipart de foto válida retorna 200 e grava URL assinada na coluna do aluno.
- **teste_funcional**: POST de arquivo `.exe` retorna 400 `{ "detail": "tipo de arquivo não permitido" }`.
- **criterio_aceite**: upload de foto/documento funciona e rejeita não permitidos.
- **depende_de**: T-04.01, T-04.03
- **paralelizavel**: false
- **status**: pendente

---

## T-04.06 | Logo em configurações via bucket público

- **objetivo**: Migrar upload/leitura da logo da escola (settings) gravando em bucket público `public` (D-04).
- **cria**: (em `uploads.ts` + `settings.ts`)
- **altera**: `supabase/functions/app/src/routes/settings.ts`
- **teste_integracao**: POST de logo retorna 200 e a URL pública é acessível sem token.
- **teste_funcional**: GET settings retorna `logo_url` pública.
- **criterio_aceite**: logo persistida publicamente e referenciada nas configurações.
- **depende_de**: T-04.02
- **paralelizavel**: true
- **status**: pendente

---

## T-04.07 | Teachers + Courses CRUD

- **objetivo**: Migrar CRUD de `teachers` (nome, disciplinas, email, status) e `courses` (nome, duração, valor).
- **cria**: `supabase/functions/app/src/routes/teachers.ts`, `supabase/functions/app/src/routes/courses.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: POST `/api/teachers` e `POST /api/courses` retornam 201.
- **teste_funcional**: GET `/api/courses?active=true` retorna 200 filtrando ativos.
- **criterio_aceite**: CRUD de professores e cursos com filtro de status.
- **depende_de**: T-02.03, T-01.05
- **paralelizavel**: true
- **status**: pendente

---

## T-04.08 | Classes (turmas) CRUD

- **objetivo**: Migrar `classes.py` — turmas com horários, curso e professores associados.
- **cria**: `supabase/functions/app/src/routes/classes.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: POST `/api/classes` com curso+horário retorna 201.
- **teste_funcional**: GET `/api/classes?course_id=1` retorna 200 com turmas do curso.
- **criterio_aceite**: CRUD de turmas com associação a curso/professor.
- **depende_de**: T-04.07, T-02.03
- **paralelizavel**: true
- **status**: pendente

---

## T-04.09 | Enrollments (matrícula/renovação/cancelamento/trancamento)

- **objetivo**: Migrar `enrollments.py` — fluxo de status (matriculado/renovado/cancelado/trancado) com validação de Estado.
- **cria**: `supabase/functions/app/src/routes/enrollments.ts`
- **altera**: `supabase/functions/app/src/routes/index.ts`
- **teste_integracao**: POST `/api/enrollments` cria matrícula com status `matriculado`.
- **teste_funcional**: transição matrícula `cancelado->trancado` retorna 400 (estado inválido).
- **criterio_aceite**: máquina de estados de matrícula respeitada.
- **depende_de**: T-04.08, T-04.03
- **paralelizavel**: false
- **status**: pendente

---

> **Total: 9 tasks.**