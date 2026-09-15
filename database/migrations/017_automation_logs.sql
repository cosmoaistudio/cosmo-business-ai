-- ============================================================
-- 017: Logs de execução de automações
-- ============================================================
-- Registra tempo, resultado, erro e payload de cada execução.
--
-- Depende de:
--   - public.automation_rules (migration 016)
--   - public.set_row_organization_id()  (migration 009)
-- ============================================================

create table if not exists public.automation_logs (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    rule_id uuid
        references public.automation_rules(id) on delete set null,

    status text not null default 'success'
        constraint automation_logs_status_check
        check (status in ('success', 'failed', 'skipped')),

    started_at timestamptz not null default now(),

    finished_at timestamptz,

    execution_time integer
        constraint automation_logs_execution_time_check
        check (execution_time is null or execution_time >= 0),

    payload jsonb not null default '{}'::jsonb,

    error_message text,

    created_at timestamptz not null default now()
);

comment on table public.automation_logs is
    'Histórico de execuções do Cosmo Automation Engine.';

comment on column public.automation_logs.execution_time is
    'Tempo de execução em milissegundos.';

comment on column public.automation_logs.payload is
    'Evento recebido, ações executadas e metadados da execução.';

-- ============================================================
-- ÍNDICES
-- ============================================================

create index if not exists idx_automation_logs_organization_id
    on public.automation_logs(organization_id);

create index if not exists idx_automation_logs_rule_id
    on public.automation_logs(rule_id);

create index if not exists idx_automation_logs_created_at
    on public.automation_logs(organization_id, created_at desc);

create index if not exists idx_automation_logs_status
    on public.automation_logs(organization_id, status);

-- ============================================================
-- TRIGGERS
-- ============================================================

drop trigger if exists automation_logs_set_org on public.automation_logs;

create trigger automation_logs_set_org
    before insert on public.automation_logs
    for each row
    execute function public.set_row_organization_id();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.automation_logs enable row level security;

drop policy if exists automation_logs_select on public.automation_logs;

create policy automation_logs_select on public.automation_logs
    for select
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
    );

drop policy if exists automation_logs_insert on public.automation_logs;

create policy automation_logs_insert on public.automation_logs
    for insert
    to authenticated
    with check (
        organization_id = public.get_my_organization_id()
    );

-- Logs são imutáveis — sem UPDATE/DELETE para usuários autenticados
