-- ============================================================================
-- Gestão Escolar - JG Sistemas | Migração inicial (stack local/produção)
-- Espelha fielmente os modelos SQLAlchemy do backend FastAPI (D-02/D-03).
-- Auth continua JWT HS256 próprio validado pela Edge Function "app" (D-06),
-- portanto NÃO usamos RLS nem schemas de auth do GoTrue.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tabela: schools
-- ---------------------------------------------------------------------------
create table if not exists public.schools (
    id              serial primary key,
    name            varchar(300) not null,
    contact_email   varchar(255) not null default '',
    contact_phone   varchar(50)  not null default '',
    is_active       boolean      not null default true,
    created_at      timestamptz  not null default now(),
    updated_at      timestamptz
);

-- ---------------------------------------------------------------------------
-- Tabela: users
-- ---------------------------------------------------------------------------
create table if not exists public.users (
    id                  serial primary key,
    name                varchar(200) not null,
    email               varchar(255) not null unique,
    password_hash       varchar(255) not null,
    role                varchar(20)  not null default 'secretary',
    permissions         text,
    is_active           boolean      not null default true,
    avatar_url          varchar(500),
    school_id           integer references public.schools (id) on delete set null,
    reset_token_hash    varchar(64),
    reset_token_expires timestamptz,
    last_login          timestamptz,
    created_at          timestamptz  not null default now(),
    updated_at          timestamptz
);
create index if not exists ix_users_email on public.users (email);
create index if not exists ix_users_school_id on public.users (school_id);

-- ---------------------------------------------------------------------------
-- Tabela: students
-- ---------------------------------------------------------------------------
create table if not exists public.students (
    id              serial primary key,
    photo_url       varchar(500),
    full_name       varchar(300) not null,
    cpf             varchar(14) unique,
    rg              varchar(20),
    birth_date      date,
    gender          varchar(5),
    marital_status  varchar(20),
    phone           varchar(20),
    whatsapp        varchar(20),
    email           varchar(255),
    zip_code        varchar(10),
    street          varchar(300),
    number          varchar(20),
    neighborhood    varchar(200),
    city            varchar(200),
    state           varchar(2),
    english_level   varchar(50),
    enrollment_date date,
    status          varchar(20)  not null default 'active',
    notes           text,
    unit            varchar(100) not null default 'Matriz',
    monthly_fee     numeric(10,2),
    due_day         integer,
    created_at      timestamptz  not null default now(),
    updated_at      timestamptz
);
create index if not exists ix_students_full_name on public.students (full_name);
create index if not exists ix_students_cpf on public.students (cpf);

