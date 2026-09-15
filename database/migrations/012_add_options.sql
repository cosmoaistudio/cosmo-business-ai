-- ============================================================
-- 012: Opções individuais dentro de grupos de composição
-- ============================================================
-- Itens selecionáveis vinculados a um option_group.
-- Genérico para qualquer produto personalizável.
--
-- Depende de:
--   - public.organizations          (migration 009)
--   - public.option_groups          (migration 011)
--   - public.set_row_organization_id()  (migration 009)
--   - public.get_my_organization_id()   (migration 009)
--   - public.has_role(text[])             (migration 009)
-- ============================================================

-- ============================================================
-- 1. TABELA: options
-- ============================================================

create table if not exists public.options (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    group_id uuid not null
        references public.option_groups(id) on delete cascade,

    name text not null,

    description text,

    price numeric(10, 2) not null default 0
        constraint options_price_check
        check (price >= 0),

    stock_control boolean not null default false,

    stock integer not null default 0
        constraint options_stock_check
        check (stock >= 0),

    image_url text,

    active boolean not null default true,

    sort_order integer not null default 0,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);

comment on table public.options is
    'Opções individuais pertencentes a um grupo de composição de produto.';

comment on column public.options.id is
    'Identificador único da opção.';

comment on column public.options.organization_id is
    'Organização proprietária da opção (multi-tenant).';

comment on column public.options.group_id is
    'Grupo de opções ao qual esta opção pertence.';

comment on column public.options.name is
    'Nome exibido da opção (ex.: Grande, Bacon, Morango).';

comment on column public.options.description is
    'Descrição opcional da opção.';

comment on column public.options.price is
    'Valor adicional cobrado ao selecionar esta opção.';

comment on column public.options.stock_control is
    'Indica se esta opção possui controle de estoque próprio.';

comment on column public.options.stock is
    'Quantidade em estoque quando stock_control está ativo.';

comment on column public.options.image_url is
    'URL pública da imagem da opção no Supabase Storage.';

comment on column public.options.active is
    'Indica se a opção está disponível para seleção.';

comment on column public.options.sort_order is
    'Ordem de exibição da opção dentro do grupo.';

comment on column public.options.created_at is
    'Data/hora de criação do registro.';

comment on column public.options.updated_at is
    'Data/hora da última atualização do registro.';

-- ============================================================
-- 2. ÍNDICES
-- ============================================================

create index if not exists idx_options_organization_id
    on public.options(organization_id);

create index if not exists idx_options_group_id
    on public.options(group_id);

create index if not exists idx_options_group_sort_order
    on public.options(group_id, sort_order);

create index if not exists idx_options_group_active
    on public.options(group_id, active);

create index if not exists idx_options_name
    on public.options(organization_id, name);

-- ============================================================
-- 3. TRIGGERS
-- ============================================================

-- 3.1 organization_id automático e validação de tenant no INSERT
drop trigger if exists options_set_org on public.options;

create trigger options_set_org
    before insert on public.options
    for each row
    execute function public.set_row_organization_id();

-- 3.2 Sincroniza organization_id com o grupo pai
create or replace function public.validate_option_group_organization()
returns trigger
language plpgsql
as $$
declare
    v_group_org uuid;
begin
    select organization_id
    into v_group_org
    from public.option_groups
    where id = new.group_id;

    if v_group_org is null then
        raise exception 'Grupo de opções inválido';
    end if;

    if new.organization_id is not null
       and new.organization_id <> v_group_org then
        raise exception 'Opção e grupo devem pertencer à mesma organização';
    end if;

    new.organization_id := v_group_org;

    return new;
end;
$$;

comment on function public.validate_option_group_organization() is
    'Garante que public.options.organization_id coincide com public.option_groups.organization_id.';

drop trigger if exists options_validate_group_org on public.options;

create trigger options_validate_group_org
    before insert or update of group_id, organization_id
    on public.options
    for each row
    execute function public.validate_option_group_organization();

-- 3.3 updated_at automático no UPDATE
create or replace function public.set_options_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

comment on function public.set_options_updated_at() is
    'Atualiza automaticamente updated_at em public.options.';

drop trigger if exists options_updated_at on public.options;

create trigger options_updated_at
    before update on public.options
    for each row
    execute function public.set_options_updated_at();

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.options enable row level security;

-- 4.1 SELECT — qualquer usuário autenticado da mesma organização
drop policy if exists options_select on public.options;

create policy options_select on public.options
    for select
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
    );

-- 4.2 INSERT — admin e manager da mesma organização
drop policy if exists options_insert on public.options;

create policy options_insert on public.options
    for insert
    to authenticated
    with check (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

-- 4.3 UPDATE — admin e manager da mesma organização
drop policy if exists options_update on public.options;

create policy options_update on public.options
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
drop policy if exists options_delete on public.options;

create policy options_delete on public.options
    for delete
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );
