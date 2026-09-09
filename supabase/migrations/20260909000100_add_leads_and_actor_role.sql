-- ============================================================================
-- Migração incremental: adiciona tabela leads + coluna audit_logs.actor_role
-- Complementa a migration init (20260830000100) que não incluía estes objetos.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tabela: leads (formulário de contato / landing page)
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
    id          serial primary key,
    name        varchar(200) not null,
    email       varchar(255) not null,
    phone       varchar(50),
    message     text not null,
    source      varchar(50) not null default 'landing',
    status      varchar(20) not null default 'new',
    created_at  timestamptz not null default now()
);
create index if not exists ix_leads_email on public.leads (email);
create index if not exists ix_leads_status on public.leads (status);
create index if not exists ix_leads_created_at on public.leads (created_at);

-- ---------------------------------------------------------------------------
-- Coluna: audit_logs.actor_role (quem realizou a ação)
-- ---------------------------------------------------------------------------
do $$
begin
    if not exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'audit_logs'
          and column_name = 'actor_role'
    ) then
        alter table public.audit_logs add column actor_role varchar(30);
    end if;
end $$;