-- ---------------------------------------------------------------------------
-- Tabela: responsibles
-- ---------------------------------------------------------------------------
create table if not exists public.responsibles (
    id          serial primary key,
    student_id  integer not null unique references public.students (id) on delete cascade,
    full_name   varchar(300) not null,
    cpf         varchar(14),
    phone       varchar(20),
    email       varchar(255),
    parentesco  varchar(50),
    created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tabela: courses
-- ---------------------------------------------------------------------------
create table if not exists public.courses (
    id              serial primary key,
    name            varchar(200) not null,
    level           varchar(100) not null,
    description     varchar(500),
    duration_hours  integer not null default 0,
    price           integer not null default 0,
    created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tabela: teachers
-- ---------------------------------------------------------------------------
create table if not exists public.teachers (
    id              serial primary key,
    photo_url       varchar(500),
    full_name       varchar(300) not null,
    cpf             varchar(14) unique,
    phone           varchar(20),
    whatsapp        varchar(20),
    email           varchar(255),
    specialization  varchar(200),
    hourly_rate     integer not null default 0,
    is_active       boolean not null default true,
    notes           text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz
);
create index if not exists ix_teachers_full_name on public.teachers (full_name);

-- ---------------------------------------------------------------------------
-- Tabela: class_groups
-- ---------------------------------------------------------------------------
create table if not exists public.class_groups (
    id             serial primary key,
    name           varchar(200) not null,
    course_id      integer not null references public.courses (id),
    teacher_id     integer not null references public.teachers (id),
    room           varchar(100),
    weekdays       text not null,
    start_time     time not null,
    end_time       time not null,
    max_capacity   integer not null default 20,
    current_count  integer not null default 0,
    level          varchar(100),
    unit           varchar(100) not null default 'Matriz',
    is_active      boolean not null default true,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz
);
create index if not exists ix_class_groups_course_id on public.class_groups (course_id);
create index if not exists ix_class_groups_teacher_id on public.class_groups (teacher_id);

-- ---------------------------------------------------------------------------
-- Tabela: enrollments
-- ---------------------------------------------------------------------------
create table if not exists public.enrollments (
    id              serial primary key,
    student_id      integer not null references public.students (id) on delete cascade,
    class_group_id  integer not null references public.class_groups (id) on delete cascade,
    enrollment_date date not null,
    status          varchar(20) not null default 'active',
    notes           text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz
);
create index if not exists ix_enrollments_student_id on public.enrollments (student_id);
create index if not exists ix_enrollments_class_group_id on public.enrollments (class_group_id);

-- ---------------------------------------------------------------------------
-- Tabela: financial_plans
-- ---------------------------------------------------------------------------
create table if not exists public.financial_plans (
    id                    serial primary key,
    name                  varchar(200) not null,
    value                 numeric(10,2) not null,
    description           text,
    installments          integer not null default 1,
    is_active             integer not null default 1,
    course_id             integer references public.courses (id) on delete set null,
    duration_months       integer not null default 1,
    discount_type         varchar(20) not null default 'percent',
    discount_value        numeric(10,2) not null default 0,
    upfront_discount_pct  numeric(10,2) not null default 0,
    created_at            timestamptz not null default now()
);
create index if not exists ix_financial_plans_course_id on public.financial_plans (course_id);

-- ---------------------------------------------------------------------------
-- Tabela: financial_contracts
-- ---------------------------------------------------------------------------
create table if not exists public.financial_contracts (
    id                      serial primary key,
    student_id              integer not null references public.students (id) on delete cascade,
    plan_id                 integer not null references public.financial_plans (id),
    start_date              date not null,
    end_date                date not null,
    mode                    varchar(20) not null default 'installments',
    installments_count      integer not null default 1,
    monthly_value           numeric(10,2) not null default 0,
    gross_total             numeric(10,2) not null default 0,
    discount_type           varchar(20) not null default 'percent',
    discount_value          numeric(10,2) not null default 0,
    discount_amount         numeric(10,2) not null default 0,
    final_value             numeric(10,2) not null default 0,
    upfront_discount_amount numeric(10,2) not null default 0,
    total_due               numeric(10,2) not null default 0,
    guardian_name           varchar(200),
    guardian_cpf            varchar(20),
    guardian_phone          varchar(50),
    guardian_email          varchar(255),
    notes                   text,
    status                  varchar(20) not null default 'pending',
    signed_at               timestamptz,
    created_at              timestamptz not null default now()
);
create index if not exists ix_financial_contracts_student_id on public.financial_contracts (student_id);
create index if not exists ix_financial_contracts_plan_id on public.financial_contracts (plan_id);

-- ---------------------------------------------------------------------------
-- Tabela: carnets
-- ---------------------------------------------------------------------------
create table if not exists public.carnets (
    id                 serial primary key,
    student_id         integer not null references public.students (id) on delete cascade,
    enrollment_id      integer references public.enrollments (id) on delete set null,
    charge_type        varchar(50) not null default 'mensalidade',
    description        varchar(300),
    total_installments integer not null,
    installment_value  numeric(10,2) not null,
    discount           numeric(10,2) not null default 0,
    late_fee_pct       numeric(10,2) not null default 2.0,
    interest_daily_pct numeric(10,2) not null default 0.033,
    first_due_date     date not null,
    interval           varchar(20) not null default 'monthly',
    payment_methods    varchar(300),
    status             varchar(20) not null default 'active',
    notes              text,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz
);
create index if not exists ix_carnets_student_id on public.carnets (student_id);
create index if not exists ix_carnets_enrollment_id on public.carnets (enrollment_id);

-- ---------------------------------------------------------------------------
-- Tabela: installments
-- ---------------------------------------------------------------------------
create table if not exists public.installments (
    id                  serial primary key,
    student_id          integer not null references public.students (id) on delete cascade,
    carnet_id           integer references public.carnets (id) on delete set null,
    plan_id             integer references public.financial_plans (id) on delete set null,
    contract_id         integer references public.financial_contracts (id) on delete set null,
    installment_number  integer,
    description         varchar(300) not null,
    amount              numeric(10,2) not null,
    discount            numeric(10,2) not null default 0,
    late_fee            numeric(10,2) not null default 0,
    interest            numeric(10,2) not null default 0,
    total_paid          numeric(10,2) not null default 0,
    due_date            date not null,
    paid_date           date,
    status              varchar(20) not null default 'pending',
    payment_method      varchar(50),
    invoice_url         varchar(500),
    notes               text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz
);
create index if not exists ix_installments_student_due on public.installments (student_id, due_date);
create index if not exists ix_installments_status_due on public.installments (status, due_date);
create index if not exists ix_installments_carnet_id on public.installments (carnet_id);

-- ---------------------------------------------------------------------------
-- Tabela: discounts
-- ---------------------------------------------------------------------------
create table if not exists public.discounts (
    id          serial primary key,
    student_id  integer not null references public.students (id) on delete cascade,
    name        varchar(200) not null,
    percentage  numeric(10,2) not null default 0,
    amount      numeric(10,2) not null default 0,
    reason      text,
    valid_until date,
    created_at  timestamptz not null default now()
);
create index if not exists ix_discounts_student_id on public.discounts (student_id);

-- ---------------------------------------------------------------------------
-- Tabela: payments
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
    id              serial primary key,
    installment_id  integer not null references public.installments (id) on delete cascade,
    amount          numeric(10,2) not null,
    payment_date    date not null,
    payment_method  varchar(50),
    receipt_number  varchar(100),
    notes           text,
    created_at      timestamptz not null default now()
);
create index if not exists ix_payments_installment on public.payments (installment_id);

-- ---------------------------------------------------------------------------
-- Tabela: attendances
-- ---------------------------------------------------------------------------
create table if not exists public.attendances (
    id              serial primary key,
    student_id      integer not null references public.students (id) on delete cascade,
    class_group_id  integer not null references public.class_groups (id) on delete cascade,
    date            date not null,
    status          varchar(20) not null,
    notes           text,
    created_at      timestamptz not null default now()
);
create index if not exists ix_attendances_student_class_date on public.attendances (student_id, class_group_id, date);

-- ---------------------------------------------------------------------------
-- Tabela: evaluations
-- ---------------------------------------------------------------------------
create table if not exists public.evaluations (
    id              serial primary key,
    student_id      integer not null references public.students (id) on delete cascade,
    class_group_id  integer not null references public.class_groups (id) on delete cascade,
    eval_type       varchar(20) not null,
    title           varchar(300) not null,
    date            date not null,
    score           double precision not null default 0,
    max_score       double precision not null default 10,
    weight          double precision not null default 1.0,
    notes           text,
    created_at      timestamptz not null default now()
);
create index if not exists ix_evaluations_student_id on public.evaluations (student_id);
create index if not exists ix_evaluations_class_group_id on public.evaluations (class_group_id);

-- ---------------------------------------------------------------------------
-- Tabela: grade_weight_configs
-- ---------------------------------------------------------------------------
create table if not exists public.grade_weight_configs (
    id              serial primary key,
    class_group_id  integer not null references public.class_groups (id) on delete cascade,
    label           varchar(100) not null,
    eval_type       varchar(50) not null,
    weight          double precision not null default 1.0,
    max_score       double precision not null default 10.0,
    created_at      timestamptz not null default now(),
    constraint uq_class_eval_type unique (class_group_id, eval_type)
);
create index if not exists ix_grade_weight_configs_class_group_id on public.grade_weight_configs (class_group_id);

-- ---------------------------------------------------------------------------
-- Tabela: certificates
-- ---------------------------------------------------------------------------
create table if not exists public.certificates (
    id              serial primary key,
    student_id      integer not null references public.students (id) on delete cascade,
    class_group_id  integer not null references public.class_groups (id) on delete cascade,
    level           varchar(100) not null,
    course_name     varchar(300),
    teacher_name    varchar(300),
    media           double precision not null default 0,
    frequency       double precision not null default 0,
    workload_hours  integer not null default 0,
    control_number  varchar(50) unique,
    issue_date      date not null,
    created_at      timestamptz not null default now()
);
create index if not exists ix_certificates_control_number on public.certificates (control_number);
create index if not exists ix_certificates_student_id on public.certificates (student_id);

-- ---------------------------------------------------------------------------
-- Tabela: teaching_materials
-- ---------------------------------------------------------------------------
create table if not exists public.teaching_materials (
    id          serial primary key,
    name        varchar(200) not null,
    description text,
    price       numeric(10,2) not null default 0,
    stock       integer not null default 0,
    category    varchar(100) not null default '',
    is_active   integer not null default 1,
    created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tabela: material_sales
-- ---------------------------------------------------------------------------
create table if not exists public.material_sales (
    id              serial primary key,
    material_id     integer not null references public.teaching_materials (id) on delete cascade,
    student_id      integer not null references public.students (id) on delete cascade,
    quantity        integer not null default 1,
    unit_price      numeric(10,2) not null,
    total_price     numeric(10,2) not null,
    payment_method  varchar(50) not null default '',
    notes           text not null default '',
    created_at      timestamptz not null default now()
);
create index if not exists ix_material_sales_material_id on public.material_sales (material_id);
create index if not exists ix_material_sales_student_id on public.material_sales (student_id);

-- ---------------------------------------------------------------------------
-- Tabela: school_settings
-- ---------------------------------------------------------------------------
create table if not exists public.school_settings (
    id               serial primary key,
    school_name      varchar(300) not null default 'Gestão Escolar',
    logo_url         varchar(500),
    address          varchar(500),
    phone            varchar(50),
    email            varchar(255),
    cnpj             varchar(20),
    pix_key          varchar(200),
    slogan           varchar(300),
    social_media     varchar(200),
    payment_methods  varchar(200) not null default 'PIX,Dinheiro,Débito,Crédito',
    primary_color    varchar(20) not null default '#3B82F6',
    dark_mode        integer not null default 0,
    due_day          integer not null default 5,
    extra_settings   text not null default '{}',
    created_at       timestamptz not null default now(),
    updated_at       timestamptz
);

-- ---------------------------------------------------------------------------
-- Tabela: calendar_events
-- ---------------------------------------------------------------------------
create table if not exists public.calendar_events (
    id          serial primary key,
    title       varchar(300) not null,
    event_type  varchar(20) not null,
    date        date not null,
    start_time  time,
    end_time    time,
    description text,
    color       varchar(20) not null default '#3B82F6',
    created_at  timestamptz not null default now()
);
create index if not exists ix_calendar_events_date on public.calendar_events (date);

-- ---------------------------------------------------------------------------
-- Tabela: communication_logs
-- ---------------------------------------------------------------------------
create table if not exists public.communication_logs (
    id             serial primary key,
    channel        varchar(20) not null,
    recipient      varchar(300) not null,
    subject        varchar(300),
    message        text not null,
    sent_by        integer references public.users (id) on delete set null,
    status         varchar(20) not null default 'sent',
    error_message  text,
    created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tabela: audit_logs
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
    id          serial primary key,
    user_id     integer references public.users (id) on delete set null,
    action      varchar(100) not null,
    entity      varchar(100),
    entity_id   integer,
    details     text,
    ip_address  varchar(50),
    created_at  timestamptz not null default now()
);
create index if not exists ix_audit_logs_user_id on public.audit_logs (user_id);
create index if not exists ix_audit_logs_entity on public.audit_logs (entity, entity_id);

-- ---------------------------------------------------------------------------
-- Tabela: file_uploads
-- ---------------------------------------------------------------------------
create table if not exists public.file_uploads (
    id          serial primary key,
    student_id  integer not null references public.students (id) on delete cascade,
    file_name   varchar(300) not null,
    file_type   varchar(50),
    file_path   varchar(500) not null,
    file_size   integer not null default 0,
    category    varchar(100),
    created_at  timestamptz not null default now()
);
create index if not exists ix_file_uploads_student_id on public.file_uploads (student_id);

-- ============================================================================
-- Seed determinístico: settings iniciais (apenas se a tabela estiver vazia)
-- ============================================================================
insert into public.school_settings (school_name)
select 'Gestão Escolar'
where not exists (select 1 from public.school_settings);