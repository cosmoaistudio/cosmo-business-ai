-- =============================================================================
-- Migration 026: Product Combos (menu_kind + product_combo_components)
-- =============================================================================
-- Cosmo Business AI
--
-- STATUS: PROPOSTA PARA APROVAÇÃO — NÃO APLICAR AUTOMATICAMENTE.
-- Aplicar manualmente no Supabase SQL Editor somente após revisão.
--
-- Propósito:
--   Suportar combos de produtos reais (ex.: Combo 2 Açaís) sobre o Product Engine
--   existente, sem sistema paralelo.
--
-- Modelo comercial:
--   • Combo = produto com menu_kind = 'combo' e preço base próprio (products.price).
--   • Componentes = produtos reais (simple/assembled), nunca outro combo (v1).
--   • Preço final = preço do combo + adicionais PAGOS dos componentes configurados.
--   • max_free / composição do filho aplicam-se POR COMPONENTE (não somados).
--
-- Campos REJEITADOS nesta v1 (com justificativa):
--   • component_slot_key     → desnecessário; product_combo_components.id é a chave
--                              estável do slot (dois Açaí 500ml = duas rows).
--   • pricing_mode           → v1 fixa: base do combo + addons dos componentes.
--                              Preço base dos filhos NÃO entra no total.
--   • free_option_limit      → já existe em option_groups.max_free do produto filho.
--   • allow_quantity_change  → quantidade do slot é de definição (admin); cliente
--                              configura opções, não altera qty do slot no PDV v1.
--   • required / max_quantity→ todos os slots ativos são obrigatórios; qty fixa.
--   • metadata jsonb         → YAGNI até haver necessidade concreta.
--
-- Campos INCLUÍDOS além do rascunho:
--   • active                 → pausar um slot sem apagar (igual espírito de status).
--   • created_at/updated_at  → auditoria mínima alinhada ao restante do schema.
--
-- Persistência de venda:
--   • sale_items.parent_sale_item_id → filhos do combo (estoque/KDS).
--   • sale_items.combo_component_id  → referência ao slot.
--   • sale_items.component_label     → snapshot do display_name.
--   • Pai (combo): unit_price = preço comercial (base + addons).
--   • Filhos: unit_price/subtotal = 0 (preço já no pai); servem estoque + cozinha.
--
-- Estoque (regra explícita, não inventada ad hoc):
--   • Componentes: SEMPRE validam e baixam stock (produtos reais).
--   • Opções dos componentes: baixam se stock_control (como hoje).
--   • Produto combo (pai): NÃO baixa stock (combo não é SKU físico; inventário
--     nos filhos). menu_kind=combo EXIGE components[] com component_id válidos.
--   • simple/assembled sem components: legado inalterado (baixa stock do pai).
--
-- Depende de:
--   • products, product_option_groups, options, sale_items, sale_item_options
--   • finalize_sale (015+), place_public_digital_order (023/024)
--   • kitchen build_kitchen_item_summary (022)
--   • get_my_organization_id(), has_role()
-- =============================================================================


-- =============================================================================
-- 1. products.menu_kind
-- =============================================================================

alter table public.products
    add column if not exists menu_kind text not null default 'simple';

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'products_menu_kind_check'
    ) then
        alter table public.products
            add constraint products_menu_kind_check
            check (menu_kind in ('simple', 'assembled', 'combo'));
    end if;
end $$;

comment on column public.products.menu_kind is
    'simple = sem composição; assembled = copo/montado (option groups); combo = bundle de produtos.';

create index if not exists idx_products_org_menu_kind
    on public.products (organization_id, menu_kind);


-- Backfill: nunca marca combo automaticamente.
update public.products p
set menu_kind = case
    when exists (
        select 1
        from public.product_option_groups pog
        where pog.product_id = p.id
    ) then 'assembled'
    else 'simple'
end
where coalesce(p.menu_kind, 'simple') = 'simple'
   or p.menu_kind not in ('simple', 'assembled', 'combo');


-- =============================================================================
-- 2. product_combo_components
-- =============================================================================

create table if not exists public.product_combo_components (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    combo_product_id uuid not null
        references public.products(id) on delete cascade,

    component_product_id uuid not null
        references public.products(id) on delete restrict,

    display_name text,

    quantity integer not null default 1
        constraint product_combo_components_quantity_check
        check (quantity > 0),

    sort_order integer not null default 0,

    allow_configuration boolean not null default true,

    active boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint product_combo_components_no_self_check
        check (combo_product_id <> component_product_id),

    constraint product_combo_components_sort_unique
        unique (combo_product_id, sort_order)
);

comment on table public.product_combo_components is
    'Slots de um produto combo. Cada row é um componente (produto real) na ordem do cardápio.';

comment on column public.product_combo_components.display_name is
    'Rótulo no PDV (ex.: Açaí 1). Se null, usa o nome do produto filho.';

comment on column public.product_combo_components.quantity is
    'Quantidade do produto filho neste slot (estoque/KDS). Não multiplica o preço base do combo.';

comment on column public.product_combo_components.allow_configuration is
    'true = abre ProductComposer do filho; false = inclui o produto sem opções.';

comment on column public.product_combo_components.active is
    'false = slot pausado (não aparece no PDV) sem apagar o vínculo.';

create index if not exists idx_pcc_combo_product_id
    on public.product_combo_components (combo_product_id, sort_order);

create index if not exists idx_pcc_component_product_id
    on public.product_combo_components (component_product_id);

create index if not exists idx_pcc_organization_id
    on public.product_combo_components (organization_id);

create index if not exists idx_pcc_active
    on public.product_combo_components (combo_product_id)
    where active = true;


-- updated_at trigger (reutiliza padrão se existir; senão cria local)
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists trg_pcc_set_updated_at on public.product_combo_components;
create trigger trg_pcc_set_updated_at
    before update on public.product_combo_components
    for each row
    execute function public.set_updated_at_timestamp();


-- Validação tenant + kinds
create or replace function public.validate_product_combo_component()
returns trigger
language plpgsql
as $$
declare
    v_combo record;
    v_component record;
    v_org uuid;
begin
    v_org := public.get_my_organization_id();

    select id, organization_id, menu_kind, status
    into v_combo
    from public.products
    where id = new.combo_product_id;

    if not found then
        raise exception 'Produto combo não encontrado';
    end if;

    select id, organization_id, menu_kind, status
    into v_component
    from public.products
    where id = new.component_product_id;

    if not found then
        raise exception 'Produto componente não encontrado';
    end if;

    if v_combo.organization_id <> v_component.organization_id then
        raise exception 'Combo e componente devem pertencer à mesma organização';
    end if;

    new.organization_id := v_combo.organization_id;

    if v_org is not null and new.organization_id <> v_org then
        raise exception 'organização inválida para o combo';
    end if;

    if v_combo.menu_kind <> 'combo' then
        raise exception 'combo_product_id deve ter menu_kind = combo';
    end if;

    if v_component.menu_kind = 'combo' then
        raise exception 'Componente não pode ser outro combo (v1)';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_validate_product_combo_component
    on public.product_combo_components;
create trigger trg_validate_product_combo_component
    before insert or update on public.product_combo_components
    for each row
    execute function public.validate_product_combo_component();


-- RLS
alter table public.product_combo_components enable row level security;

drop policy if exists product_combo_components_select on public.product_combo_components;
create policy product_combo_components_select on public.product_combo_components
    for select to authenticated
    using (organization_id = public.get_my_organization_id());

drop policy if exists product_combo_components_insert on public.product_combo_components;
create policy product_combo_components_insert on public.product_combo_components
    for insert to authenticated
    with check (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

drop policy if exists product_combo_components_update on public.product_combo_components;
create policy product_combo_components_update on public.product_combo_components
    for update to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    )
    with check (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

drop policy if exists product_combo_components_delete on public.product_combo_components;
create policy product_combo_components_delete on public.product_combo_components
    for delete to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );


-- =============================================================================
-- 3. sale_items — hierarquia de combo
-- =============================================================================

alter table public.sale_items
    add column if not exists parent_sale_item_id uuid
        references public.sale_items(id) on delete cascade;

alter table public.sale_items
    add column if not exists combo_component_id uuid;

alter table public.sale_items
    add column if not exists component_label text;

-- Histórico de venda não quebra se o slot for removido depois
alter table public.sale_items
    drop constraint if exists sale_items_combo_component_id_fkey;

alter table public.sale_items
    add constraint sale_items_combo_component_id_fkey
    foreign key (combo_component_id)
    references public.product_combo_components(id)
    on delete set null;

create index if not exists idx_sale_items_parent_sale_item_id
    on public.sale_items (parent_sale_item_id)
    where parent_sale_item_id is not null;

comment on column public.sale_items.parent_sale_item_id is
    'Quando preenchido, este item é um componente de um combo (pai).';
comment on column public.sale_items.combo_component_id is
    'Slot de product_combo_components de origem (SET NULL se o slot for removido).';
comment on column public.sale_items.component_label is
    'Snapshot do rótulo do componente (ex.: Açaí 1).';


-- =============================================================================
-- 4. Kitchen summary — inclui filhos do combo
-- =============================================================================

create or replace function public.build_kitchen_item_summary(p_sale_item_id uuid)
returns text
language sql
stable
as $$
    with option_lines as (
        select string_agg(
            case
                when sio.quantity > 1 then sio.quantity::text || 'x ' || sio.option_name
                else sio.option_name
            end,
            ', ' order by sio.created_at
        ) as summary
        from public.sale_item_options sio
        where sio.sale_item_id = p_sale_item_id
    ),
    child_lines as (
        select string_agg(
            coalesce(nullif(trim(si.component_label), ''), si.product_name)
            || case
                when si.quantity > 1 then ' (' || si.quantity::text || 'x)'
                else ''
            end
            || coalesce(
                ' → ' || public.build_kitchen_item_summary(si.id),
                ''
            ),
            ' | ' order by si.created_at
        ) as summary
        from public.sale_items si
        where si.parent_sale_item_id = p_sale_item_id
    )
    select nullif(
        trim(both ' |' from concat_ws(
            ' | ',
            (select summary from option_lines),
            (select summary from child_lines)
        )),
        ''
    );
$$;

comment on function public.build_kitchen_item_summary(uuid) is
    'Agrega opções do item e, se for combo, os componentes filhos com suas opções.';


-- =============================================================================
-- 5. Pricing helper — addons pagos com max_free POR GRUPO (espelha Product Engine)
-- =============================================================================
-- p_options: [{ "option_id": uuid, "quantity": int? }]
-- Retorna soma dos preços cobrados (unidades mais baratas do grupo ficam grátis
-- até max_free). Rejeita opções inválidas / fora do produto / gift excesso.
-- =============================================================================

create or replace function public.calculate_product_paid_option_addons(
    p_organization_id uuid,
    p_product_id uuid,
    p_options jsonb
)
returns numeric
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    v_option jsonb;
    v_option_id uuid;
    v_qty integer;
    v_opt record;
    v_group record;
    v_group_id uuid;
    v_total_in_group integer;
    v_paid numeric(12,2) := 0;
    v_free_left integer;
    v_unit_price numeric(10,2);
    v_i integer;
    v_units jsonb := '[]'::jsonb;
begin
    if p_options is null or jsonb_typeof(p_options) <> 'array' then
        return 0;
    end if;

    if jsonb_array_length(p_options) = 0 then
        return 0;
    end if;

    for v_option in select * from jsonb_array_elements(p_options)
    loop
        v_option_id := (v_option->>'option_id')::uuid;
        v_qty := coalesce((v_option->>'quantity')::integer, 1);

        if v_option_id is null or v_qty is null or v_qty <= 0 then
            raise exception 'Opção inválida no produto %', p_product_id;
        end if;

        select o.id, o.name, o.price, o.active, o.organization_id, o.group_id
        into v_opt
        from public.options o
        where o.id = v_option_id
          and o.organization_id = p_organization_id;

        if not found then
            raise exception 'Opção não encontrada: %', v_option_id;
        end if;

        if not v_opt.active then
            raise exception 'Opção inativa: %', v_opt.name;
        end if;

        if not exists (
            select 1
            from public.product_option_groups pog
            where pog.product_id = p_product_id
              and pog.group_id = v_opt.group_id
        ) then
            raise exception 'Opção % não pertence ao produto %', v_opt.name, p_product_id;
        end if;

        if not exists (
            select 1
            from public.option_groups og
            where og.id = v_opt.group_id
              and og.organization_id = p_organization_id
        ) then
            raise exception 'Grupo da opção % não encontrado', v_opt.name;
        end if;

        for v_i in 1..v_qty loop
            v_units := v_units || jsonb_build_array(
                jsonb_build_object(
                    'group_id', v_opt.group_id,
                    'unit_price', v_opt.price,
                    'option_id', v_opt.id
                )
            );
        end loop;
    end loop;

    for v_group_id in
        select distinct (u->>'group_id')::uuid
        from jsonb_array_elements(v_units) u
    loop
        select og.id, og.max_free, og.max_selection, og.group_type, og.name
        into v_group
        from public.option_groups og
        where og.id = v_group_id;

        select count(*)::integer into v_total_in_group
        from jsonb_array_elements(v_units) u
        where (u->>'group_id')::uuid = v_group_id;

        if v_total_in_group > v_group.max_selection then
            raise exception 'Grupo % permite no máximo % seleção(ões)',
                v_group.name, v_group.max_selection;
        end if;

        if v_group.group_type = 'gift'
           and v_group.max_free > 0
           and v_total_in_group > v_group.max_free then
            raise exception 'Brindes limitados a % item(ns) em %',
                v_group.max_free, v_group.name;
        end if;

        v_free_left := greatest(coalesce(v_group.max_free, 0), 0);

        for v_unit_price in
            select (u->>'unit_price')::numeric
            from jsonb_array_elements(v_units) u
            where (u->>'group_id')::uuid = v_group_id
            order by (u->>'unit_price')::numeric asc, (u->>'option_id')::uuid asc
        loop
            if v_free_left > 0 then
                v_free_left := v_free_left - 1;
            else
                v_paid := v_paid + v_unit_price;
            end if;
        end loop;
    end loop;

    return v_paid;
end;
$$;

comment on function public.calculate_product_paid_option_addons(uuid, uuid, jsonb) is
    'Soma addons pagos de opções de um produto, aplicando max_free por grupo (Product Engine).';

-- =============================================================================
-- 6. finalize_sale — components[] com validação de slot + preço recalculado
-- =============================================================================
-- Contrato combo:
-- {
--   "product_id": uuid,                 -- combo
--   "quantity": int,                    -- N combos
--   "components": [{
--      "component_id": uuid,            -- OBRIGATÓRIO = product_combo_components.id
--      "product_id": uuid,              -- deve bater com slot.component_product_id
--      "quantity": int?,                -- se enviado, DEVE = slot.quantity (definição)
--      "label": text?,
--      "options": [{ "option_id", "quantity?" }]  -- proibido se !allow_configuration
--   }]
-- }
-- Preço unitário do combo (IGNORA unit_price do cliente):
--   products.price(combo) + Σ addons pagos por componente (max_free por grupo do filho)
-- Quantidade efetiva estoque componente:
--   slot.quantity * N
-- Todos os slots active do combo devem aparecer exatamente uma vez.
-- Simple/assembled: comportamento legado (unit_price do cliente com fallback).
-- =============================================================================

create or replace function public.finalize_sale(
    p_items jsonb,
    p_payment_method text,
    p_payment_amount numeric,
    p_discount numeric default 0,
    p_observation text default null,
    p_customer_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_item jsonb;
    v_option jsonb;
    v_component jsonb;
    v_product record;
    v_child record;
    v_slot record;
    v_option_record record;
    v_sale_id uuid;
    v_sale_item_id uuid;
    v_child_sale_item_id uuid;
    v_sale_number bigint;
    v_subtotal numeric(10,2) := 0;
    v_discount numeric(10,2) := 0;
    v_total numeric(10,2) := 0;
    v_item_subtotal numeric(10,2);
    v_unit_price numeric(10,2);
    v_quantity integer;
    v_product_id uuid;
    v_option_id uuid;
    v_option_unit_qty integer;
    v_option_total_qty integer;
    v_option_subtotal numeric(10,2);
    v_previous_stock integer;
    v_customer_name text;
    v_finance_description text;
    v_org_id uuid;
    v_has_components boolean;
    v_comp_qty integer;
    v_comp_product_id uuid;
    v_comp_label text;
    v_comp_id uuid;
    v_client_comp_qty integer;
    v_addons numeric(12,2);
    v_active_slot_count integer;
    v_payload_slot_count integer;
    v_seen_slots uuid[] := array[]::uuid[];
begin
    v_org_id := public.get_my_organization_id();

    if v_org_id is null then
        raise exception 'Usuário sem organização vinculada';
    end if;

    if not public.has_role(array['admin', 'manager', 'cashier']) then
        raise exception 'Permissão insuficiente para finalizar venda';
    end if;

    if p_items is null or jsonb_array_length(p_items) = 0 then
        raise exception 'A venda deve conter ao menos um item';
    end if;

    if p_payment_method not in ('cash', 'credit_card', 'debit_card', 'pix') then
        raise exception 'Forma de pagamento inválida';
    end if;

    if p_payment_amount is null or p_payment_amount <= 0 then
        raise exception 'Valor de pagamento inválido';
    end if;

    v_discount := coalesce(p_discount, 0);
    if v_discount < 0 then
        raise exception 'Desconto inválido';
    end if;

    if p_customer_id is not null then
        select name into v_customer_name
        from public.customers
        where id = p_customer_id and organization_id = v_org_id;
        if not found then
            raise exception 'Cliente não encontrado';
        end if;
    end if;

    -- =========================================================================
    -- PASS 1: validação + cálculo de subtotal (preço confiável no servidor)
    -- =========================================================================
    for v_item in select * from jsonb_array_elements(p_items)
    loop
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::integer;
        v_has_components := jsonb_typeof(v_item->'components') = 'array'
            and jsonb_array_length(coalesce(v_item->'components', '[]'::jsonb)) > 0;
        v_seen_slots := array[]::uuid[];

        if v_quantity is null or v_quantity <= 0 then
            raise exception 'Quantidade inválida para o produto %', v_product_id;
        end if;

        select id, name, price, stock, status, organization_id, menu_kind
        into v_product
        from public.products
        where id = v_product_id and organization_id = v_org_id
        for update;

        if not found then
            raise exception 'Produto não encontrado: %', v_product_id;
        end if;
        if v_product.status <> 'active' then
            raise exception 'Produto inativo: %', v_product.name;
        end if;

        if v_product.menu_kind = 'combo' and not v_has_components then
            raise exception 'Combo % exige components[] com component_id', v_product.name;
        end if;

        if v_has_components then
            if v_product.menu_kind <> 'combo' then
                raise exception 'Item com components deve ser menu_kind=combo: %', v_product.name;
            end if;

            -- Combo não aceita options[] no nível do pai
            if jsonb_array_length(coalesce(v_item->'options', '[]'::jsonb)) > 0 then
                raise exception 'Combo % não aceita options no item pai', v_product.name;
            end if;

            select count(*)::integer into v_active_slot_count
            from public.product_combo_components pcc
            where pcc.combo_product_id = v_product_id
              and pcc.organization_id = v_org_id
              and pcc.active = true;

            if v_active_slot_count = 0 then
                raise exception 'Combo % sem componentes ativos', v_product.name;
            end if;

            v_payload_slot_count := jsonb_array_length(coalesce(v_item->'components', '[]'::jsonb));
            if v_payload_slot_count <> v_active_slot_count then
                raise exception 'Combo % exige todos os % componentes ativos (recebido: %)',
                    v_product.name, v_active_slot_count, v_payload_slot_count;
            end if;

            v_addons := 0;

            for v_component in
                select * from jsonb_array_elements(coalesce(v_item->'components', '[]'::jsonb))
            loop
                v_comp_id := nullif(trim(coalesce(v_component->>'component_id', '')), '')::uuid;
                v_comp_product_id := (v_component->>'product_id')::uuid;

                if v_comp_id is null then
                    raise exception 'component_id obrigatório no combo %', v_product.name;
                end if;

                select *
                into v_slot
                from public.product_combo_components pcc
                where pcc.id = v_comp_id
                for update;

                if not found then
                    raise exception 'component_id inválido: %', v_comp_id;
                end if;

                if v_slot.organization_id <> v_org_id then
                    raise exception 'Componente de outra organização';
                end if;

                if v_slot.combo_product_id <> v_product_id then
                    raise exception 'component_id % não pertence ao combo %',
                        v_comp_id, v_product.name;
                end if;

                if not v_slot.active then
                    raise exception 'Componente inativo no combo %', v_product.name;
                end if;

                if v_comp_product_id is null
                   or v_comp_product_id <> v_slot.component_product_id then
                    raise exception 'product_id do componente não confere com o slot %',
                        v_comp_id;
                end if;

                if v_comp_id = any(v_seen_slots) then
                    raise exception 'Componente duplicado no payload: %', v_comp_id;
                end if;
                v_seen_slots := array_append(v_seen_slots, v_comp_id);

                -- quantity do payload (se existir) deve ser a definição do slot
                if v_component ? 'quantity' and v_component->>'quantity' is not null then
                    v_client_comp_qty := (v_component->>'quantity')::integer;
                    if v_client_comp_qty is null
                       or v_client_comp_qty <> v_slot.quantity then
                        raise exception 'Quantidade inválida no slot % (esperado %)',
                            v_comp_id, v_slot.quantity;
                    end if;
                end if;

                v_comp_qty := v_slot.quantity * v_quantity;

                select id, name, price, stock, status, organization_id, menu_kind
                into v_child
                from public.products
                where id = v_slot.component_product_id
                  and organization_id = v_org_id
                for update;

                if not found then
                    raise exception 'Componente não encontrado: %', v_slot.component_product_id;
                end if;
                if v_child.organization_id <> v_org_id
                   or v_child.organization_id <> v_slot.organization_id then
                    raise exception 'Tenant inválido no componente %', v_child.name;
                end if;
                if v_child.status <> 'active' then
                    raise exception 'Componente inativo: %', v_child.name;
                end if;
                if v_child.menu_kind = 'combo' then
                    raise exception 'Componente não pode ser combo: %', v_child.name;
                end if;
                if v_child.stock < v_comp_qty then
                    raise exception 'Estoque insuficiente para componente: % (disponível: %)',
                        v_child.name, v_child.stock;
                end if;

                if not v_slot.allow_configuration then
                    if jsonb_array_length(coalesce(v_component->'options', '[]'::jsonb)) > 0 then
                        raise exception 'Slot % não permite options (allow_configuration=false)',
                            v_comp_id;
                    end if;
                else
                    -- valida opções + soma addons pagos (max_free por grupo)
                    -- slot.quantity multiplica addons (não a base do combo)
                    v_addons := v_addons + (
                        public.calculate_product_paid_option_addons(
                            v_org_id,
                            v_slot.component_product_id,
                            coalesce(v_component->'options', '[]'::jsonb)
                        ) * v_slot.quantity
                    );

                    -- estoque de opções com stock_control
                    for v_option in
                        select * from jsonb_array_elements(
                            coalesce(v_component->'options', '[]'::jsonb)
                        )
                    loop
                        v_option_id := (v_option->>'option_id')::uuid;
                        v_option_unit_qty := coalesce((v_option->>'quantity')::integer, 1);
                        v_option_total_qty := v_option_unit_qty * v_comp_qty;

                        select id, name, stock_control, stock, active
                        into v_option_record
                        from public.options
                        where id = v_option_id and organization_id = v_org_id;

                        if not found then
                            raise exception 'Opção não encontrada no componente: %', v_option_id;
                        end if;
                        if v_option_record.stock_control
                           and v_option_record.stock < v_option_total_qty then
                            raise exception 'Estoque insuficiente para opção: % (disponível: %)',
                                v_option_record.name, v_option_record.stock;
                        end if;
                    end loop;
                end if;
            end loop;

            -- Preço comercial recalculado no servidor (cliente não manipula)
            v_unit_price := v_product.price + v_addons;
        else
            -- LEGADO: simple / assembled
            if v_product.stock < v_quantity then
                raise exception 'Estoque insuficiente para: % (disponível: %)',
                    v_product.name, v_product.stock;
            end if;

            v_unit_price := coalesce((v_item->>'unit_price')::numeric, v_product.price);
            if v_unit_price < 0 then
                raise exception 'Preço unitário inválido para: %', v_product.name;
            end if;

            for v_option in
                select * from jsonb_array_elements(coalesce(v_item->'options', '[]'::jsonb))
            loop
                v_option_id := (v_option->>'option_id')::uuid;
                v_option_unit_qty := coalesce((v_option->>'quantity')::integer, 1);
                if v_option_id is null or v_option_unit_qty is null or v_option_unit_qty <= 0 then
                    raise exception 'Opção inválida no produto %', v_product.name;
                end if;
                v_option_total_qty := v_option_unit_qty * v_quantity;

                select id, name, price, stock_control, stock, active, organization_id
                into v_option_record
                from public.options
                where id = v_option_id and organization_id = v_org_id;

                if not found then
                    raise exception 'Opção não encontrada: %', v_option_id;
                end if;
                if not v_option_record.active then
                    raise exception 'Opção inativa: %', v_option_record.name;
                end if;
                if v_option_record.stock_control
                   and v_option_record.stock < v_option_total_qty then
                    raise exception 'Estoque insuficiente para opção: % (disponível: %)',
                        v_option_record.name, v_option_record.stock;
                end if;
            end loop;
        end if;

        v_subtotal := v_subtotal + (v_unit_price * v_quantity);
    end loop;

    if v_discount > v_subtotal then
        raise exception 'Desconto (%) superior ao subtotal da venda (%)', v_discount, v_subtotal;
    end if;

    v_total := v_subtotal - v_discount;

    if p_payment_amount < v_total then
        raise exception 'Valor pago (%) inferior ao total da venda (%)', p_payment_amount, v_total;
    end if;

    insert into public.sales (
        subtotal, discount, total, status, observation, customer_id, organization_id
    ) values (
        v_subtotal, v_discount, v_total, 'completed',
        nullif(trim(p_observation), ''), p_customer_id, v_org_id
    )
    returning id, sale_number into v_sale_id, v_sale_number;

    -- =========================================================================
    -- PASS 2: persistência + baixa de estoque
    -- =========================================================================
    for v_item in select * from jsonb_array_elements(p_items)
    loop
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::integer;
        v_has_components := jsonb_typeof(v_item->'components') = 'array'
            and jsonb_array_length(coalesce(v_item->'components', '[]'::jsonb)) > 0;

        select id, name, price, stock, menu_kind
        into v_product
        from public.products
        where id = v_product_id and organization_id = v_org_id
        for update;

        if v_has_components then
            v_addons := 0;
            for v_component in
                select * from jsonb_array_elements(coalesce(v_item->'components', '[]'::jsonb))
            loop
                v_comp_id := (v_component->>'component_id')::uuid;
                select * into v_slot
                from public.product_combo_components
                where id = v_comp_id;

                if v_slot.allow_configuration then
                    v_addons := v_addons + (
                        public.calculate_product_paid_option_addons(
                            v_org_id,
                            v_slot.component_product_id,
                            coalesce(v_component->'options', '[]'::jsonb)
                        ) * v_slot.quantity
                    );
                end if;
            end loop;
            v_unit_price := v_product.price + v_addons;
        else
            v_unit_price := coalesce((v_item->>'unit_price')::numeric, v_product.price);
        end if;

        v_item_subtotal := v_unit_price * v_quantity;

        insert into public.sale_items (
            sale_id, product_id, product_name, quantity, unit_price, subtotal
        ) values (
            v_sale_id, v_product_id, v_product.name,
            v_quantity, v_unit_price, v_item_subtotal
        )
        returning id into v_sale_item_id;

        if v_has_components then
            for v_component in
                select * from jsonb_array_elements(coalesce(v_item->'components', '[]'::jsonb))
            loop
                v_comp_id := (v_component->>'component_id')::uuid;
                select * into v_slot
                from public.product_combo_components
                where id = v_comp_id;

                v_comp_qty := v_slot.quantity * v_quantity;
                v_comp_label := coalesce(
                    nullif(trim(coalesce(v_component->>'label', '')), ''),
                    nullif(trim(coalesce(v_slot.display_name, '')), ''),
                    null
                );

                select id, name, stock
                into v_child
                from public.products
                where id = v_slot.component_product_id and organization_id = v_org_id
                for update;

                v_previous_stock := v_child.stock;

                insert into public.sale_items (
                    sale_id, product_id, product_name, quantity,
                    unit_price, subtotal,
                    parent_sale_item_id, combo_component_id, component_label
                ) values (
                    v_sale_id, v_slot.component_product_id, v_child.name, v_comp_qty,
                    0, 0,
                    v_sale_item_id, v_comp_id, v_comp_label
                )
                returning id into v_child_sale_item_id;

                update public.products
                set stock = stock - v_comp_qty,
                    updated_at = now()
                where id = v_slot.component_product_id;

                insert into public.stock_movements (
                    product_id, organization_id, movement_type, quantity,
                    previous_stock, new_stock, notes, reference_id
                ) values (
                    v_slot.component_product_id, v_org_id, 'sale', v_comp_qty,
                    v_previous_stock, v_previous_stock - v_comp_qty,
                    'Venda combo PDV #' || v_sale_number, v_sale_id
                );

                if v_slot.allow_configuration then
                    for v_option in
                        select * from jsonb_array_elements(
                            coalesce(v_component->'options', '[]'::jsonb)
                        )
                    loop
                        v_option_id := (v_option->>'option_id')::uuid;
                        v_option_unit_qty := coalesce((v_option->>'quantity')::integer, 1);
                        v_option_total_qty := v_option_unit_qty * v_comp_qty;

                        select id, name, price, stock_control, stock
                        into v_option_record
                        from public.options
                        where id = v_option_id and organization_id = v_org_id
                        for update;

                        v_option_subtotal := v_option_record.price * v_option_total_qty;

                        insert into public.sale_item_options (
                            sale_item_id, option_id, option_name, price, quantity, subtotal
                        ) values (
                            v_child_sale_item_id, v_option_id, v_option_record.name,
                            v_option_record.price, v_option_total_qty, v_option_subtotal
                        );

                        if v_option_record.stock_control then
                            update public.options
                            set stock = stock - v_option_total_qty,
                                updated_at = now()
                            where id = v_option_id;
                        end if;
                    end loop;
                end if;
            end loop;
        else
            -- opções do item raiz (simple/assembled)
            for v_option in
                select * from jsonb_array_elements(coalesce(v_item->'options', '[]'::jsonb))
            loop
                v_option_id := (v_option->>'option_id')::uuid;
                v_option_unit_qty := coalesce((v_option->>'quantity')::integer, 1);
                v_option_total_qty := v_option_unit_qty * v_quantity;

                select id, name, price, stock_control, stock
                into v_option_record
                from public.options
                where id = v_option_id and organization_id = v_org_id
                for update;

                v_option_subtotal := v_option_record.price * v_option_total_qty;

                insert into public.sale_item_options (
                    sale_item_id, option_id, option_name, price, quantity, subtotal
                ) values (
                    v_sale_item_id, v_option_id, v_option_record.name,
                    v_option_record.price, v_option_total_qty, v_option_subtotal
                );

                if v_option_record.stock_control then
                    update public.options
                    set stock = stock - v_option_total_qty,
                        updated_at = now()
                    where id = v_option_id;
                end if;
            end loop;

            v_previous_stock := v_product.stock;
            update public.products
            set stock = stock - v_quantity,
                updated_at = now()
            where id = v_product_id;

            insert into public.stock_movements (
                product_id, organization_id, movement_type, quantity,
                previous_stock, new_stock, notes, reference_id
            ) values (
                v_product_id, v_org_id, 'sale', v_quantity,
                v_previous_stock, v_previous_stock - v_quantity,
                'Venda PDV #' || v_sale_number, v_sale_id
            );
        end if;
    end loop;

    insert into public.sale_payments (sale_id, payment_method, amount)
    values (v_sale_id, p_payment_method, p_payment_amount);

    v_finance_description := 'Venda PDV #' || v_sale_number;
    if v_customer_name is not null then
        v_finance_description := v_finance_description || ' — ' || v_customer_name;
    end if;

    insert into public.financial_transactions (
        type, category, description, amount,
        transaction_date, source, reference_id, notes, organization_id
    ) values (
        'income', 'sale', v_finance_description, v_total,
        current_date, 'pdv', v_sale_id,
        nullif(trim(p_observation), ''), v_org_id
    );

    perform public.log_audit(
        'sale.completed',
        'sale',
        v_sale_id,
        jsonb_build_object(
            'sale_number', v_sale_number,
            'total', v_total,
            'customer_id', p_customer_id
        )
    );

    return jsonb_build_object(
        'id', v_sale_id,
        'sale_number', v_sale_number,
        'subtotal', v_subtotal,
        'discount', v_discount,
        'total', v_total,
        'status', 'completed',
        'payment_method', p_payment_method,
        'payment_amount', p_payment_amount,
        'change_amount', p_payment_amount - v_total,
        'customer_id', p_customer_id
    );
end;
$$;

comment on function public.finalize_sale(jsonb, text, numeric, numeric, text, uuid) is
    'Finaliza venda PDV. Combo: valida slots, recalcula preço (base+addons), baixa estoque dos filhos.';

grant execute on function public.finalize_sale(jsonb, text, numeric, numeric, text, uuid) to authenticated;
grant execute on function public.calculate_product_paid_option_addons(uuid, uuid, jsonb) to authenticated;

-- =============================================================================
-- 7. KDS — apenas itens raiz (filhos do combo entram no summary do pai)
-- =============================================================================

create or replace function public.generate_kitchen_ticket_from_sale(p_sale_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_sale record;
    v_customer_name text;
    v_ticket_id uuid;
    v_sale_item record;
begin
    select
        s.id,
        s.organization_id,
        s.sale_number,
        s.status,
        s.observation,
        s.customer_id
    into v_sale
    from public.sales s
    where s.id = p_sale_id;

    if not found then
        raise exception 'Venda não encontrada: %', p_sale_id;
    end if;

    if v_sale.status <> 'completed' then
        return null;
    end if;

    select kt.id
    into v_ticket_id
    from public.kitchen_tickets kt
    where kt.sale_id = p_sale_id;

    if v_ticket_id is not null then
        for v_sale_item in
            select
                si.id as sale_item_id,
                si.product_id,
                si.product_name,
                si.quantity
            from public.sale_items si
            where si.sale_id = p_sale_id
              and si.parent_sale_item_id is null
        loop
            insert into public.kitchen_ticket_items (
                ticket_id, sale_item_id, product_id, product_name,
                quantity, summary, status
            )
            values (
                v_ticket_id,
                v_sale_item.sale_item_id,
                v_sale_item.product_id,
                v_sale_item.product_name,
                v_sale_item.quantity,
                public.build_kitchen_item_summary(v_sale_item.sale_item_id),
                'pending'
            )
            on conflict (ticket_id, sale_item_id) do nothing;
        end loop;

        return v_ticket_id;
    end if;

    if v_sale.customer_id is not null then
        select c.name
        into v_customer_name
        from public.customers c
        where c.id = v_sale.customer_id
          and c.organization_id = v_sale.organization_id;
    end if;

    insert into public.kitchen_tickets (
        organization_id, sale_id, sale_number, customer_name,
        status, priority, ticket_type, notes
    )
    values (
        v_sale.organization_id,
        v_sale.id,
        v_sale.sale_number,
        v_customer_name,
        'pending',
        'normal',
        public.infer_kitchen_ticket_type(v_sale.observation),
        v_sale.observation
    )
    returning id into v_ticket_id;

    for v_sale_item in
        select
            si.id as sale_item_id,
            si.product_id,
            si.product_name,
            si.quantity
        from public.sale_items si
        where si.sale_id = p_sale_id
          and si.parent_sale_item_id is null
    loop
        insert into public.kitchen_ticket_items (
            ticket_id, sale_item_id, product_id, product_name,
            quantity, summary, status
        )
        values (
            v_ticket_id,
            v_sale_item.sale_item_id,
            v_sale_item.product_id,
            v_sale_item.product_name,
            v_sale_item.quantity,
            public.build_kitchen_item_summary(v_sale_item.sale_item_id),
            'pending'
        )
        on conflict (ticket_id, sale_item_id) do nothing;
    end loop;

    return v_ticket_id;
end;
$$;

comment on function public.generate_kitchen_ticket_from_sale(uuid) is
    'KDS: itens raiz apenas; componentes de combo entram no summary do pai.';

-- =============================================================================
-- 8. NOTA OBRIGATÓRIA: place_public_digital_order (023/024)
-- =============================================================================
-- Esta migration NÃO reescreve place_public_digital_order para manter o diff
-- revisável. Antes do go-live de combos no digital ordering, aplicar migration
-- 027 espelhando o loop components[] (mesmas regras de estoque/filhos).
-- Até lá, checkout público continua só com options[] flat.
-- =============================================================================
