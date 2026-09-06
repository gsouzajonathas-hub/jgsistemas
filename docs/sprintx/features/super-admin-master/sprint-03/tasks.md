---
expx_schema: 1
expx_tool: sprintx
kind: tasks
trabalho_id: super-admin-master
sprint_id: sprint-03
atualizado_em: 2026-09-05
tasks:
  - id: T-03.01
    titulo: Enforcement do modulo students
    fase: F-03.1
    status: concluida
    objetivo: Exigir require_permission students em toda rota de leitura e escrita de alunos
    arquivos:
      cria: [backend/tests/test_enforcement_students.py]
      altera: [backend/app/routes/students.py, backend/app/routes/students_profile.py, backend/tests/fixtures.py]
    teste_integracao: Toda rota de students.py e students_profile.py exige require_permission students super_admin sempre passa quem tem o modulo passa quem nao tem recebe 403
    teste_funcional: Um secretary sem students em permissions chamando GET students recebe 403 o mesmo secretary com students liberado recebe 200
    criterio_aceite: Nenhuma rota de students.py ou students_profile.py usa require_role ou get_current_user puro para autorizacao de modulo suite backend verde
    depende_de: [T-01.02, T-02.02]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-03.02
    titulo: Enforcement do modulo enrollments
    fase: F-03.1
    status: concluida
    objetivo: Exigir require_permission enrollments em toda rota de leitura e escrita de matriculas
    arquivos:
      cria: []
      altera: [backend/app/routes/enrollments.py]
    teste_integracao: Toda rota de enrollments.py exige require_permission enrollments super_admin sempre passa quem tem o modulo passa quem nao tem recebe 403
    teste_funcional: Um secretary sem enrollments em permissions chamando POST enrollments recebe 403 o mesmo secretary com enrollments liberado recebe 200 ou 201
    criterio_aceite: Nenhuma rota de enrollments.py usa require_role ou get_current_user puro para autorizacao de modulo suite backend verde
    depende_de: [T-01.02, T-02.02]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-03.03
    titulo: Enforcement do modulo courses
    fase: F-03.1
    status: concluida
    objetivo: Exigir require_permission courses em toda rota de leitura e escrita de cursos
    arquivos:
      cria: []
      altera: [backend/app/routes/courses.py]
    teste_integracao: Toda rota de courses.py exige require_permission courses super_admin sempre passa quem tem o modulo passa quem nao tem recebe 403
    teste_funcional: Um secretary sem courses em permissions chamando POST courses recebe 403 o mesmo secretary com courses liberado recebe 200 ou 201
    criterio_aceite: Nenhuma rota de courses.py usa require_role ou get_current_user puro para autorizacao de modulo suite backend verde
    depende_de: [T-01.02, T-02.02]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-03.04
    titulo: Enforcement do modulo teachers
    fase: F-03.1
    status: concluida
    objetivo: Exigir require_permission teachers em toda rota de leitura e escrita de professores
    arquivos:
      cria: []
      altera: [backend/app/routes/teachers.py]
    teste_integracao: Toda rota de teachers.py exige require_permission teachers super_admin sempre passa quem tem o modulo passa quem nao tem recebe 403
    teste_funcional: Um secretary sem teachers em permissions chamando POST teachers recebe 403 o mesmo secretary com teachers liberado recebe 200 ou 201
    criterio_aceite: Nenhuma rota de teachers.py usa require_role ou get_current_user puro para autorizacao de modulo suite backend verde
    depende_de: [T-01.02, T-02.02]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-03.05
    titulo: Enforcement do modulo classes
    fase: F-03.1
    status: concluida
    objetivo: Exigir require_permission classes em toda rota de leitura e escrita de turmas
    arquivos:
      cria: []
      altera: [backend/app/routes/classes.py]
    teste_integracao: Toda rota de classes.py exige require_permission classes super_admin sempre passa quem tem o modulo passa quem nao tem recebe 403
    teste_funcional: Um secretary sem classes em permissions chamando POST classes recebe 403 o mesmo secretary com classes liberado recebe 200 ou 201
    criterio_aceite: Nenhuma rota de classes.py usa require_role ou get_current_user puro para autorizacao de modulo suite backend verde
    depende_de: [T-01.02, T-02.02]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-03.06
    titulo: Enforcement do modulo attendance
    fase: F-03.1
    status: concluida
    objetivo: Exigir require_permission attendance em toda rota de leitura e escrita de frequencia hoje sem nenhuma checagem de papel
    arquivos:
      cria: []
      altera: [backend/app/routes/attendance.py]
    teste_integracao: Toda rota de attendance.py exige require_permission attendance super_admin sempre passa quem tem o modulo passa quem nao tem recebe 403
    teste_funcional: Um teacher sem attendance em permissions chamando POST attendance bulk recebe 403 o mesmo teacher com attendance liberado recebe 200
    criterio_aceite: Nenhuma rota de attendance.py usa apenas get_current_user para autorizacao de modulo suite backend verde
    depende_de: [T-01.02, T-02.02]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-03.07
    titulo: Enforcement do modulo evaluations
    fase: F-03.1
    status: concluida
    objetivo: Exigir require_permission evaluations em toda rota de leitura e escrita de avaliacoes e pesos hoje sem nenhuma checagem de papel
    arquivos:
      cria: []
      altera: [backend/app/routes/evaluations.py, backend/app/routes/weight_config.py]
    teste_integracao: Toda rota de evaluations.py e weight_config.py exige require_permission evaluations super_admin sempre passa quem tem o modulo passa quem nao tem recebe 403
    teste_funcional: Um teacher sem evaluations em permissions chamando POST evaluations recebe 403 o mesmo teacher com evaluations liberado recebe 200 ou 201
    criterio_aceite: Nenhuma rota de evaluations.py ou weight_config.py usa apenas get_current_user para autorizacao de modulo suite backend verde
    depende_de: [T-01.02, T-02.02]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-03.08
    titulo: Enforcement do modulo boletins
    fase: F-03.1
    status: concluida
    objetivo: Exigir require_permission boletins em toda rota de leitura de boletins hoje sem nenhuma checagem de papel
    arquivos:
      cria: []
      altera: [backend/app/routes/boletins.py]
    teste_integracao: Toda rota de boletins.py exige require_permission boletins super_admin sempre passa quem tem o modulo passa quem nao tem recebe 403
    teste_funcional: Um teacher sem boletins em permissions chamando GET boletins student_id recebe 403 o mesmo teacher com boletins liberado recebe 200
    criterio_aceite: Nenhuma rota de boletins.py usa apenas get_current_user para autorizacao de modulo suite backend verde
    depende_de: [T-01.02, T-02.02]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-03.09
    titulo: Enforcement do modulo certificates
    fase: F-03.1
    status: concluida
    objetivo: Exigir require_permission certificates em toda rota de leitura e escrita de certificados
    arquivos:
      cria: []
      altera: [backend/app/routes/certificates.py]
    teste_integracao: Toda rota de certificates.py exige require_permission certificates super_admin sempre passa quem tem o modulo passa quem nao tem recebe 403
    teste_funcional: Um secretary sem certificates em permissions chamando POST certificates recebe 403 o mesmo secretary com certificates liberado recebe 200 ou 201
    criterio_aceite: Nenhuma rota de certificates.py usa require_role ou get_current_user puro para autorizacao de modulo suite backend verde
    depende_de: [T-01.02, T-02.02]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-03.10
    titulo: Enforcement do modulo financial
    fase: F-03.1
    status: concluida
    objetivo: Exigir require_permission financial em toda rota de leitura e escrita de financeiro carnes e materiais didaticos
    arquivos:
      cria: []
      altera: [backend/app/routes/financial.py, backend/app/routes/carnes.py, backend/app/routes/materials.py]
    teste_integracao: Toda rota de financial.py carnes.py e materials.py exige require_permission financial super_admin sempre passa quem tem o modulo passa quem nao tem recebe 403
    teste_funcional: Um secretary sem financial em permissions chamando POST financial plans recebe 403 o mesmo secretary com financial liberado recebe 200 ou 201
    criterio_aceite: Nenhuma rota de financial.py carnes.py ou materials.py usa require_role ou get_current_user puro para autorizacao de modulo suite backend verde
    depende_de: [T-01.02, T-02.02]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-03.11
    titulo: Enforcement do modulo schedule
    fase: F-03.1
    status: concluida
    objetivo: Exigir require_permission schedule em toda rota de leitura e escrita de agenda
    arquivos:
      cria: []
      altera: [backend/app/routes/schedule.py]
    teste_integracao: Toda rota de schedule.py exige require_permission schedule super_admin sempre passa quem tem o modulo passa quem nao tem recebe 403
    teste_funcional: Um secretary sem schedule em permissions chamando POST schedule recebe 403 o mesmo secretary com schedule liberado recebe 200 ou 201
    criterio_aceite: Nenhuma rota de schedule.py usa require_role ou get_current_user puro para autorizacao de modulo suite backend verde
    depende_de: [T-01.02, T-02.02]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-03.12
    titulo: Enforcement dos modulos dashboard e reports
    fase: F-03.1
    status: concluida
    objetivo: Exigir require_permission dashboard na rota de dashboard e require_permission reports nas demais rotas de reports.py hoje sem nenhuma checagem de papel
    arquivos:
      cria: []
      altera: [backend/app/routes/reports.py]
    teste_integracao: GET reports dashboard exige require_permission dashboard as demais rotas de reports.py exigem require_permission reports super_admin sempre passa
    teste_funcional: Um secretary sem dashboard em permissions chamando GET reports dashboard recebe 403 um secretary sem reports em permissions chamando GET reports financial recebe 403
    criterio_aceite: GET reports dashboard usa require_permission dashboard todas as outras rotas de reports.py usam require_permission reports suite backend verde
    depende_de: [T-01.02, T-02.02]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-03.13
    titulo: Enforcement do modulo audit
    fase: F-03.1
    status: concluida
    objetivo: Trocar require_role admin por require_permission audit na rota de auditoria
    arquivos:
      cria: []
      altera: [backend/app/routes/audit.py]
    teste_integracao: GET audit exige require_permission audit super_admin sempre passa quem tem o modulo passa quem nao tem recebe 403
    teste_funcional: Um admin sem audit em permissions chamando GET audit recebe 403 o mesmo admin com audit liberado recebe 200
    criterio_aceite: GET audit usa require_permission audit em vez de require_role admin suite backend verde
    depende_de: [T-01.02, T-02.02]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
  - id: T-03.14
    titulo: Enforcement do modulo settings
    fase: F-03.1
    status: concluida
    objetivo: Trocar require_role admin secretary por require_permission settings nas rotas de escrita de configuracoes mantendo a leitura aberta a qualquer autenticado
    arquivos:
      cria: []
      altera: [backend/app/routes/settings.py]
    teste_integracao: PUT settings e POST settings logo exigem require_permission settings GET settings continua exigindo apenas usuario autenticado sem checagem de modulo
    teste_funcional: Um admin sem settings em permissions chamando PUT settings recebe 403 o mesmo admin consegue GET settings normalmente para carregar o logo
    criterio_aceite: PUT settings e POST settings logo usam require_permission settings GET settings continua usando apenas get_current_user suite backend verde
    depende_de: [T-01.02, T-02.02]
    paralelizavel: true
    concluida_em: 2026-09-05
    suite: verde
