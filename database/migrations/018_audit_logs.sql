-- ============================================================
-- 018: Logs de auditoria (Audit Engine)
-- ============================================================
-- Registra automaticamente: quem, quando, IP, antes/depois, tabela, registro.
--
-- Depende de:
--   - public.organizations
--   - public.set_row_organization_id()  (migration 009)
-- ============================================================

create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    user_id uuid references auth.users(id) on delete set null,

    user_email text,

    action text not null,

    table_name text not null,

    record_id text,

    before_data jsonb,

    after_data jsonb,

    ip_address text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);

comment on table public.audit_logs is
    'Trilha de auditoria do Cosmo — Audit Engine.';

comment on column public.audit_logs.before_data is
    'Estado anterior do registro (JSON).';

comment on column public.audit_logs.after_data is
    'Estado posterior do registro (JSON).';

-- ============================================================
-- ÍNDICES
-- ============================================================

create index if not exists idx_audit_logs_organization_id
    on public.audit_logs(organization_id);

create index if not exists idx_audit_logs_table_record
    on public.audit_logs(organization_id, table_name, record_id);

create index if not exists idx_audit_logs_created_at
    on public.audit_logs(organization_id, created_at desc);

create index if not exists idx_audit_logs_user_id
    on public.audit_logs(user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

drop trigger if exists audit_logs_set_org on public.audit_logs;

create trigger audit_logs_set_org
    before insert on public.audit_logs
    for each row
    execute function public.set_row_organization_id();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_select on public.audit_logs;

create policy audit_logs_select on public.audit_logs
    for select
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

drop policy if exists audit_logs_insert on public.audit_logs;

create policy audit_logs_insert on public.audit_logs
    for insert
    to authenticated
    with check (
        organization_id = public.get_my_organization_id()
    );

-- Logs de auditoria são imutáveis — sem UPDATE/DELETE
