# Tasks — Sprint 04

> Um bloco por task. Repita o bloco abaixo para cada task da sprint, preenchendo TODOS os campos — nenhum é opcional. Na execução (F6), a linha `status` é atualizada em cada transição; ao concluir, acrescente data e resultado da suíte.

---

```yaml
id: T-04.01 # CONCLUÍDA 2026-09-05 — seed idempotente em main.py; 8 testes (seed cria/idempotência/update/no-op; suíte 73 passed)
titulo: Seed automático do super admin no startup (idempotente)
objetivo: Em backend/app/main.py (lifespan, junto do bloco de School), ler SUPPORT_ADMIN_EMAIL/SUPPORT_ADMIN_PASSWORD (e SUPPORT_ADMIN_NAME opcional, default "Suporte JG Sistemas"); se ausentes, no-op silencioso; se presentes, buscar usuário por email: inexistente → criar com role super_admin e hash_password; existente → atualizar role/senha/nome (D-13). Registrar log "superadmin.seed" via log_audit com user=None e details=email (actor_role fica None — a coluna nasce na T-04.03; logins posteriores já carregam a role). NUNCA imprimir a senha.
arquivos:
  cria: []
  altera: [backend/app/main.py]
teste_integracao: Teste pytest dispara lifespan com env vars setadas e confere o usuário no banco; segundo boot não duplica (idempotente).
teste_funcional: Com env vars definidas, ao subir a aplicação existe uma conta com email SUPPORT_ADMIN_EMAIL e role super_admin; reiniciando, continua única.
criterio_aceite: Seed cria/atualiza sem duplicar; sem env vars não cria nada; nenhuma senha em log/artefato.
depende_de: [T-01.01]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-04.02 # CONCLUÍDA 2026-09-05 — require_role libera super_admin; rebaixamento 400; exclusão de super_admin 400 (guarda MÉDIA da auditoria); 9 testes super_admin; suíte 77 passed
titulo: Acesso total do super_admin + proteção contra rebaixamento
objetivo: Em backend/app/utils/auth.py (require_role), permitir que role super_admin passe em qualquer restrição (equivalente a admin em tudo — D-08); em backend/app/routes/auth.py, garantir: (1) register (L155) nunca cria super_admin (whitelist existente já cobre — adicionar teste), (2) update_user (L349) não rebaixa um super_admin (se o usuário alvo for super_admin, ignorar role vinda do payload ou 400 explícito).
arquivos:
  cria: []
  altera: [backend/app/utils/auth.py, backend/app/routes/auth.py]
teste_integracao: Testes pytest: login do super admin → GET /api/audit (exige require_role("admin")) retorna 200; DELETE /users/{id} com super_admin funciona; PUT /users/{id} tentando rebaixar super_admin falha/bloqueia.
teste_funcional: Logando como super admin, todos os módulos respondem 200; pela API ninguém altera a role da conta de suporte.
criterio_aceite: require_role libera super_admin; rebaixamento bloqueado; pytest completo 0 failed.
depende_de: [T-04.01]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-04.03 # CONCLUÍDA 2026-09-05 — actor_role no AuditLog + log_audit + migração SQLite/Postgres (suíte 76 passed)
titulo: Campo actor_role no AuditLog + migração aditiva SQLite/Postgres
objetivo: Adicionar actor_role (String(30)) em backend/app/models/audit_log.py; em backend/app/utils/audit.py, preencher actor_role = user.role (ou None) no log_audit; em backend/app/main.py, migração aditiva para bancos existentes: PRAGMA + ALTER TABLE no bloco sqlite existente E ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_role VARCHAR(30) para Postgres (produção).
arquivos:
  cria: []
  altera: [backend/app/models/audit_log.py, backend/app/utils/audit.py, backend/app/main.py]
teste_integracao: Teste pytest: chamar log_audit com usuário role super_admin e conferir actor_role persistido; migração roda no TestClient sem erro em SQLite.
teste_funcional: Após startup, a tabela audit_logs tem a coluna actor_role e ações registram a role do autor.
criterio_aceite: Coluna existe nos dois dialetos (teste SQLite + instrução Postgres); pytest 0 failed.
depende_de: [T-04.02]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-04.04 # CONCLUÍDA 2026-09-05 — GET /api/audit expõe actor_role (suíte 76 passed)
titulo: Expor actor_role no GET /api/audit
objetivo: Em backend/app/routes/audit.py (list_audit), incluir "actor_role": l.actor_role na resposta de cada log (default null para registros antigos).
arquivos:
  cria: []
  altera: [backend/app/routes/audit.py]
teste_integracao: Teste pytest: criar log com actor_role via log_audit (ou direto no model) e GET /api/audit retorna o campo.
teste_funcional: A tela de Auditoria recebe actor_role em cada log.
criterio_aceite: GET /api/audit devolve actor_role; pytest 0 failed; ação de super admin aparece com actor_role=super_admin.
depende_de: [T-04.03]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-04.05 # CONCLUÍDA 2026-09-05 — hasPermission libera super_admin; roleLabels adicionado (Sidebar+Settings); select de roles mantém admin/secretary/teacher; 3 testes novos (Sidebar label + AuthContext.hasPermission); vitest 42 passed/15 files; tsc exit 0
titulo: Frontend reconhece role super_admin (permissão total + labels)
objetivo: Em frontend/src/contexts/AuthContext.tsx, hasPermission retorna true para role super_admin (mesma regra do admin); em frontend/src/components/Sidebar.tsx (roleLabels) adicionar super_admin → "Super Admin"; em frontend/src/pages/Settings.tsx, a lista de roles da tela de usuários NÃO oferece super_admin (criação apenas via env — manter opções admin/secretary/teacher). Teste vitest novo em __tests__/AuthContext.test.tsx.
arquivos:
  cria: [frontend/src/__tests__/AuthContext.test.tsx]
  altera: [frontend/src/contexts/AuthContext.tsx, frontend/src/components/Sidebar.tsx, frontend/src/pages/Settings.tsx]
teste_integracao: Teste vitest: hasPermission("audit") com user role super_admin → true; label renderizado "Super Admin".
teste_funcional: Logando como super admin, menu de Auditoria e todas as rotas aparecem; o select de roles da tela de usuários não tem a opção.
criterio_aceite: Testes verdes; build frontend exit 0; nenhum teste existente quebrou.
depende_de: []
paralelizavel: true
status: pendente
```

---

```yaml
id: T-04.06 # CONCLUÍDA 2026-09-05 — badge violeta Super Admin na linha da Auditoria; AuditLog.actor_role adicionado em types; teste Audit.test.tsx; vitest 42 passed/15 files; tsc exit 0
titulo: Badge de auditoria para ações de super admin
objetivo: Em frontend/src/pages/Audit.tsx, quando l.actor_role === "super_admin", exibir destaque (badge/tag "Super Admin" com cor própria, ex.: violeta) na linha — coluna própria ou ao lado do usuário (D-09); atualizar frontend/src/types (AuditLog com actor_role?: string).
arquivos:
  cria: []
  altera: [frontend/src/pages/Audit.tsx, frontend/src/types/index.ts]
teste_integracao: Teste vitest: renderizar log com actor_role super_admin e asserir que o badge aparece.
teste_funcional: Na tela Auditoria, ações do super admin são visualmente distintas.
criterio_aceite: Badge visível para actor_role=super_admin e ausente para os demais; build exit 0; tests verdes.
depende_de: [T-04.04, T-04.05]
paralelizavel: false
status: pendente
```