---

> Um bloco por task. Preenchendo TODOS os campos. Na execução (F6), a linha `status` é atualizada em cada transição; ao concluir, acrescente data e resultado da suíte. As 14 tasks desta sprint tocam arquivos completamente distintos entre si e são todas paralelizáveis; nenhuma depende de outra da mesma fase, só de T-01.02 (`require_permission`) e T-02.02 (`ALL_MODULES` com 15 chaves).

> **Nota geral de execução (registrada na T-03.01, vale para as 14):** foi criada em `backend/tests/fixtures.py` a fixture factory `headers_com_permissoes(role, permissoes)`, reutilizada em todos os testes de enforcement desta sprint. Também foi necessário atualizar a fixture compartilhada `admin_user` para nascer com todos os 15 módulos em `permissions` — ela é usada por dezenas de testes de OUTRAS features (fora do escopo desta) que esperam um admin com acesso total; sem isso, D-02 (admin comum regulável) quebraria essa fixture globalmente, simulando corretamente o efeito da migração T-02.03 sobre um admin pré-existente.

---

```yaml
id: T-03.01
titulo: Enforcement do modulo students
objetivo: Exigir require_permission students em toda rota de leitura e escrita de alunos
arquivos:
  cria: [backend/tests/test_enforcement_students.py]
  altera: [backend/app/routes/students.py, backend/app/routes/students_profile.py, backend/tests/fixtures.py]
teste_integracao: Toda rota de students.py e students_profile.py exige require_permission students; super_admin sempre passa, quem tem o modulo passa, quem nao tem recebe 403
teste_funcional: Um secretary sem students em permissions chamando GET students recebe 403; o mesmo secretary com students liberado recebe 200
criterio_aceite: Nenhuma rota de students.py ou students_profile.py usa require_role ou get_current_user puro para autorizacao de modulo; suite backend verde
depende_de: [T-01.02, T-02.02]
paralelizavel: true
status: concluida
```

> **T-03.01 — CONCLUÍDA (2026-09-05, suíte: 95 passed, 0 failed).**

---

```yaml
id: T-03.02
titulo: Enforcement do modulo enrollments
objetivo: Exigir require_permission enrollments em toda rota de leitura e escrita de matriculas
arquivos:
  cria: [backend/tests/test_enforcement_enrollments.py]
  altera: [backend/app/routes/enrollments.py]
teste_integracao: Toda rota de enrollments.py exige require_permission enrollments; super_admin sempre passa, quem tem o modulo passa, quem nao tem recebe 403
teste_funcional: Um secretary sem enrollments em permissions chamando POST enrollments recebe 403; o mesmo secretary com enrollments liberado recebe 200/201
criterio_aceite: Nenhuma rota de enrollments.py usa require_role ou get_current_user puro para autorizacao de modulo; suite backend verde
depende_de: [T-01.02, T-02.02]
paralelizavel: true
status: concluida
```

> **T-03.02 — CONCLUÍDA (2026-09-05, suíte: 111 passed, 0 failed).**

---

```yaml
id: T-03.03
titulo: Enforcement do modulo courses
objetivo: Exigir require_permission courses em toda rota de leitura e escrita de cursos
arquivos:
  cria: [backend/tests/test_enforcement_courses.py]
  altera: [backend/app/routes/courses.py]
teste_integracao: Toda rota de courses.py exige require_permission courses; super_admin sempre passa, quem tem o modulo passa, quem nao tem recebe 403
teste_funcional: Um secretary sem courses em permissions chamando POST courses recebe 403; o mesmo secretary com courses liberado recebe 200/201
criterio_aceite: Nenhuma rota de courses.py usa require_role ou get_current_user puro para autorizacao de modulo; suite backend verde
depende_de: [T-01.02, T-02.02]
paralelizavel: true
status: concluida
```

> **T-03.03 — CONCLUÍDA (2026-09-05, suíte: 111 passed, 0 failed).**

---

```yaml
id: T-03.04
titulo: Enforcement do modulo teachers
objetivo: Exigir require_permission teachers em toda rota de leitura e escrita de professores
arquivos:
  cria: [backend/tests/test_enforcement_teachers.py]
  altera: [backend/app/routes/teachers.py]
teste_integracao: Toda rota de teachers.py exige require_permission teachers; super_admin sempre passa, quem tem o modulo passa, quem nao tem recebe 403
teste_funcional: Um secretary sem teachers em permissions chamando POST teachers recebe 403; o mesmo secretary com teachers liberado recebe 200/201
criterio_aceite: Nenhuma rota de teachers.py usa require_role ou get_current_user puro para autorizacao de modulo; suite backend verde
depende_de: [T-01.02, T-02.02]
paralelizavel: true
status: concluida
```

> **T-03.04 — CONCLUÍDA (2026-09-05, suíte: 111 passed, 0 failed).**

---

```yaml
id: T-03.05
titulo: Enforcement do modulo classes
objetivo: Exigir require_permission classes em toda rota de leitura e escrita de turmas
arquivos:
  cria: [backend/tests/test_enforcement_classes.py]
  altera: [backend/app/routes/classes.py]
teste_integracao: Toda rota de classes.py exige require_permission classes; super_admin sempre passa, quem tem o modulo passa, quem nao tem recebe 403
teste_funcional: Um secretary sem classes em permissions chamando POST classes recebe 403; o mesmo secretary com classes liberado recebe 200/201
criterio_aceite: Nenhuma rota de classes.py usa require_role ou get_current_user puro para autorizacao de modulo; suite backend verde
depende_de: [T-01.02, T-02.02]
paralelizavel: true
status: concluida
```

> **T-03.05 — CONCLUÍDA (2026-09-05, suíte: 111 passed, 0 failed).**

---

```yaml
id: T-03.06
titulo: Enforcement do modulo attendance
objetivo: Exigir require_permission attendance em toda rota de leitura e escrita de frequencia (hoje sem nenhuma checagem de papel)
arquivos:
  cria: [backend/tests/test_enforcement_attendance.py]
  altera: [backend/app/routes/attendance.py]
teste_integracao: Toda rota de attendance.py exige require_permission attendance; super_admin sempre passa, quem tem o modulo passa, quem nao tem recebe 403
teste_funcional: Um teacher sem attendance em permissions chamando POST attendance/bulk recebe 403; o mesmo teacher com attendance liberado recebe 200
criterio_aceite: Nenhuma rota de attendance.py usa apenas get_current_user para autorizacao de modulo; suite backend verde
depende_de: [T-01.02, T-02.02]
paralelizavel: true
status: concluida
```

