# Modelo de Dados (Schema)

> Área estudada na F1 do sprintx para o painel de administrador do sistema. Fonte primária: `backend/app/models/*.py` e `supabase/migrations/20260830000100_init.sql` (espelha os modelos SQLAlchemy). Acessado em 2026-09-03.

## Contrato de entrada

Não é um recurso que recebe parâmetros; é a camada de persistência do sistema. Banco Postgres (Supabase) em produção (`PGHOST=aws-0-us-west-2.pooler.supabase.com`), SQLite em dev.

## Contrato de saída

22 tabelas monitoradas por modelos SQLAlchemy (20 arquivos em `backend/app/models/__init__.py` registram as entidades). Criação de tabelas por `Base.metadata.create_all` no startup (`backend/app/main.py:31`) + migração SQL manual para Supabase (`supabase/migrations/20260830000100_init.sql`, 486 linhas). **Não há Alembic.** Em SQLite, há camada extra de `ALTER TABLE` no startup (`main.py:33-87`) para colunas adicionadas após criação inicial. Bootstrap cria uma escola padrão "Gestão Escolar" se nenhuma existir (`main.py:89-95`).

## Entidades (tabela: modelo | colunas-chave | tem school_id?)

| # | Modelo | Tabela | Colunas-chave | school_id? |
|---|---|---|---|---|
| 1 | School | `schools` | id, name, contact_email, contact_phone, is_active | (é a própria escola) |
| 2 | User | `users` | id, name, email(UNIQUE), password_hash, **role**, **permissions**(Text JSON), is_active, avatar_url, **school_id(FK)** | **SIM, nullable** |
| 3 | Student | `students` | id, full_name, cpf, status, unit, monthly_fee, due_day | NÃO |
| 4 | Responsible | `responsibles` | id, student_id(FK UNIQUE), full_name, cpf, parentesco | NÃO |
| 5 | Teacher | `teachers` | id, full_name, cpf, specialization, hourly_rate, is_active | NÃO |
| 6 | Course | `courses` | id, name, level, duration_hours, price | NÃO |
| 7 | ClassGroup | `class_groups` | id, name, course_id(FK), teacher_id(FK), weekdays, room, max_capacity, unit | NÃO |
| 8 | Enrollment | `enrollments` | id, student_id(FK), class_group_id(FK), status | NÃO |
| 9 | FinancialPlan | `financial_plans` | id, name, value, course_id(FK), installments, discount_* | NÃO |
| 10 | FinancialContract | `financial_contracts` | id, student_id(FK), plan_id(FK), start/end_date, status, guardian_* | NÃO |
| 11 | Carne | `carnets` | id, student_id(FK), enrollment_id(FK), total_installments, status | NÃO |
| 12 | Installment | `installments` | id, student_id(FK), carnet_id(FK), plan_id(FK), contract_id(FK), status, due_date | NÃO |
| 13 | Discount | `discounts` | id, student_id(FK), name, percentage, amount | NÃO |
| 14 | Payment | `payments` | id, installment_id(FK), amount, payment_date | NÃO |
| 15 | Attendance | `attendances` | id, student_id(FK), class_group_id(FK), date, status | NÃO |
| 16 | Evaluation | `evaluations` | id, student_id(FK), class_group_id(FK), eval_type, score, weight | NÃO |
| 17 | Certificate | `certificates` | id, student_id(FK), class_group_id(FK), control_number, issue_date | NÃO |
| 18 | GradeWeightConfig | `grade_weight_configs` | id, class_group_id(FK), eval_type, weight, max_score | NÃO |
| 19 | SchoolSettings | `school_settings` | id, school_name, logo_url, cnpj, pix_key, primary_color, ... | NÃO (sem FK p/ schools) |
| 20 | CalendarEvent | `calendar_events` | id, title, event_type, date, start_time | NÃO |
| 21 | CommunicationLog | `communication_logs` | id, channel, recipient, sent_by(FK->users), status | NÃO |
| 22 | AuditLog | `audit_logs` | id, user_id(FK), action, entity, entity_id, ip_address | NÃO |
| — | TeachingMaterial | `teaching_materials` | id, name, price, stock, category | NÃO |
| — | MaterialSale | `material_sales` | id, material_id(FK), student_id(FK), quantity, total_price | NÃO |
| — | FileUpload | `file_uploads` | id, student_id(FK), file_name, file_path, category | NÃO |
| — | Lead | `leads` | id, name, email, phone, source, status | NÃO (tabela ausente na migração SQL) |

## Modelo User (backend/app/models/user.py:7-26)

- `id` PK, `name` String(200) NOT NULL, `email` String(255) UNIQUE NOT NULL, `password_hash` String(255) NOT NULL
- `role` String(20) DEFAULT 'secretary' — aceita: "admin" | "secretary" | "teacher"
- `permissions` Text nullable (JSON array serializado, ex.: `["students.view","financial.edit"]`)
- `is_active` Boolean DEFAULT True, `avatar_url` String(500)
- `school_id` Integer FK->schools.id NULLABLE (único campo de multi-tenancy no User)
- `reset_token_hash` String(64), `reset_token_expires` DateTime(tz), `last_login`, `created_at`, `updated_at`
- Relationships: `audit_logs` e `school` (back_populates)

## Gaps de multi-tenancy (críticos para o painel de admin global)

1. **Zero isolamento por escola** — nenhuma tabela operacional (students, teachers, courses, class_groups, enrollments, financial, attendance, evaluations, etc.) tem `school_id`. Todos os dados são globais.
2. **SchoolSettings é singleton global** (busca LIMIT 1, não filtra por escola) — sem FK para schools.id.
3. **School é enxuta** — só name, contact_email, contact_phone, is_active. Faltam CNPJ, endereço, logo, plano, etc.
4. **JWT não carrega school_id** — payload só tem `sub` e `role`.
5. **Nenhuma rota filtra por school_id** — todas as queries são globais.
6. **Lead existe como modelo mas não na migração SQL** do Supabase.

## Limites e cotas

- Uploads: limite de 5 MB, validação por extensão/MIME/conteúdo (README.md). Cada valor referenciado em `documentacao` README.md "Segurança".
- Paginação: NÃO DOCUMENTADO (não observada nos arquivos lidos nesta ingestão).

## Erros conhecidos e tratamento

- Conexão ao Supabase por variáveis PG* separadas por causa de senha com caracteres especiais (`***REDACTED***`) (README.md, contexto de deploy). Cada valor referenciado; não documentado como erro tratado em código.

## Riscos para a nossa implementação

- Adicionar `school_id` a dezenas de tabelas é uma migração de larga escala e arriscada; exige planejamento cuidadoso no sprintx.
- A tabela `leads` inexistente na migração SQL indica risco de dessincronia entre modelos SQLAlchemy e schema Postgres real do Supabase.
- Sem Alembic, migrações manuais precisam ser reproduzidas no SQL do Supabase E no create_all — alto risco de divergência.

## Fonte

- `backend/app/models/*.py` (User, School, Student, ...) — acessado 2026-09-03
- `backend/app/main.py` (criação de tabelas) e `backend/app/database.py` (engine async + Base)
- `supabase/migrations/20260830000100_init.sql` (migração SQL)
- `supabase/seed.sql` (seed do admin padrão)
