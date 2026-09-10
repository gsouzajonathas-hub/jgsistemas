# Mapeamento — correcoes-melhorias-painel (F2 DESCOBERTA)

> Data: 2026-09-10
> Escopo: pacote de correções de bugs, melhorias e novas funcionalidades do painel da escola (2º bloco de demandas).

## Resumo executivo

Análise completa das 9 áreas do sistema. Cada item tem severidade (CRÍTICO/ALTO/MÉDIO/BAIXO), arquivo:linha, e descrição do problema.

---

## Área 1: Alunos

| # | Severidade | Arquivo | Problema |
|---|---|---|---|
| A1-01 | ~~CRÍTICO~~ | students.py:delete_student | ~~Cascade de delete incompleto — faltava Evaluation, Attendance, Certificate, Enrollment, FinancialContract~~ **CORRIGIDO** (commit atual) |
| A1-02 | ~~ALTO~~ | students.py:list_students | ~~Busca só por full_name — placeholder promete CPF, email, telefone~~ **CORRIGIDO** (commit atual) |
| A1-03 | MÉDIO | Students.tsx | Sem paginação visual (botões prev/next) — só infinite scroll implícito |
| A1-04 | MÉDIO | StudentProfile.tsx | Upload de foto não existe no frontend (backend suporta) |
| A1-05 | BAIXO | students.py | Sem validação de CPF duplicado no create/update |

## Área 2: Turmas

| # | Severidade | Arquivo | Problema |
|---|---|---|---|
| A2-01 | ~~ALTO~~ | classes.py | ~~Rota /count conflitava com /{class_id} (422)~~ **CORRIGIDO** (movida antes) |
| A2-02 | ~~MÉDIO~~ | classes.py | ~~Sem validação start_time < end_time~~ **CORRIGIDO** |
| A2-03 | MÉDIO | Classes.tsx | Sem filtros (por curso, professor, status) |
| A2-04 | BAIXO | classes.py | Sem limite de capacidade na criação de matrículas por turma |

## Área 3: Matrículas

| # | Severidade | Arquivo | Problema |
|---|---|---|---|
| A3-01 | ~~ALTO~~ | enrollments.py:renew | ~~Double-count de current_count~~ **CORRIGIDO** |
| A3-02 | MÉDIO | Enrollments.tsx | Sem coluna "Turma" na tabela de listagem |
| A3-03 | MÉDIO | enrollments.py | Sem validação de data de matrícula (pode ser futura ou muito antiga) |
| A3-04 | BAIXO | Enrollments.tsx | Sem filtro por status (active/cancelled/completed) |

## Área 4: Financeiro

| # | Severidade | Arquivo | Problema |
|---|---|---|---|
| A4-01 | ~~CRÍTICO~~ | reports.py + financial.py | ~~Filtro "overdue" usava status=="overdue" — perdia parcelas vencidas com status "pending"~~ **CORRIGIDO** |
| A4-02 | ~~ALTO~~ | financial.py:dashboard | ~~total_revenue somava todos os pagamentos (não filtrava por mês)~~ **CORRIGIDO** |
| A4-03 | ~~MÉDIO~~ | financial.py:register_payment | ~~Sem validação amount > 0~~ **CORRIGIDO** |
| A4-04 | MÉDIO | Carnes.tsx | Sem estorno de pagamento |
| A4-05 | MÉDIO | Contratos.tsx | Sem edição de contrato existente |
| A4-06 | BAIXO | Mensalidades.tsx | Sem visualização de histórico de alterações |

## Área 5: Avaliações e Boletim

| # | Severidade | Arquivo | Problema |
|---|---|---|---|
| A5-01 | ~~CRÍTICO~~ | Boletim.tsx | ~~Visão "Por Turma" usava campos inexistentes (class_name, rows, student_name)~~ **CORRIGIDO** |
| A5-02 | ~~MÉDIO~~ | attendance.py + boletins.py | ~~Frequência não contava "justified" e "late" como presença~~ **CORRIGIDO** |
| A5-03 | MÉDIO | weight_config.py | PUT com semântica replace-all — payload parcial apaga configs existentes |
| A5-04 | BAIXO | Evaluations.tsx | Sem importação em massa de notas |

## Área 6: Frequência

| # | Severidade | Arquivo | Problema |
|---|---|---|---|
| A6-01 | ~~MÉDIO~~ | attendance.py | ~~Frequência não contava "justified" e "late" como presença~~ **CORRIGIDO** |
| A6-02 | MÉDIO | attendance.py:94 | N+1 queries (~62 queries por turma no bulk attendance) |
| A6-03 | BAIXO | Attendance.tsx | Sem relatório de frequência por período (só por turma) |

