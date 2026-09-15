-- ============================================================
-- 016: Regras de automação (Cosmo Automation Engine)
-- ============================================================
-- Motor central de automações multi-tenant.
--
-- Depende de:
--   - public.organizations
--   - public.set_row_organization_id()  (migration 009)
--   - public.get_my_organization_id()   (migration 009)
--   - public.has_role(text[])             (migration 009)
-- ============================================================

create table if not exists public.automation_rules (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    name text not null,

    description text,

    module text not null
        constraint automation_rules_module_check
        check (module in (
            'products',
            'inventory',
            'pdv',
            'customers',
            'finance',
            'orders',
            'system'
        )),

    trigger_type text not null,

    conditions jsonb not null default '[]'::jsonb,

    actions jsonb not null default '[]'::jsonb,

    enabled boolean not null default true,

    priority integer not null default 0
        constraint automation_rules_priority_check
        check (priority >= 0),

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);

comment on table public.automation_rules is
    'Regras de automação configuráveis por organização (Cosmo Automation Engine).';

comment on column public.automation_rules.trigger_type is
    'Tipo de evento que dispara a regra (ex.: STOCK_CHANGED, SALE_COMPLETED).';

comment on column public.automation_rules.conditions is
    'Array JSON de condições a validar antes de executar as ações.';

comment on column public.automation_rules.actions is
    'Array JSON de ações a executar quando condições forem satisfeitas.';

comment on column public.automation_rules.priority is
    'Ordem de execução — menor valor = maior prioridade.';

-- ============================================================
-- ÍNDICES
-- ============================================================

create index if not exists idx_automation_rules_organization_id
    on public.automation_rules(organization_id);

create index if not exists idx_automation_rules_trigger_enabled
    on public.automation_rules(organization_id, trigger_type, enabled, priority);

create index if not exists idx_automation_rules_module
    on public.automation_rules(organization_id, module);

-- ============================================================
-- TRIGGERS
-- ============================================================

drop trigger if exists automation_rules_set_org on public.automation_rules;

create trigger automation_rules_set_org
    before insert on public.automation_rules
    for each row
    execute function public.set_row_organization_id();

create or replace function public.set_automation_rules_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists automation_rules_updated_at on public.automation_rules;

create trigger automation_rules_updated_at
    before update on public.automation_rules
    for each row
    execute function public.set_automation_rules_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.automation_rules enable row level security;

drop policy if exists automation_rules_select on public.automation_rules;

create policy automation_rules_select on public.automation_rules
    for select
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
    );

drop policy if exists automation_rules_insert on public.automation_rules;

create policy automation_rules_insert on public.automation_rules
    for insert
    to authenticated
    with check (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

drop policy if exists automation_rules_update on public.automation_rules;

create policy automation_rules_update on public.automation_rules
    for update
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    )
    with check (
        organization_id = public.get_my_organization_id()
    );

drop policy if exists automation_rules_delete on public.automation_rules;

create policy automation_rules_delete on public.automation_rules
    for delete
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );
