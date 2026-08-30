# BACKEND — NÚCLEO (FastAPI + SQLAlchemy)

> Fatos lidos do código real em `backend/app/`. Nada inventado; números com referência `arquivo:linha`.

## Contrato de entrada

- **App**: FastAPI `title="Gestão Escolar - Sistema de Gestão"`, `version="1.0.0"` (`backend/app/main.py:98-105`). Docs em `/docs` e `/redoc` apenas se `ENVIRONMENT != "production"` (`main.py:20, 103-104`).
- **Carregamento de env**: `load_env()` roda na linha 10 de `main.py`, antes do import de rotas; lê `.env` em `backend/` via `load_dotenv(_BACKEND_DIR / ".env")` (`app/config.py:4-9`).
- **Banco (DNS)**: `DATABASE_URL` (default `""`). Resolução do driver async (`app/database.py:8-18`):
  - contém `postgresql` → `postgresql+asyncpg://`
  - começa com `sqlite` → `sqlite+aiosqlite:///`
  - senão default → `sqlite+aiosqlite:///{get_data_dir()}/escola.db`
- **Schema**: criado no startup via `Base.metadata.create_all` dentro de `engine.begin()` (`main.py:28-29`). Não há Alembic. Para SQLite, há ALTERs manuais que adicionam colunas: `students.monthly_fee`, `students.due_day`, `users.reset_token_hash`, `users.reset_token_expires`, `users.permissions`, `installments.carnet_id`, `installments.installment_number`, `installments.discount`, `installments.late_fee`, `installments.interest`, `installments.total_paid`, `installments.contract_id`, `financial_plans.course_id`, `financial_plans.duration_months`, `financial_plans.discount_type`, `financial_plans.discount_value`, `financial_plans.upfront_discount_pct`, `school_settings.pix_key`, `school_settings.slogan`, `school_settings.social_media`, `school_settings.payment_methods` (`main.py:31-85`).
- **Seed**: se não houver `School`, cria `School(name="Gestão Escolar")` (`main.py:87-93`).
- **JWT**: algoritmo `HS256` (`app/utils/auth.py:29`); `SECRET_KEY` obrigatória — backend recusa iniciar (`RuntimeError`) se a chave estiver em `{"super-secret-key-change-in-production", "changeme", ""}` (`auth.py:17-27`); expiração `ACCESS_TOKEN_EXPIRE_MINUTES` default `"60"` (`auth.py:30`).
- **Senha**: hash bcrypt (`verify_password`/`hash_password`, `auth.py:35-40`); mínimo 8 caracteres (`validate_password`, `auth.py:43-45`).
- **Dependências de auth nas rotas**: `get_current_user` (Bearer via `HTTPBearer`, 401 se inválido/expirado/inativo, `auth.py:69-82`); `require_role(*roles)` → 403 "Acesso negado" (`auth.py:85-89`).
- **Rate limit** (janela deslizante em memória, `app/utils/security.py:4-23`, sessão por IP via `x-forwarded-for`/`client.host`): login 10/300s, register 5/300s, forgot 5/900s, reset 5/900s (`app/routes/auth.py:93,127,234,269`); comunicação: 30/900s por usuário e 60/900s por IP (`app/routes/communication.py:66-68`).

## Contrato de saída

- `GET /api/health` → `{"status": "ok", "message": "Sistema de gestão escolar"}` (`main.py:168-170`).
- Middlewares HTTP inline (`main.py:120-141`): `security_headers` (X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: same-origin) e `uploads_security_headers` (apenas caminhos `/uploads`: nosniff, Content-Disposition attachment se não for imagem, CSP `default-src 'none'`). `app/middleware/__init__.py` está vazio (0 linhas).
- CORS: origens default `http://localhost:5173,http://localhost:5174,http://localhost:3000` (vindo de `CORS_ORIGINS`), `allow_credentials=True`, métodos GET/POST/PUT/PATCH/DELETE/OPTIONS, headers Authorization/Content-Type (`main.py:108-117`).
- Mounts estáticos: `/uploads` → `UPLOAD_DIR` (`main.py:144-146`); `/assets` → `frontend_dist/assets` se existir (`main.py:148-150`). SPA fallback em `GET /{full_path:path}` (`main.py:176-181`).

