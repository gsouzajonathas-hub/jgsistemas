---
expx_schema: 1
expx_tool: sprintx
kind: orquestrador
trabalho_id: super-admin-master
titulo: Super admin como master unico de usuarios e permissoes
tipo_trabalho: feature
tipo_ocorrencia: null
estagio: f6
status: concluido
criado_em: 2026-09-05
atualizado_em: 2026-09-05
concluido_em: 2026-09-05
sprints: [sprint-01, sprint-02, sprint-03, sprint-04]
caminho_critico: [T-01.01, T-01.02, T-02.02, T-02.03, T-03.01, T-04.01, T-04.04]
modulo_afetado: [backend, frontend]
arquivos_alterados: [backend/tests/fixtures.py, backend/tests/test_fixtures_niveis_permissao.py, backend/tests/test_user_delete_extra.py, backend/app/utils/permissions.py, backend/tests/test_permissions_util.py, backend/tests/test_gestao_usuarios_master.py, backend/app/routes/auth.py, backend/tests/test_super_admin.py, backend/tests/test_user_delete_regression.py, backend/tests/test_migracao_permissions_admin.py, backend/alembic/versions/f85cb2a46b22_popula_permissions_admins_existentes.py, backend/app/routes/students.py, backend/app/routes/students_profile.py, backend/tests/test_enforcement_students.py, backend/app/routes/enrollments.py, backend/tests/test_enforcement_enrollments.py, backend/app/routes/courses.py, backend/tests/test_enforcement_courses.py, backend/app/routes/teachers.py, backend/tests/test_enforcement_teachers.py, backend/app/routes/classes.py, backend/tests/test_enforcement_classes.py, backend/app/routes/attendance.py, backend/tests/test_enforcement_attendance.py, backend/app/routes/evaluations.py, backend/app/routes/weight_config.py, backend/tests/test_enforcement_evaluations.py, backend/app/routes/boletins.py, backend/tests/test_enforcement_boletins.py, backend/app/routes/certificates.py, backend/tests/test_enforcement_certificates.py, backend/app/routes/financial.py, backend/app/routes/carnes.py, backend/app/routes/materials.py, backend/tests/test_enforcement_financial.py, backend/app/routes/schedule.py, backend/tests/test_enforcement_schedule.py, backend/app/routes/reports.py, backend/tests/test_enforcement_reports.py, backend/app/routes/audit.py, backend/tests/test_enforcement_audit.py, backend/app/routes/settings.py, backend/tests/test_enforcement_settings.py, frontend/src/contexts/AuthContext.tsx, frontend/src/contexts/__tests__/AuthContext.test.tsx, frontend/src/components/Sidebar.tsx, frontend/src/components/__tests__/Sidebar.test.tsx, frontend/src/pages/Settings.tsx, frontend/src/pages/__tests__/Settings.test.tsx, frontend/src/pages/__tests__/Settings.adminComum.test.tsx, frontend/src/App.test.tsx]
palavras_chave: [super_admin, permissoes, master, usuarios, autorizacao, modulos, enforcement, rbac]
---

# Orquestrador — super-admin-master

> Porta de entrada da execução. Escrito para quem abriu o repositório agora e não sabe nada. Só caminhos relativos; nunca o valor de um segredo.

## 1. Objetivo

Tornar o `super_admin` o único usuário com poder total e irrestrito sobre o sistema JG Sistemas: só ele cria, edita e exclui usuários, e só ele define quais dos 15 módulos (os 12 já existentes + Auditoria + Configurações) cada usuário pode ou não usar. O `admin` comum deixa de ter acesso automático a tudo e passa a ser regulável por permissão, igual secretaria/professor. A ocultação de módulo deixa de ser só visual: o backend passa a bloquear de verdade quem não tem o módulo liberado.

## 2. Mapa e ordem de leitura

1. Este arquivo (`ORQUESTRADOR.md`)
2. `00-DECISOES.md` — decisões D-01 a D-06 que governam o plano
3. `base/00-INDICE.md` — e os arquivos da base que ele lista (auth backend, permissões frontend, convenções de teste, contexto histórico)
4. `sprint-01/sprint.md` → `fases.md` → `tasks.md`
5. `sprint-02/sprint.md` → `fases.md` → `tasks.md`
6. `sprint-03/sprint.md` → `fases.md` → `tasks.md`
7. `sprint-04/sprint.md` → `fases.md` → `tasks.md`
8. `00-BLOQUEIOS.md` — bloqueios registrados durante a execução
9. `00-AUDITORIA.md` — achados MÉDIA/BAIXA que permanecem válidos (criado na F5)

## 3. Rota de execução

- Sprint 01: F-01.1 (sequencial: T-01.01 → T-01.02)
- Sprint 02: F-02.1 (T-02.01 ∥ T-02.02, paralelas) → F-02.2 (T-02.03)
- Sprint 03: F-03.1 (T-03.01 a T-03.14, as 14 totalmente paralelas entre si)
- Sprint 04: F-04.1 (T-04.01 ∥ T-04.02 ∥ T-04.03, paralelas) → F-04.2 (T-04.04)

**Caminho crítico:** T-01.01 → T-01.02 → T-02.02 → T-02.03 → T-03.01 → T-04.01 → T-04.04 (a cadeia de sprint-03 usa `T-03.01` como representante — as 14 tasks daquela fase têm o mesmo comprimento de cadeia e nenhuma depende de outra da própria fase).

## 4. Ferramentas

- **MCPs / SDKs:** nenhum além do padrão
- **Testes backend:** `python -m pytest -q` (na pasta `backend/`)
- **Testes frontend:** `npx vitest run` (na pasta `frontend/`)
- **Lint:** NÃO EXISTE NO PROJETO
- **Typecheck:** `npx tsc --noEmit` (na pasta `frontend/`); backend não tem typecheck
- **Build:** `npm run build` (na pasta `frontend/` — roda `tsc && vite build`)
- **Segredos:** nenhum segredo novo. `SUPPORT_ADMIN_EMAIL`/`SUPPORT_ADMIN_PASSWORD` (já existentes, painel do Render) continuam sendo a única forma de existir uma conta `super_admin` — esta feature não altera isso.

## 5. Agentes

- **Implementador** — escreve primeiro os dois testes da task, vê ambos falharem, implementa até passarem.
- **Revisor de testes** — antes de aceitar o verde, responde: este teste falharia com uma implementação errada? Se não, o teste volta.
- **Auditor de aceite** — verifica de fato o `criterio_aceite` da task antes de permitir `status: concluida`.

**Agente único:** assume os três papéis em sequência dentro de cada task, nesta ordem, tratando cada papel como um portão — não avança ao papel seguinte sem fechar o anterior.

## 6. Regras de autonomia

1. Não pergunte nada; não peça autorização para nada.
2. O teste vem antes do código, sempre.
3. Task só é `concluida` com teste de integração E funcional passando e `criterio_aceite` verificado. Não existe "concluído com ressalva".
4. Dúvida nova ou pré-requisito faltando: registrar em `00-BLOQUEIOS.md` (`B-NN | task | bloqueio | o que destravaria`), marcar a task `bloqueada`, pular para a próxima paralelizável. Nunca parar e esperar.
5. Só rode em paralelo o que o plano declarou paralelizável (Seção 3); a execução nunca decide paralelismo.
6. Atualize `status` em `tasks.md` a cada transição; ao concluir, acrescente data e resultado da suíte.
7. Critério de saída de fase/sprint não atendido = não avança.
8. Escopo travado: só arquivos listados nas tasks; nada de refactor de brinde. Se uma rota de um módulo dos 15 aparecer em arquivo não listado, registre em `00-BLOQUEIOS.md` em vez de expandir a task sozinho.

## 7. Definição de pronto global

- [ ] `POST /auth/register`, `PUT /auth/users/{id}` e `DELETE /auth/users/{id}` só aceitam `super_admin` (D-01); `admin` comum recebe 403 nas três.
- [ ] `ALL_MODULES` (backend) e `ALL_PERMISSIONS` (frontend) têm 15 chaves, incluindo `audit` e `settings` (D-04).
- [ ] Todo `admin` que já existia no banco antes desta feature preserva acesso a todos os 15 módulos após `alembic upgrade head`, sem intervenção manual (D-05).
- [ ] Nenhuma rota de negócio dos 15 módulos usa `require_role` ou `get_current_user` puro para autorização de módulo — todas usam `require_permission` (D-03), exceto `GET /settings` (deliberadamente aberto para qualquer autenticado, usado pelo branding).
- [ ] `hasPermission` (frontend) só dá bypass automático para `role === 'super_admin'` (D-02); `admin` comum é regulado por `permissions` como qualquer outro role.
- [ ] A aba "Usuários" em Configurações só é visível/utilizável para `super_admin`; o formulário de usuário mostra os 15 checkboxes de módulo mesmo quando o role selecionado é `admin`.
- [ ] `pytest` (backend) 0 failed; `vitest` (frontend) 0 failed; `npm run build` exit 0.
- [ ] QA funcional: super_admin cria um `secretary` com só o módulo `students` liberado; esse usuário só vê Alunos no menu e recebe 403 ao chamar diretamente a API de qualquer outro módulo.

## 8. Como retomar uma sessão interrompida

1. Leia este arquivo inteiro.
2. Leia o `status` de cada task em cada `sprint-NN/tasks.md`.
3. Leia `00-BLOQUEIOS.md`.
4. Continue da primeira task `pendente` ou `em_andamento` cujas dependências (`depende_de`) estão todas `concluida`. Ignore as `bloqueada` até que o bloqueio registrado seja resolvido.
