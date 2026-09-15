-- ============================================================
-- 019: Feature flags por organização (Feature Flag Engine)
-- ============================================================
-- Permite habilitar/desabilitar módulos por empresa.
--
-- Depende de:
--   - public.organizations
--   - public.set_row_organization_id()  (migration 009)
-- ============================================================

create table if not exists public.organization_feature_flags (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    module_key text not null
        constraint organization_feature_flags_module_key_check
        check (module_key in (
            'orders',
            'delivery',
            'crm',
            'finance',
            'pdv',
            'ai',
            'loyalty',
            'marketplace',
            'automations',
            'inventory',
            'products'
        )),

    enabled boolean not null default true,

    config jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint organization_feature_flags_org_module_unique
        unique (organization_id, module_key)
);

comment on table public.organization_feature_flags is
    'Feature flags por organização — Feature Flag Engine.';

comment on column public.organization_feature_flags.module_key is
    'Identificador do módulo (orders, delivery, crm, finance, pdv, ai, etc.).';

comment on column public.organization_feature_flags.config is
    'Configuração adicional do módulo (JSON).';

-- ============================================================
-- ÍNDICES
-- ============================================================

create index if not exists idx_org_feature_flags_organization_id
    on public.organization_feature_flags(organization_id);

create index if not exists idx_org_feature_flags_module
    on public.organization_feature_flags(organization_id, module_key);

-- ============================================================
-- TRIGGERS
-- ============================================================

drop trigger if exists org_feature_flags_set_org on public.organization_feature_flags;

create trigger org_feature_flags_set_org
    before insert on public.organization_feature_flags
    for each row
    execute function public.set_row_organization_id();

create or replace function public.set_org_feature_flags_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists org_feature_flags_updated_at on public.organization_feature_flags;

create trigger org_feature_flags_updated_at
    before update on public.organization_feature_flags
    for each row
    execute function public.set_org_feature_flags_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.organization_feature_flags enable row level security;

drop policy if exists org_feature_flags_select on public.organization_feature_flags;

create policy org_feature_flags_select on public.organization_feature_flags
    for select
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
    );

drop policy if exists org_feature_flags_insert on public.organization_feature_flags;

create policy org_feature_flags_insert on public.organization_feature_flags
    for insert
    to authenticated
    with check (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin'])
    );

drop policy if exists org_feature_flags_update on public.organization_feature_flags;

create policy org_feature_flags_update on public.organization_feature_flags
    for update
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin'])
    )
    with check (
        organization_id = public.get_my_organization_id()
    );

drop policy if exists org_feature_flags_delete on public.organization_feature_flags;

create policy org_feature_flags_delete on public.organization_feature_flags
    for delete
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin'])
    );
