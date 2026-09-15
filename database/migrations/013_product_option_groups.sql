-- ============================================================
-- 013: Vínculo entre produtos e grupos de opções
-- ============================================================
-- Tabela pivot que associa um produto a um ou mais option_groups,
-- definindo a composição personalizável de cada produto.
-- Genérico para qualquer segmento (açaí, pizzas, hambúrgueres, etc.)
--
-- Depende de:
--   - public.products       (migration 001 / 009)
--   - public.option_groups  (migration 011)
--   - public.get_my_organization_id()  (migration 009)
--   - public.has_role(text[])            (migration 009)
-- ============================================================

-- ============================================================
-- 1. TABELA: product_option_groups
-- ============================================================

create table if not exists public.product_option_groups (
    id uuid primary key default gen_random_uuid(),

    product_id uuid not null
        references public.products(id) on delete cascade,

    group_id uuid not null
        references public.option_groups(id) on delete cascade,

    sort_order integer not null default 0,

    created_at timestamptz not null default now(),

    constraint product_option_groups_product_group_unique
        unique (product_id, group_id)
);

comment on table public.product_option_groups is
    'Associação entre produtos e grupos de opções para composição personalizável.';

comment on column public.product_option_groups.id is
    'Identificador único do vínculo produto-grupo.';

comment on column public.product_option_groups.product_id is
    'Produto que utiliza este grupo de opções.';

comment on column public.product_option_groups.group_id is
    'Grupo de opções vinculado ao produto.';

comment on column public.product_option_groups.sort_order is
    'Ordem de exibição do grupo na composição deste produto.';

comment on column public.product_option_groups.created_at is
    'Data/hora de criação do vínculo.';

-- ============================================================
-- 2. ÍNDICES
-- ============================================================

create index if not exists idx_product_option_groups_product_id
    on public.product_option_groups(product_id);

create index if not exists idx_product_option_groups_group_id
    on public.product_option_groups(group_id);

create index if not exists idx_product_option_groups_sort_order
    on public.product_option_groups(product_id, sort_order);

-- ============================================================
-- 3. TRIGGERS
-- ============================================================

-- 3.1 Valida que produto e grupo pertencem à mesma organização
create or replace function public.validate_product_option_group_organization()
returns trigger
language plpgsql
as $$
declare
    v_product_org uuid;
    v_group_org uuid;
begin
    select organization_id
    into v_product_org
    from public.products
    where id = new.product_id;

    select organization_id
    into v_group_org
    from public.option_groups
    where id = new.group_id;

    if v_product_org is null or v_group_org is null then
        raise exception 'Produto ou grupo de opções inválido';
    end if;

    if v_product_org <> v_group_org then
        raise exception 'Produto e grupo devem pertencer à mesma organização';
    end if;

    return new;
end;
$$;

comment on function public.validate_product_option_group_organization() is
    'Garante que produto e grupo de opções pertencem à mesma organização.';

drop trigger if exists product_option_groups_validate_org on public.product_option_groups;

create trigger product_option_groups_validate_org
    before insert or update of product_id, group_id
    on public.product_option_groups
    for each row
    execute function public.validate_product_option_group_organization();

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.product_option_groups enable row level security;

-- 4.1 SELECT — usuários autenticados da mesma organização do produto e do grupo
drop policy if exists product_option_groups_select on public.product_option_groups;

create policy product_option_groups_select on public.product_option_groups
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.products p
            where p.id = product_option_groups.product_id
              and p.organization_id = public.get_my_organization_id()
        )
        and exists (
            select 1
            from public.option_groups og
            where og.id = product_option_groups.group_id
              and og.organization_id = public.get_my_organization_id()
        )
    );

-- 4.2 INSERT — admin e manager; produto e grupo da mesma organização
drop policy if exists product_option_groups_insert on public.product_option_groups;

create policy product_option_groups_insert on public.product_option_groups
    for insert
    to authenticated
    with check (
        public.has_role(array['admin', 'manager'])
        and exists (
            select 1
            from public.products p
            where p.id = product_option_groups.product_id
              and p.organization_id = public.get_my_organization_id()
        )
        and exists (
            select 1
            from public.option_groups og
            where og.id = product_option_groups.group_id
              and og.organization_id = public.get_my_organization_id()
        )
    );

-- 4.3 UPDATE — admin e manager; produto e grupo da mesma organização
drop policy if exists product_option_groups_update on public.product_option_groups;

create policy product_option_groups_update on public.product_option_groups
    for update
    to authenticated
    using (
        public.has_role(array['admin', 'manager'])
        and exists (
            select 1
            from public.products p
            where p.id = product_option_groups.product_id
              and p.organization_id = public.get_my_organization_id()
        )
    )
    with check (
        exists (
            select 1
            from public.products p
            where p.id = product_option_groups.product_id
              and p.organization_id = public.get_my_organization_id()
        )
        and exists (
            select 1
            from public.option_groups og
            where og.id = product_option_groups.group_id
              and og.organization_id = public.get_my_organization_id()
        )
    );

-- 4.4 DELETE — admin e manager; produto da mesma organização
drop policy if exists product_option_groups_delete on public.product_option_groups;

create policy product_option_groups_delete on public.product_option_groups
    for delete
    to authenticated
    using (
        public.has_role(array['admin', 'manager'])
        and exists (
            select 1
            from public.products p
            where p.id = product_option_groups.product_id
              and p.organization_id = public.get_my_organization_id()
        )
    );
