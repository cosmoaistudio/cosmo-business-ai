-- =============================================================================
-- Migration 021: Product Engine Enterprise — Schema Definitivo
-- =============================================================================
-- Cosmo Business AI
--
-- Propósito:
--   Finalizar o schema enterprise do Product Engine sobre as tabelas existentes
--   de composição (option_groups, options), sem remover colunas, sem alterar
--   dados de negócio além de backfill seguro de defaults inferidos.
--
-- Compatibilidade:
--   • Migration incremental e idempotente (ADD COLUMN IF NOT EXISTS).
--   • Colunas legadas (selection_type, required, sort_order) permanecem.
--   • image_url em options já existe (012) — ADD IF NOT EXISTS é no-op.
--   • RLS existente (011/012) continua válida; policies reafirmadas abaixo.
--   • PDV, finalize_sale e product-composition permanecem compatíveis.
--
-- Depende de:
--   • public.organizations              (009)
--   • public.products                   (001)
--   • public.option_groups              (011)
--   • public.options                    (012)
--   • public.product_option_groups      (013)
--   • public.get_my_organization_id()   (009)
--   • public.has_role(text[])             (009)
--
-- Novos campos — option_groups:
--   group_type, display_style, max_free, allow_repeat, allow_quantity,
--   hidden, priority, icon, color, is_premium, is_recommended
--
-- Novos campos — options:
--   sku, barcode, weight, cost_price, image_url (if not exists),
--   nutrition, preparation_time, priority, is_featured, is_default,
--   min_quantity, max_quantity
--
-- Funções auxiliares:
--   • infer_option_group_type(boolean, text)
--   • option_group_has_available_options(uuid)
--   • product_engine_can_be_active(uuid)
--   • get_products_by_option_id(uuid)
--   • sync_option_group_engine_defaults()
--   • validate_option_engine_bounds()
--   • enforce_single_default_option_per_group()
--   • apply_option_stock_availability()
--   • sync_products_on_option_availability()
--
-- Triggers:
--   • option_groups_engine_defaults      (BEFORE INSERT OR UPDATE)
--   • options_validate_quantity_bounds   (BEFORE INSERT OR UPDATE)
--   • options_enforce_single_default     (BEFORE INSERT OR UPDATE)
--   • options_apply_stock_availability   (BEFORE UPDATE OF stock, active, stock_control)
--   • options_sync_product_availability  (AFTER UPDATE OF stock, active, stock_control)
--
-- Índices:
--   Parciais e compostos para filtros de cardápio, SKU, barcode e destaque.
--
-- Execução:
--   Aplicar manualmente no Supabase SQL Editor ou pipeline de migrations.
--   NÃO executar automaticamente neste repositório.
-- =============================================================================


-- =============================================================================
-- 1. OPTION_GROUPS — COLUNAS ENTERPRISE
-- =============================================================================

alter table public.option_groups
    add column if not exists group_type text not null default 'optional',
    add column if not exists display_style text not null default 'list',
    add column if not exists max_free integer not null default 0,
    add column if not exists allow_repeat boolean not null default false,
    add column if not exists allow_quantity boolean not null default false,
    add column if not exists hidden boolean not null default false,
    add column if not exists priority integer not null default 0,
    add column if not exists icon text,
    add column if not exists color text,
    add column if not exists is_premium boolean not null default false,
    add column if not exists is_recommended boolean not null default false;

-- CHECK constraints (idempotentes via DO block)
do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'option_groups_group_type_check'
          and conrelid = 'public.option_groups'::regclass
    ) then
        alter table public.option_groups
            add constraint option_groups_group_type_check
            check (group_type in (
                'required',
                'optional',
                'single_choice',
                'multiple_choice',
                'premium',
                'gift',
                'complement',
                'ingredient',
                'sauce',
                'drink'
            ));
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'option_groups_display_style_check'
          and conrelid = 'public.option_groups'::regclass
    ) then
        alter table public.option_groups
            add constraint option_groups_display_style_check
            check (display_style in (
                'list',
                'grid',
                'chips',
                'carousel',
                'cards'
            ));
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'option_groups_max_free_check'
          and conrelid = 'public.option_groups'::regclass
    ) then
        alter table public.option_groups
            add constraint option_groups_max_free_check
            check (max_free >= 0);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'option_groups_max_free_range_check'
          and conrelid = 'public.option_groups'::regclass
    ) then
        alter table public.option_groups
            add constraint option_groups_max_free_range_check
            check (max_free <= max_selection);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'option_groups_priority_check'
          and conrelid = 'public.option_groups'::regclass
    ) then
        alter table public.option_groups
            add constraint option_groups_priority_check
            check (priority >= 0);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'option_groups_color_format_check'
          and conrelid = 'public.option_groups'::regclass
    ) then
        alter table public.option_groups
            add constraint option_groups_color_format_check
            check (
                color is null
                or color ~* '^#([0-9a-f]{3}|[0-9a-f]{6})$'
            );
    end if;
end $$;

comment on column public.option_groups.group_type is
    'Tipo semântico do grupo no Product Engine (required, premium, drink, etc.).';

comment on column public.option_groups.display_style is
    'Estilo de renderização no cardápio/builder: list, grid, chips, carousel, cards.';

comment on column public.option_groups.max_free is
    'Quantidade máxima de seleções gratuitas neste grupo (ex.: brindes).';

comment on column public.option_groups.allow_repeat is
    'Permite selecionar a mesma opção mais de uma vez no grupo.';

comment on column public.option_groups.allow_quantity is
    'Permite informar quantidade por opção selecionada.';

comment on column public.option_groups.hidden is
    'Oculta o grupo na UI do cardápio/builder sem remover da composição.';

comment on column public.option_groups.priority is
    'Prioridade de exibição enterprise (complementa sort_order).';

comment on column public.option_groups.icon is
    'Identificador de ícone (Lucide/custom) para UI do builder.';

comment on column public.option_groups.color is
    'Cor hexadecimal (#RGB ou #RRGGBB) para destaque visual do grupo.';

comment on column public.option_groups.is_premium is
    'Marca o grupo como premium para pricing e UX.';

comment on column public.option_groups.is_recommended is
    'Destaca o grupo como recomendado no cardápio digital.';


-- =============================================================================
-- 2. OPTIONS — COLUNAS ENTERPRISE
-- =============================================================================

alter table public.options
    add column if not exists sku text,
    add column if not exists barcode text,
    add column if not exists weight numeric(10, 3) not null default 0,
    add column if not exists cost_price numeric(10, 2) not null default 0,
    add column if not exists image_url text,
    add column if not exists nutrition jsonb not null default '{}'::jsonb,
    add column if not exists preparation_time integer not null default 0,
    add column if not exists priority integer not null default 0,
    add column if not exists is_featured boolean not null default false,
    add column if not exists is_default boolean not null default false,
    add column if not exists min_quantity integer not null default 1,
    add column if not exists max_quantity integer not null default 99;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'options_weight_check'
          and conrelid = 'public.options'::regclass
    ) then
        alter table public.options
            add constraint options_weight_check
            check (weight >= 0);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'options_cost_price_check'
          and conrelid = 'public.options'::regclass
    ) then
        alter table public.options
            add constraint options_cost_price_check
            check (cost_price >= 0);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'options_preparation_time_check'
          and conrelid = 'public.options'::regclass
    ) then
        alter table public.options
            add constraint options_preparation_time_check
            check (preparation_time >= 0);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'options_priority_check'
          and conrelid = 'public.options'::regclass
    ) then
        alter table public.options
            add constraint options_priority_check
            check (priority >= 0);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'options_min_quantity_check'
          and conrelid = 'public.options'::regclass
    ) then
        alter table public.options
            add constraint options_min_quantity_check
            check (min_quantity >= 1);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'options_max_quantity_check'
          and conrelid = 'public.options'::regclass
    ) then
        alter table public.options
            add constraint options_max_quantity_check
            check (max_quantity >= 1);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'options_quantity_range_check'
          and conrelid = 'public.options'::regclass
    ) then
        alter table public.options
            add constraint options_quantity_range_check
            check (max_quantity >= min_quantity);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'options_sku_format_check'
          and conrelid = 'public.options'::regclass
    ) then
        alter table public.options
            add constraint options_sku_format_check
            check (
                sku is null
                or (
                    char_length(trim(sku)) between 1 and 64
                    and trim(sku) ~ '^[A-Za-z0-9._-]+$'
                )
            );
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'options_barcode_format_check'
          and conrelid = 'public.options'::regclass
    ) then
        alter table public.options
            add constraint options_barcode_format_check
            check (
                barcode is null
                or (
                    char_length(trim(barcode)) between 4 and 128
                    and trim(barcode) ~ '^[0-9A-Za-z-]+$'
                )
            );
    end if;
end $$;

comment on column public.options.sku is
    'SKU interno da opção (único por organização quando informado).';

comment on column public.options.barcode is
    'Código de barras EAN/UPC/custom para integrações e balança.';

comment on column public.options.weight is
    'Peso em gramas para logística, frete e produção.';

comment on column public.options.cost_price is
    'Custo unitário da opção para margem e relatórios financeiros.';

comment on column public.options.nutrition is
    'Informações nutricionais em JSON (calorias, alérgenos, etc.).';

comment on column public.options.preparation_time is
    'Tempo de preparo adicional em minutos causado por esta opção.';

comment on column public.options.priority is
    'Prioridade de exibição enterprise (complementa sort_order).';

comment on column public.options.is_featured is
    'Destaca a opção no cardápio digital e builder.';

comment on column public.options.is_default is
    'Pré-seleciona esta opção no builder (uma por grupo).';

comment on column public.options.min_quantity is
    'Quantidade mínima permitida quando allow_quantity está ativo no grupo.';

comment on column public.options.max_quantity is
    'Quantidade máxima permitida quando allow_quantity está ativo no grupo.';


-- =============================================================================
-- 3. BACKFILL SEGURO (NÃO SOBRESCREVE CUSTOMIZAÇÕES)
-- =============================================================================

-- 3.1 Inferir group_type e flags a partir do schema legado
update public.option_groups
set
    group_type = case
        when required and selection_type = 'radio' then 'single_choice'
        when required then 'required'
        when selection_type = 'radio' then 'single_choice'
        when max_selection > 1 then 'multiple_choice'
        else 'optional'
    end,
    allow_repeat = (
        selection_type = 'checkbox'
        and max_selection > 1
    ),
    priority = sort_order,
    is_premium = (
        name ~* '(premium|especial|gourmet)'
        or group_type = 'premium'
    ),
    is_recommended = (
        required = true
        and selection_type = 'radio'
    )
where group_type = 'optional'
  and display_style = 'list'
  and max_free = 0
  and allow_repeat = false
  and allow_quantity = false
  and hidden = false
  and priority = 0
  and is_premium = false
  and is_recommended = false;

-- 3.2 Ajuste semântico por nome (somente registros ainda no default)
update public.option_groups
set group_type = case
    when name ~* '(bebida|drink|suco|refri)' then 'drink'
    when name ~* '(molho|sauce|cobertura)' then 'sauce'
    when name ~* '(ingrediente|recheio|acompanh)' then 'ingredient'
    when name ~* '(brinde|gift|grátis|gratis)' then 'gift'
    when name ~* '(premium|especial|gourmet)' then 'premium'
    when name ~* '(complemento|adicional|extra)' then 'complement'
    when name ~* '(tamanho|size|porção|porcoes)' then 'single_choice'
    else group_type
end
where group_type in ('optional', 'multiple_choice', 'single_choice');

update public.option_groups
set
    is_premium = (group_type = 'premium'),
    max_free = case when group_type = 'gift' then max_selection else max_free end
where is_premium = false or max_free = 0;

-- 3.3 Options — priority alinhada ao sort_order existente
update public.options
set priority = sort_order
where priority = 0
  and sort_order <> 0;


-- =============================================================================
-- 4. ÍNDICES
-- =============================================================================

-- option_groups
create index if not exists idx_option_groups_group_type
    on public.option_groups(organization_id, group_type);

create index if not exists idx_option_groups_display_priority
    on public.option_groups(organization_id, priority, sort_order);

create index if not exists idx_option_groups_visible
    on public.option_groups(organization_id, sort_order)
    where hidden = false;

create index if not exists idx_option_groups_premium
    on public.option_groups(organization_id)
    where is_premium = true;

create index if not exists idx_option_groups_recommended
    on public.option_groups(organization_id)
    where is_recommended = true;

-- options
create index if not exists idx_options_group_priority
    on public.options(group_id, priority, sort_order);

create index if not exists idx_options_featured
    on public.options(group_id)
    where is_featured = true;

create index if not exists idx_options_default
    on public.options(group_id)
    where is_default = true;

create index if not exists idx_options_barcode
    on public.options(organization_id, barcode)
    where barcode is not null;

create unique index if not exists idx_options_org_sku_unique
    on public.options(organization_id, lower(trim(sku)))
    where sku is not null and trim(sku) <> '';

create index if not exists idx_options_nutrition_gin
    on public.options using gin (nutrition);


-- =============================================================================
-- 5. FUNÇÕES AUXILIARES
-- =============================================================================

-- 5.1 Inferir group_type a partir de flags legadas
create or replace function public.infer_option_group_type(
    p_required boolean,
    p_selection_type text,
    p_max_selection integer default 1
)
returns text
language sql
immutable
as $$
    select case
        when p_required and p_selection_type = 'radio' then 'single_choice'
        when p_required then 'required'
        when p_selection_type = 'radio' then 'single_choice'
        when coalesce(p_max_selection, 1) > 1 then 'multiple_choice'
        else 'optional'
    end;
$$;

comment on function public.infer_option_group_type(boolean, text, integer) is
    'Infere group_type enterprise a partir de required/selection_type/max_selection legados.';


-- 5.2 Verifica se um grupo possui ao menos uma opção disponível
create or replace function public.option_group_has_available_options(p_group_id uuid)
returns boolean
language sql
stable
as $$
    select exists (
        select 1
        from public.options o
        where o.group_id = p_group_id
          and o.active = true
          and (
              not o.stock_control
              or o.stock > 0
          )
    );
$$;

comment on function public.option_group_has_available_options(uuid) is
    'Retorna true se o grupo possui opções ativas com estoque (quando controlado).';


-- 5.3 Verifica se um produto pode permanecer ativo (grupos obrigatórios)
create or replace function public.product_engine_can_be_active(p_product_id uuid)
returns boolean
language plpgsql
stable
as $$
declare
    v_group record;
begin
    for v_group in
        select og.id
        from public.product_option_groups pog
        inner join public.option_groups og on og.id = pog.group_id
        where pog.product_id = p_product_id
          and og.required = true
          and coalesce(og.hidden, false) = false
    loop
        if not public.option_group_has_available_options(v_group.id) then
            return false;
        end if;
    end loop;

    return true;
end;
$$;

comment on function public.product_engine_can_be_active(uuid) is
    'Product Engine: true se todos os grupos obrigatórios visíveis têm opções disponíveis.';


-- 5.4 Produtos afetados por uma opção (grafo de dependência)
create or replace function public.get_products_by_option_id(p_option_id uuid)
returns table (product_id uuid)
language sql
stable
as $$
    select distinct pog.product_id
    from public.options o
    inner join public.product_option_groups pog on pog.group_id = o.group_id
    where o.id = p_option_id;
$$;

comment on function public.get_products_by_option_id(uuid) is
    'Product Engine: lista produtos vinculados ao grupo da opção informada.';


-- 5.5 Defaults enterprise em option_groups
create or replace function public.sync_option_group_engine_defaults()
returns trigger
language plpgsql
as $$
begin
    if new.group_type is null or trim(new.group_type) = '' then
        new.group_type := public.infer_option_group_type(
            new.required,
            new.selection_type,
            new.max_selection
        );
    end if;

    if new.priority = 0 and new.sort_order <> 0 then
        new.priority := new.sort_order;
    end if;

    if new.group_type = 'premium' then
        new.is_premium := true;
    end if;

    if new.group_type = 'gift' and new.max_free = 0 then
        new.max_free := new.max_selection;
    end if;

    if new.selection_type = 'checkbox'
       and new.max_selection > 1
       and new.allow_repeat = false
       and tg_op = 'INSERT' then
        new.allow_repeat := true;
    end if;

    if new.max_free > new.max_selection then
        raise exception 'max_free (%) não pode exceder max_selection (%)',
            new.max_free, new.max_selection;
    end if;

    return new;
end;
$$;

comment on function public.sync_option_group_engine_defaults() is
    'Preenche defaults enterprise em option_groups e valida max_free.';


-- 5.6 Valida limites de quantidade da opção
create or replace function public.validate_option_engine_bounds()
returns trigger
language plpgsql
as $$
declare
    v_group public.option_groups%rowtype;
begin
    select *
    into v_group
    from public.option_groups
    where id = new.group_id;

    if not found then
        raise exception 'Grupo de opções inválido: %', new.group_id;
    end if;

    if new.max_quantity < new.min_quantity then
        raise exception 'max_quantity deve ser >= min_quantity';
    end if;

    if v_group.allow_quantity = false
       and (new.min_quantity <> 1 or new.max_quantity <> 99) then
        raise exception
            'min_quantity/max_quantity só são configuráveis quando allow_quantity está ativo no grupo';
    end if;

    if new.priority = 0 and new.sort_order <> 0 then
        new.priority := new.sort_order;
    end if;

    return new;
end;
$$;

comment on function public.validate_option_engine_bounds() is
    'Valida min/max quantity da opção conforme configuração do grupo.';


-- 5.7 Apenas uma opção default por grupo
create or replace function public.enforce_single_default_option_per_group()
returns trigger
language plpgsql
as $$
begin
    if new.is_default = true then
        update public.options
        set is_default = false,
            updated_at = now()
        where group_id = new.group_id
          and id <> new.id
          and is_default = true;
    end if;

    return new;
end;
$$;

comment on function public.enforce_single_default_option_per_group() is
    'Garante no máximo uma opção is_default=true por grupo.';


-- 5.8 Auto pause/activate da opção conforme estoque
create or replace function public.apply_option_stock_availability()
returns trigger
language plpgsql
as $$
begin
    if not new.stock_control then
        return new;
    end if;

    if new.stock <= 0 then
        new.active := false;
    elsif old.stock <= 0 and new.stock > 0 then
        new.active := true;
    end if;

    return new;
end;
$$;

comment on function public.apply_option_stock_availability() is
    'Pausa opção automaticamente sem estoque e reativa quando estoque retorna.';


-- 5.9 Sincroniza status dos produtos afetados
create or replace function public.sync_products_on_option_availability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_product_id uuid;
    v_can_be_active boolean;
begin
    if tg_op <> 'UPDATE' then
        return new;
    end if;

    if not (
        old.stock is distinct from new.stock
        or old.active is distinct from new.active
        or old.stock_control is distinct from new.stock_control
    ) then
        return new;
    end if;

    for v_product_id in
        select distinct pog.product_id
        from public.product_option_groups pog
        where pog.group_id = new.group_id
    loop
        v_can_be_active := public.product_engine_can_be_active(v_product_id);

        if not v_can_be_active then
            update public.products
            set status = 'inactive',
                updated_at = now()
            where id = v_product_id
              and status = 'active';
        else
            update public.products
            set status = 'active',
                updated_at = now()
            where id = v_product_id
              and status = 'inactive';
        end if;
    end loop;

    return new;
end;
$$;

comment on function public.sync_products_on_option_availability() is
    'Product Engine: pausa/reativa produtos quando estoque/disponibilidade de opção muda.';


-- =============================================================================
-- 6. TRIGGERS
-- =============================================================================

drop trigger if exists option_groups_engine_defaults on public.option_groups;

create trigger option_groups_engine_defaults
    before insert or update of
        group_type,
        required,
        selection_type,
        max_selection,
        max_free,
        sort_order,
        priority
    on public.option_groups
    for each row
    execute function public.sync_option_group_engine_defaults();

drop trigger if exists options_validate_quantity_bounds on public.options;

create trigger options_validate_quantity_bounds
    before insert or update of
        group_id,
        min_quantity,
        max_quantity,
        sort_order,
        priority
    on public.options
    for each row
    execute function public.validate_option_engine_bounds();

drop trigger if exists options_enforce_single_default on public.options;

create trigger options_enforce_single_default
    before insert or update of is_default, group_id
    on public.options
    for each row
    execute function public.enforce_single_default_option_per_group();

drop trigger if exists options_apply_stock_availability on public.options;

create trigger options_apply_stock_availability
    before update of stock, active, stock_control
    on public.options
    for each row
    execute function public.apply_option_stock_availability();

drop trigger if exists options_sync_product_availability on public.options;

create trigger options_sync_product_availability
    after update of stock, active, stock_control
    on public.options
    for each row
    execute function public.sync_products_on_option_availability();


-- =============================================================================
-- 7. ROW LEVEL SECURITY (REAFIRMAÇÃO COMPLETA)
-- =============================================================================
-- As policies abaixo são idempotentes e cobrem TODAS as colunas (legadas + enterprise).
-- Usuários authenticated da mesma organização: SELECT.
-- Admin/Manager: INSERT, UPDATE, DELETE.

alter table public.option_groups enable row level security;
alter table public.options enable row level security;

-- option_groups
drop policy if exists option_groups_select on public.option_groups;
create policy option_groups_select on public.option_groups
    for select
    to authenticated
    using (organization_id = public.get_my_organization_id());

drop policy if exists option_groups_insert on public.option_groups;
create policy option_groups_insert on public.option_groups
    for insert
    to authenticated
    with check (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

drop policy if exists option_groups_update on public.option_groups;
create policy option_groups_update on public.option_groups
    for update
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    )
    with check (organization_id = public.get_my_organization_id());

drop policy if exists option_groups_delete on public.option_groups;
create policy option_groups_delete on public.option_groups
    for delete
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

-- options
drop policy if exists options_select on public.options;
create policy options_select on public.options
    for select
    to authenticated
    using (organization_id = public.get_my_organization_id());

drop policy if exists options_insert on public.options;
create policy options_insert on public.options
    for insert
    to authenticated
    with check (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

drop policy if exists options_update on public.options;
create policy options_update on public.options
    for update
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    )
    with check (organization_id = public.get_my_organization_id());

drop policy if exists options_delete on public.options;
create policy options_delete on public.options
    for delete
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );


-- =============================================================================
-- 8. DOCUMENTAÇÃO DE ROLLBACK (REFERÊNCIA — NÃO EXECUTAR AUTOMATICAMENTE)
-- =============================================================================
-- Para reverter manualmente (somente se necessário):
--
--   drop trigger if exists options_sync_product_availability on public.options;
--   drop trigger if exists options_apply_stock_availability on public.options;
--   drop trigger if exists options_enforce_single_default on public.options;
--   drop trigger if exists options_validate_quantity_bounds on public.options;
--   drop trigger if exists option_groups_engine_defaults on public.option_groups;
--
--   drop function if exists public.sync_products_on_option_availability();
--   drop function if exists public.apply_option_stock_availability();
--   drop function if exists public.enforce_single_default_option_per_group();
--   drop function if exists public.validate_option_engine_bounds();
--   drop function if exists public.sync_option_group_engine_defaults();
--   drop function if exists public.get_products_by_option_id(uuid);
--   drop function if exists public.product_engine_can_be_active(uuid);
--   drop function if exists public.option_group_has_available_options(uuid);
--   drop function if exists public.infer_option_group_type(boolean, text, integer);
--
--   alter table public.option_groups
--       drop column if exists group_type,
--       drop column if exists display_style,
--       ...;
--
--   alter table public.options
--       drop column if exists sku,
--       ...;
-- =============================================================================
