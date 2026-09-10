# Lacunas — correcoes-melhorias-painel (F2 DESCOBERTA)

> Data: 2026-09-10

## Lacunas estruturais

| # | Severidade | Descrição |
|---|---|---|
| L1 | MÉDIA | `weight_config.py` — PUT substitui todas as configs (replace-all). Payload parcial apaga configs não enviadas. Precisa de semântica merge. |
| L2 | MÉDIA | `students_profile.py` — Backend suporta upload de foto mas frontend não tem UI para isso (campo ignorado). |
| L3 | MÉDIA | `attendance.py:94` — N+1 queries: para cada turma no bulk, faz query separada para estudantes + evaluations. Com 20 turmas = ~62 queries. |
| L4 | BAIXA | `auth.py:155` — Whitelist de roles só aceita `admin|secretary|teacher`. Se `super_admin` for enviado, é demovido para `secretary` silenciosamente. |
| L5 | BAIXA | `Classes.tsx`, `Enrollments.tsx` — Sem filtros na listagem (turmas por curso/professor; matrículas por status/turma). |
| L6 | BAIXA | `Carnes.tsx` — Sem estorno de pagamento (só registro). |
| L7 | BAIXA | `Contratos.tsx` — Sem edição de contrato (só criação). |

## Lacunas de UX

| # | Descrição |
|---|---|
| UX1 | Settings.tsx — Sem preview de cores (só salva e vê resultado). |
| UX2 | Schedule.tsx — Sem visualização "lista" (só calendário mensal). |
| UX3 | Evaluations.tsx — Sem importação em massa de notas (só individual). |
| UX4 | Reports.tsx — Sem agendamento de relatórios (só manual). |