> **T-03.06 — CONCLUÍDA (2026-09-05, suíte: 127 passed, 0 failed).**

---

```yaml
id: T-03.07
titulo: Enforcement do modulo evaluations
objetivo: Exigir require_permission evaluations em toda rota de leitura e escrita de avaliacoes e pesos (hoje sem nenhuma checagem de papel)
arquivos:
  cria: [backend/tests/test_enforcement_evaluations.py]
  altera: [backend/app/routes/evaluations.py, backend/app/routes/weight_config.py]
teste_integracao: Toda rota de evaluations.py e weight_config.py exige require_permission evaluations; super_admin sempre passa, quem tem o modulo passa, quem nao tem recebe 403
teste_funcional: Um teacher sem evaluations em permissions chamando POST evaluations recebe 403; o mesmo teacher com evaluations liberado recebe 200/201
criterio_aceite: Nenhuma rota de evaluations.py ou weight_config.py usa apenas get_current_user para autorizacao de modulo; suite backend verde
depende_de: [T-01.02, T-02.02]
paralelizavel: true
status: concluida
```

> **T-03.07 — CONCLUÍDA (2026-09-05, suíte: 127 passed, 0 failed).**

---

```yaml
id: T-03.08
titulo: Enforcement do modulo boletins
objetivo: Exigir require_permission boletins em toda rota de leitura de boletins (hoje sem nenhuma checagem de papel)
arquivos:
  cria: [backend/tests/test_enforcement_boletins.py]
  altera: [backend/app/routes/boletins.py]
teste_integracao: Toda rota de boletins.py exige require_permission boletins; super_admin sempre passa, quem tem o modulo passa, quem nao tem recebe 403
teste_funcional: Um teacher sem boletins em permissions chamando GET boletins/{student_id} recebe 403; o mesmo teacher com boletins liberado recebe 200
criterio_aceite: Nenhuma rota de boletins.py usa apenas get_current_user para autorizacao de modulo; suite backend verde
depende_de: [T-01.02, T-02.02]
paralelizavel: true
status: concluida
```

> **T-03.08 — CONCLUÍDA (2026-09-05, suíte: 127 passed, 0 failed).**

---

```yaml
id: T-03.09
titulo: Enforcement do modulo certificates
objetivo: Exigir require_permission certificates em toda rota de leitura e escrita de certificados
arquivos:
  cria: [backend/tests/test_enforcement_certificates.py]
  altera: [backend/app/routes/certificates.py]
teste_integracao: Toda rota de certificates.py exige require_permission certificates; super_admin sempre passa, quem tem o modulo passa, quem nao tem recebe 403
teste_funcional: Um secretary sem certificates em permissions chamando POST certificates recebe 403; o mesmo secretary com certificates liberado recebe 200/201
criterio_aceite: Nenhuma rota de certificates.py usa require_role ou get_current_user puro para autorizacao de modulo; suite backend verde
depende_de: [T-01.02, T-02.02]
paralelizavel: true
status: concluida
```

> **T-03.09 — CONCLUÍDA (2026-09-05, suíte: 127 passed, 0 failed).**

---

```yaml
id: T-03.10
titulo: Enforcement do modulo financial
objetivo: Exigir require_permission financial em toda rota de leitura e escrita de financeiro carnes e materiais didaticos
arquivos:
  cria: [backend/tests/test_enforcement_financial.py]
  altera: [backend/app/routes/financial.py, backend/app/routes/carnes.py, backend/app/routes/materials.py]
teste_integracao: Toda rota de financial.py carnes.py e materials.py exige require_permission financial; super_admin sempre passa, quem tem o modulo passa, quem nao tem recebe 403
teste_funcional: Um secretary sem financial em permissions chamando POST financial/plans recebe 403; o mesmo secretary com financial liberado recebe 200/201
criterio_aceite: Nenhuma rota de financial.py, carnes.py ou materials.py usa require_role ou get_current_user puro para autorizacao de modulo; suite backend verde
depende_de: [T-01.02, T-02.02]
paralelizavel: true
status: concluida
```

> **T-03.10 — CONCLUÍDA (2026-09-05, suíte: 148 passed, 0 failed).**

---

```yaml
id: T-03.11
titulo: Enforcement do modulo schedule
objetivo: Exigir require_permission schedule em toda rota de leitura e escrita de agenda
arquivos:
  cria: [backend/tests/test_enforcement_schedule.py]
  altera: [backend/app/routes/schedule.py]
teste_integracao: Toda rota de schedule.py exige require_permission schedule; super_admin sempre passa, quem tem o modulo passa, quem nao tem recebe 403
teste_funcional: Um secretary sem schedule em permissions chamando POST schedule recebe 403; o mesmo secretary com schedule liberado recebe 200/201
criterio_aceite: Nenhuma rota de schedule.py usa require_role ou get_current_user puro para autorizacao de modulo; suite backend verde
depende_de: [T-01.02, T-02.02]
paralelizavel: true
status: concluida
```

> **T-03.11 — CONCLUÍDA (2026-09-05, suíte: 148 passed, 0 failed).**

---

```yaml
id: T-03.12
titulo: Enforcement dos modulos dashboard e reports
objetivo: Exigir require_permission dashboard na rota de dashboard e require_permission reports nas demais rotas de reports.py (hoje sem nenhuma checagem de papel)
arquivos:
  cria: [backend/tests/test_enforcement_reports.py]
  altera: [backend/app/routes/reports.py]
teste_integracao: GET reports/dashboard exige require_permission dashboard; as demais rotas de reports.py exigem require_permission reports; super_admin sempre passa
teste_funcional: Um secretary sem dashboard em permissions chamando GET reports/dashboard recebe 403; um secretary sem reports em permissions chamando GET reports/financial recebe 403
criterio_aceite: GET reports/dashboard usa require_permission dashboard; todas as outras rotas de reports.py usam require_permission reports; suite backend verde
depende_de: [T-01.02, T-02.02]
paralelizavel: true
status: concluida
```

> **T-03.12 — CONCLUÍDA (2026-09-05, suíte: 148 passed, 0 failed).**

---

```yaml
id: T-03.13
titulo: Enforcement do modulo audit
objetivo: Trocar require_role admin por require_permission audit na rota de auditoria
arquivos:
  cria: [backend/tests/test_enforcement_audit.py]
  altera: [backend/app/routes/audit.py]
teste_integracao: GET audit exige require_permission audit; super_admin sempre passa, quem tem o modulo passa, quem nao tem recebe 403
teste_funcional: Um admin sem audit em permissions chamando GET audit recebe 403; o mesmo admin com audit liberado recebe 200
criterio_aceite: GET audit usa require_permission audit em vez de require_role admin; suite backend verde
depende_de: [T-01.02, T-02.02]
paralelizavel: true
status: concluida
```

> **T-03.13 — CONCLUÍDA (2026-09-05, suíte: 148 passed, 0 failed).**

---

```yaml
id: T-03.14
titulo: Enforcement do modulo settings
objetivo: Trocar require_role admin/secretary por require_permission settings nas rotas de escrita de configuracoes, mantendo a leitura aberta a qualquer autenticado
arquivos:
  cria: [backend/tests/test_enforcement_settings.py]
  altera: [backend/app/routes/settings.py]
teste_integracao: PUT settings e POST settings/logo exigem require_permission settings; GET settings continua exigindo apenas usuario autenticado, sem checagem de modulo
teste_funcional: Um admin sem settings em permissions chamando PUT settings recebe 403; o mesmo admin consegue GET settings normalmente para carregar o logo da escola
criterio_aceite: PUT settings e POST settings/logo usam require_permission settings; GET settings continua usando apenas get_current_user; suite backend verde
depende_de: [T-01.02, T-02.02]
paralelizavel: true
status: concluida
```

> **T-03.14 — CONCLUÍDA (2026-09-05, suíte: 148 passed, 0 failed).** Divergência: `update_settings` faz um *full overwrite* de `SchoolSettings` a cada PUT (`setattr` em todos os campos do schema, aplicando defaults do Pydantic para os omitidos) — os testes de PUT desta task precisaram incluir `pix_key` explicitamente no payload para não zerar o dado esperado por `test_fixtures.py::test_fixture_settings_com_pix` (fixture compartilhada `settings_com_pix`), já que os testes rodam contra o mesmo banco de sessão.

> Nota de implementação (T-03.14): `GET /settings` fica deliberadamente sem `require_permission` — é a rota que o `Sidebar` e a tela de login usam para carregar o logo/branding da escola, e precisa continuar acessível a qualquer usuário autenticado independentemente de módulos liberados.
