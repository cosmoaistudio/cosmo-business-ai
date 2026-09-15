-- ============================================================
-- 011: Grupos de opções para composição universal de produtos
-- ============================================================
-- Tabela genérica utilizada por qualquer produto personalizável
-- (açaí, sorvetes, pizzas, hambúrgueres, marmitas, restaurantes, etc.)
--
-- Depende de:
--   - public.organizations
--   - public.set_row_organization_id()  (migration 009)
--   - public.get_my_organization_id()   (migration 009)
--   - public.has_role(text[])             (migration 009)
-- ============================================================

-- ============================================================
-- 1. TABELA: option_groups
-- ============================================================

create table if not exists public.option_groups (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    name text not null,

    description text,

    selection_type text not null default 'checkbox'
        constraint option_groups_selection_type_check
        check (selection_type in ('checkbox', 'radio')),

    min_selection integer not null default 0
        constraint option_groups_min_selection_check
        check (min_selection >= 0),

    max_selection integer not null default 1
        constraint option_groups_max_selection_check
        check (max_selection >= 0),

    required boolean not null default false,

    sort_order integer not null default 0,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint option_groups_selection_range_check
        check (max_selection >= min_selection)
);

comment on table public.option_groups is
    'Grupos de opções reutilizáveis para composição de produtos personalizáveis.';

comment on column public.option_groups.id is
    'Identificador único do grupo de opções.';

comment on column public.option_groups.organization_id is
    'Organização proprietária do grupo (multi-tenant).';

comment on column public.option_groups.name is
    'Nome exibido do grupo (ex.: Tamanho, Adicionais, Borda).';

comment on column public.option_groups.description is
    'Descrição opcional do grupo de opções.';

comment on column public.option_groups.selection_type is
    'Tipo de seleção permitida: checkbox (múltipla) ou radio (única).';

comment on column public.option_groups.min_selection is
    'Quantidade mínima de opções que o cliente deve escolher neste grupo.';

comment on column public.option_groups.max_selection is
    'Quantidade máxima de opções que o cliente pode escolher neste grupo.';

comment on column public.option_groups.required is
    'Indica se a escolha neste grupo é obrigatória.';

comment on column public.option_groups.sort_order is
    'Ordem de exibição do grupo na composição do produto.';

comment on column public.option_groups.created_at is
    'Data/hora de criação do registro.';

comment on column public.option_groups.updated_at is
    'Data/hora da última atualização do registro.';

-- ============================================================
-- 2. ÍNDICES
-- ============================================================

create index if not exists idx_option_groups_organization_id
    on public.option_groups(organization_id);

create index if not exists idx_option_groups_sort_order
    on public.option_groups(organization_id, sort_order);

create index if not exists idx_option_groups_name
    on public.option_groups(organization_id, name);

-- ============================================================
-- 3. TRIGGERS
-- ============================================================

-- 3.1 organization_id automático e validação de tenant no INSERT
drop trigger if exists option_groups_set_org on public.option_groups;

create trigger option_groups_set_org
    before insert on public.option_groups
    for each row
    execute function public.set_row_organization_id();

-- 3.2 updated_at automático no UPDATE
create or replace function public.set_option_groups_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

comment on function public.set_option_groups_updated_at() is
    'Atualiza automaticamente updated_at em public.option_groups.';

drop trigger if exists option_groups_updated_at on public.option_groups;

create trigger option_groups_updated_at
    before update on public.option_groups
    for each row
    execute function public.set_option_groups_updated_at();

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.option_groups enable row level security;

-- 4.1 SELECT — qualquer usuário autenticado da mesma organização
drop policy if exists option_groups_select on public.option_groups;

create policy option_groups_select on public.option_groups
    for select
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
    );

-- 4.2 INSERT — admin e manager da mesma organização
drop policy if exists option_groups_insert on public.option_groups;

create policy option_groups_insert on public.option_groups
    for insert
    to authenticated
    with check (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

-- 4.3 UPDATE — admin e manager da mesma organização
drop policy if exists option_groups_update on public.option_groups;

create policy option_groups_update on public.option_groups
    for update
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    )
    with check (
        organization_id = public.get_my_organization_id()
    );

-- 4.4 DELETE — admin e manager da mesma organização
drop policy if exists option_groups_delete on public.option_groups;

create policy option_groups_delete on public.option_groups
    for delete
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );
