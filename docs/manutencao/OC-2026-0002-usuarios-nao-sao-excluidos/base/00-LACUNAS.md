# Lacunas de conhecimento — OC-2026-0002

> Arquivo de lacunas: NÃO leva frontmatter. Cada lacuna registra o que ainda não se sabe.

## L-01 — FK audit_logs.user_id sem ondelete

**O que não sabemos:** se o banco de produção (Postgres/Render) foi criado com `create_all` a partir dos models atuais, a constraint `audit_logs.user_id` não tem `ON DELETE` → o banco recusa excluir usuário com histórico. Confirmado por teste (SQLite com `PRAGMA foreign_keys=ON` espelha o Postgres). Falta confirmar o mecanismo de criação do schema em produção (create_all vs migrações).

**Impacto:** exclusão de usuário com histórico → 500.
**Status:** resolvida no E3 — fix no endpoint remove/religa dependências antes do `db.delete`. Models ganham `ondelete` (create_all futuro) mas o fix que vale para o banco existente é a limpeza explícita na rota.

## L-02 — Frontend sem try/catch no handleDeleteUser

**O que não sabemos:** o `handleDeleteUser` (`Settings.tsx:85-89`) não tem try/catch; qualquer falha vira unhandled rejection sem mensagem. Confirmado por leitura do código (linhas citadas).

**Impacto:** usuário clica Excluir, confirma, e nada acontece — sem erro visível.
**Status:** resolvida no E3 — try/catch com alerta (`err.response?.data?.detail || 'Erro ao excluir usuário'`), padrão já usado em `handleSave`/`handleLogo` do mesmo arquivo.

## L-03 — Confirmação de exclusão: window.confirm vs modal

**O que não sabemos:** o usuário pediu "tela com mensagem de confirmação... botão em vermelho ou amarelo" para exclusões importantes — hoje o `Settings.tsx` usa `window.confirm` (nativo, sem cor). As telas Courses/Teachers/Students/Classes já usam botão inline vermelho "Sim"; Carnes/Contratos/Planos/Evaluations/Financial/Schedule usam `window.confirm` ou excluem direto.

**Impacto:** UX de confirmação inconsistente entre telas; pedido explícito do usuário não atendido.
**Status:** resolvido no E3 — componente `ConfirmDialog` reutilizável (modal com mensagem + botão vermelho "Sim, excluir" / amarelo para ações de risco) aplicado em Settings e nas demais telas de exclusão importante.

## L-04 — Proteção contra auto-exclusão / exclusão de usuário com permissões especiais

**O que não sabemos:** backend já bloqueia auto-exclusão (`user_id == current_user.id` → 400). O frontend esconde o botão para a própria conta (`u.id !== user?.id`). Não há proteção contra excluir o **último admin** ativo — risco de travar o sistema sem admin.

**Impacto:** potencial lockout administrativo (sem admin, ninguém mais cria usuários — bootstrap só roda com zero usuários).
**Status:** a confirmar no E2 — se confirmado como risco, incluir guarda no E3 (ex.: bloquear exclusão do último admin ativo com 400 e mensagem clara).

## L-05 — "qualquer opção importante": escopo das confirmações

**O que não sabemos:** o usuário disse "excluir qualquer opção importante... toda vez que excluir algum usuario ou modal". Alcance: só Settings (usuários) ou todas as telas com exclusão (Cursos, Professores, Turmas, Alunos, Carnês, Contratos, Planos, Avaliações, Financeiro, Agenda)?

**Impacto:** escopo do E3 (frontend) depende desta decisão.
**Status:** decidido no E2 — aplicar `ConfirmDialog` em Settings (usuários) + demais telas de CRUD com exclusão destrutiva (todas as listadas), mantendo o padrão de "Sim/Não" onde já existe mas elevando para o modal reutilizável.