## Área 7: Configurações e Usuários

| # | Severidade | Arquivo | Problema |
|---|---|---|---|
| A7-01 | ~~MÉDIO~~ | settings.py | ~~Sem validação de due_day (1–31)~~ **CORRIGIDO** |
| A7-02 | ~~MÉDIO~~ | settings.py | ~~Upload de logo não apagava logo antigo do storage~~ **CORRIGIDO** |
| A7-03 | MÉDIO | auth.py:155 | Role whitelist só aceita admin/secretary/teacher — demote super_admin para secretary |
| A7-04 | BAIXO | Settings.tsx | Sem preview de cores antes de salvar |

## Área 8: Relatórios e Comunicação

| # | Severidade | Arquivo | Problema |
|---|---|---|---|
| A8-01 | ~~CRÍTICO~~ | reports.py | ~~Relatório de inadimplência filtrava status=="overdue" — perdia parcelas~~ **CORRIGIDO** |
| A8-02 | MÉDIO | communication.py | Sem template de mensagens (só texto livre) |
| A8-03 | BAIXO | Reports.tsx | Sem agendamento de relatórios |

## Área 9: Materiais Didáticos e Agenda

| # | Severidade | Arquivo | Problema |
|---|---|---|---|
| A9-01 | ~~CRÍTICO~~ | materials.py:144 | ~~Validação de estoque AFTER db.add — object órfão na sessão~~ **CORRIGIDO** |
| A9-02 | ~~ALTO~~ | schedule.py | ~~Sem rota PUT para editar eventos~~ **CORRIGIDO** (endpoint + UI) |
| A9-03 | MÉDIO | materials.py | Sem relatório de vendas por período |
| A9-04 | BAIXO | Schedule.tsx | Sem visualização "lista" (só calendário) |

---

## Itens CORRIGIDOS neste commit

| # | Área | Arquivo | Descrição |
|---|---|---|---|
| 1 | Financeiro | reports.py + financial.py | Filtro overdue: `status=="overdue"` → `status NOT IN (paid,cancelled) AND due_date < hoje` |
| 2 | Financeiro | financial.py:dashboard | total_revenue filtrado por mês selecionado |
| 3 | Financeiro | financial.py:register_payment | Validação `amount > 0` |
| 4 | Turmas | classes.py | Rota `/count` movida antes de `/{class_id}`; validação `start_time < end_time` |
| 5 | Alunos | students.py | Busca por nome, CPF, email e telefone |
| 6 | Alunos | students.py:delete_student | Cascade completo: Evaluation, Attendance, Certificate, Enrollment, FinancialContract |
| 7 | Boletim | Boletim.tsx | Shape dos dados corrigido (class_group.name, students, student.full_name) |
| 8 | Frequência | attendance.py + boletins.py | `justified` e `late` contados como presença |
| 9 | Matrículas | enrollments.py:renew | Double-count de current_count corrigido |
| 10 | Materiais | materials.py:144 | Validação de estoque movida ANTES do db.add |
| 11 | Config | settings.py | Validação due_day 1–31; logo antigo removido do storage no upload |
| 12 | Agenda | schedule.py + Schedule.tsx + api.ts | Endpoint PUT + UI de edição de eventos |
| 13 | Frontend | Carnes.tsx, Mensalidades.tsx, Certificates.tsx, Students.tsx, Planos.tsx, Sidebar.tsx, useSettings.ts | Erros silenciosos substituídos por feedback ao usuário |
| 14 | Infra | vitest.config.ts | `pool: forks` → `pool: threads` (compatibilidade Windows) |

## Itens PENDENTES (prioridade)

| # | Prioridade | Área | Descrição |
|---|---|---|---|
| P1 | ALTA | weight_config.py | PUT replace-all — deve ser merge (não apagar configs não enviadas) |
| P2 | ALTA | StudentProfile.tsx | Upload de foto via frontend (backend já suporta) |
| P3 | MÉDIA | Classes.tsx | Filtros por curso, professor, status |
| P4 | MÉDIA | Enrollments.tsx | Coluna "Turma" na tabela + filtro por status |
| P5 | MÉDIA | Carnes.tsx | Estorno de pagamento |
| P6 | MÉDIA | Contratos.tsx | Edição de contrato existente |
| P7 | MÉDIA | attendance.py | N+1 queries no bulk attendance |
| P8 | BAIXA | auth.py:155 | Role whitelist deve incluir `super_admin` (ou proteger de demotion) |
| P9 | BAIXA | Settings.tsx | Preview de cores antes de salvar |
| P10 | BAIXA | Schedule.tsx | Visualização "lista" além do calendário |