## Modelos (tabelas, colunas principais)

Fonte: `backend/app/models/*.py` (colunas com tipo/constraints; `*` = NOT NULL).

| Tabela | Colunas-chave |
|---|---|
| `students` (student.py:8-35) | id PK; photo_url, full_name*, cpf (unique), rg, birth_date, gender, marital_status, phone, whatsapp, email, zip_code, street, number, neighborhood, city, state, english_level, enrollment_date, status (default active), notes, unit (default Matriz), monthly_fee Numeric(10,2), due_day, created_at/updated_at |
| `responsibles` (student.py:43-52) | id PK; student_id FK unique*, full_name*, cpf, phone, email, parentesco |
| `courses` (course.py:8-16) | id PK; name*, level*, description, duration_hours (default 0), price (default 0) |
| `teachers` (teacher.py:8-22) | id PK; photo_url, full_name*, cpf unique, phone, whatsapp, email, specialization, hourly_rate (default 0), is_active (default True), notes |
| `class_groups` (class_group.py:8-24) | id PK; name*, course_id FK*, teacher_id FK*, room, weekdays*, start_time*, end_time*, max_capacity (default 20), current_count (default 0), level, unit (default Matriz), is_active |
| `enrollments` (enrollment.py:8-17) | id PK; student_id FK*, class_group_id FK*, enrollment_date*, status (default active), notes |
| `attendances` (attendance.py:8-16) | id PK; student_id FK*, class_group_id FK*, date*, status*, notes. ⚠️ Modelo NÃO importado no startup (ver LACUNAS) |
| `evaluations` (evaluation.py:8-20) | id PK; student_id FK*, class_group_id FK*, eval_type*, title*, date*, score (default 0), max_score (default 10), weight (default 1.0), notes. ⚠️ NÃO importado no startup |
| `financial_plans` (financial.py:8-21) | id PK; name*, value Numeric(10,2)*, description, installments (default 1), is_active (default 1), course_id FK, duration_months (default 1), discount_type (default percent), discount_value, upfront_discount_pct |
| `financial_contracts` (financial.py:25-49) | id PK; student_id FK*, plan_id FK*, start_date*, end_date*, mode (default installments), installments_count, monthly_value, gross_total, discount_type/value/amount, final_value, upfront_discount_amount, total_due, guardian_name/cpf/phone/email, notes, status (default pending), signed_at |
| `carnets` (financial.py:53-71) | id PK; student_id FK*, enrollment_id FK, charge_type (default mensalidade), description, total_installments*, installment_value*, discount, late_fee_pct (default 2.0), interest_daily_pct (default 0.033), first_due_date*, interval (default monthly), payment_methods, status (default active), notes |
| `installments` (financial.py:78-99) | id PK; student_id FK*, carnet_id FK, plan_id FK, contract_id FK, installment_number, description*, amount*, discount, late_fee, interest, total_paid (default 0), due_date*, paid_date, status (default pending), payment_method, invoice_url, notes. Índices: ix_installments_student_due, ix_installments_status_due |
| `discounts` (financial.py:110-118) | id PK; student_id FK*, name*, percentage, amount, reason, valid_until |
| `payments` (financial.py:123-132) | id PK; installment_id FK*, amount*, payment_date*, payment_method, receipt_number, notes |
| `calendar_events` (schedule.py:7-17) | id PK; title*, event_type*, date*, start_time, end_time, description, color (default #3B82F6) |
| `communication_logs` (communication.py:7-17) | id PK; channel*, recipient*, subject, message*, sent_by FK users, status (default sent), error_message |
| `school_settings` (settings.py:7-25) | id PK; school_name (default Gestão Escolar), logo_url, address, phone, email, cnpj, pix_key, slogan, social_media, payment_methods (default PIX,Dinheiro,Débito,Crédito), primary_color (default #3B82F6), dark_mode (default 0), due_day (default 5), extra_settings (default {}) |
| `users` (user.py:8-23) | id PK; name*, email unique*, password_hash*, role (default secretary)*, permissions, is_active (default True), avatar_url, school_id FK, reset_token_hash (String(64)), reset_token_expires, last_login |
| `schools` (school.py:8-16) | id PK; name*, contact_email, contact_phone, is_active |
| `audit_logs` (audit_log.py:8-17) | id PK; user_id FK, action*, entity, entity_id, details, ip_address (String(50)) |
| `file_uploads` (file_upload.py:8-17) | id PK; student_id FK*, file_name*, file_type, file_path*, file_size (default 0), category |
| `teaching_materials` (materials.py:8-17) | id PK; name*, description, price*, stock (default 0), category, is_active (default 1) |
| `material_sales` (materials.py:23-33) | id PK; material_id FK*, student_id FK*, quantity (default 1), unit_price*, total_price*, payment_method, notes |
| `grade_weight_configs` (weight_config.py:7-18) | id PK; class_group_id FK*, label*, eval_type*, weight (default 1.0), max_score (default 10.0); UniqueConstraint(class_group_id, eval_type). ⚠️ NÃO importado no startup |
| `certificates` (certificate.py:8-21) | id PK; student_id FK*, class_group_id FK*, level*, course_name, teacher_name, media (default 0), frequency (default 0), workload_hours, control_number (unique), issue_date*, created_at. ⚠️ NÃO importado no startup |

**Importante**: `app/models/__init__.py` NÃO importa `Attendance`, `Evaluation`, `Certificate`, `GradeWeightConfig` — esses módulos só são carregados por rotas que não estão registradas no app (ver `02-api-rotas.md`), portanto as tabelas `attendances`, `evaluations`, `certificates`, `grade_weight_configs` **não são criadas** por `create_all` no startup.

## Limites e cotas

- Uploads: máx 5 MB (`MAX_UPLOAD_SIZE = 5*1024*1024`, `app/utils/uploads.py:6`); extensões permitidas: png, jpg/jpeg, gif, webp, pdf, doc, docx, xls, xlsx, csv (`uploads.py:9-21`).
- Pool Postgres: `pool_size=10`, `max_overflow=20`, `pool_recycle=3600` (`database.py:21`).
- Rate limit de login/registro/reset conforme acima (janelas 300s/900s).

## Erros conhecidos e tratamento

- Token inválido/expirado → 401 "Token inválido ou expirado" (`utils/auth.py:63-66`); usuário inativo → 401 (`auth.py:81`).
- `SECRET_KEY` padrão → `RuntimeError` no boot (`utils/auth.py:24-27`).
- Rate limit estourado → 429 "Muitas tentativas. Aguarde alguns minutos." (`routes/auth.py:93-94`).
- Upload inválido → 400 (extensão/MIME/conteúdo) ou 413 (acima de 5 MB) (`utils/uploads.py:48-63`).
- Falta de credencial Bearer → 403 (default `HTTPBearer(auto_error=True)`, comportamento do framework).
- Validação Pydantic → 422 (default do framework).

## Riscos para a nossa implementação

1. **Cadastro de usuário**: sem nenhum usuário → registro aberto (bootstrap); com usuários → exige admin (`routes/auth.py:132-136`). Impacta onboarding e testes.
2. **Criação de schema por `create_all` + ALTERs manuais**: sem migrations versionadas; mudança de model exige ALTER manual novo ou recriação de banco.
3. **Tabelas de frequência/avaliações/certificados/pesos não são criadas**: módulos existem (código e telas) mas estão desligados do startup — qualquer plano que toque esses módulos precisa decidir como ativá-los.
4. **Rate limit em memória**: reinicia a cada deploy (não persiste), e não funciona com múltiplas réplicas.
5. **Reset de senha**: token 30 min, armazenado como hash sha256 (`routes/auth.py:23, 68-69`); sem SMTP configurado o link sai no console (não-production) — sem e-mail real o fluxo só funciona localmente.

## Fonte

- `backend/app/main.py`, `backend/app/database.py`, `backend/app/config.py`, `backend/app/models/*.py`, `backend/app/utils/auth.py`, `backend/app/utils/security.py`, `backend/app/middleware/__init__.py`, `backend/app/routes/auth.py` — acessado em 2026-08-29.