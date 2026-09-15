-- =============================================================================
-- Migration 028: Combo assembled choice (selection_mode + combo_unit_index)
-- =============================================================================
-- Cosmo Business AI
--
-- STATUS: PROPOSTA — NÃO APLICAR AUTOMATICAMENTE.
-- Aplicar manualmente no Supabase SQL Editor somente após revisão.
--
-- Depende de: 026 (product combos + finalize_sale) + 027 (digital combos).
--
-- Propósito:
--   • Combos fixed (comportamento 026) e choice (N unidades assembled do pool).
--   • Helper resolve_combo_sale_units centraliza validação/preço/estoque.
--   • Persistir combo_unit_index nos filhos para KDS legível (COPO 1, COPO 2…).
--
-- NÃO altera: 026/027 em disco; sem DROP destrutivo de tabelas.
-- =============================================================================


-- =============================================================================
-- 1. Schema — products + sale_items
-- =============================================================================

alter table public.products
    add column if not exists combo_selection_mode text not null default 'fixed';

alter table public.products
    add column if not exists combo_min_choices integer null;

alter table public.products
    add column if not exists combo_max_choices integer null;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'products_combo_selection_mode_check'
    ) then
        alter table public.products
            add constraint products_combo_selection_mode_check
            check (combo_selection_mode in ('fixed', 'choice'));
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'products_combo_min_choices_check'
    ) then
        alter table public.products
            add constraint products_combo_min_choices_check
            check (combo_min_choices is null or combo_min_choices >= 1);
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'products_combo_max_choices_check'
    ) then
        alter table public.products
            add constraint products_combo_max_choices_check
            check (combo_max_choices is null or combo_max_choices >= 1);
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'products_combo_choices_range_check'
    ) then
        alter table public.products
            add constraint products_combo_choices_range_check
            check (
                combo_min_choices is null
                or combo_max_choices is null
                or combo_max_choices >= combo_min_choices
            );
    end if;

    -- choice exige min/max preenchidos e válidos; fixed permite NULL
    if not exists (
        select 1 from pg_constraint where conname = 'products_combo_choice_requires_limits_check'
    ) then
        alter table public.products
            add constraint products_combo_choice_requires_limits_check
            check (
                combo_selection_mode <> 'choice'
                or (
                    combo_min_choices is not null
                    and combo_max_choices is not null
                    and combo_min_choices >= 1
                    and combo_max_choices >= combo_min_choices
                )
            );
    end if;
end $$;

comment on column public.products.combo_selection_mode is
    'fixed = todos os slots ativos obrigatórios (026); choice = cliente escolhe N unidades assembled do pool.';

comment on column public.products.combo_min_choices is
    'Mínimo de unidades escolhidas quando combo_selection_mode=choice (>= 1). Null em fixed.';

comment on column public.products.combo_max_choices is
    'Máximo de unidades escolhidas quando combo_selection_mode=choice (>= combo_min_choices). Null em fixed.';


alter table public.sale_items
    add column if not exists combo_unit_index integer null;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'sale_items_combo_unit_index_check'
    ) then
        alter table public.sale_items
            add constraint sale_items_combo_unit_index_check
            check (combo_unit_index is null or combo_unit_index >= 1);
    end if;
end $$;

comment on column public.sale_items.combo_unit_index is
    'Índice da unidade no combo (COPO 1, COPO 2…). Null em itens sem combo ou legado pré-028.';

create index if not exists idx_sale_items_parent_unit_index
    on public.sale_items (parent_sale_item_id, combo_unit_index)
    where parent_sale_item_id is not null;


-- =============================================================================
-- 2. Trigger validate_product_combo_component — choice exige assembled ativo
-- =============================================================================

create or replace function public.validate_product_combo_component()
returns trigger
language plpgsql
as $$
declare
    v_combo record;
    v_component record;
    v_org uuid;
    v_mode text;
begin
    v_org := public.get_my_organization_id();

    select id, organization_id, menu_kind, status, combo_selection_mode
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

    v_mode := coalesce(nullif(trim(v_combo.combo_selection_mode), ''), 'fixed');

    if v_mode = 'choice' then
        if v_component.menu_kind <> 'assembled' then
            raise exception 'Em combo choice, o componente deve ser menu_kind = assembled';
        end if;
        if v_component.status <> 'active' then
            raise exception 'Em combo choice, o componente deve estar active';
        end if;
    else
        -- fixed (e legado): bloqueia apenas combo aninhado
        if v_component.menu_kind = 'combo' then
            raise exception 'Componente não pode ser outro combo (v1)';
        end if;
    end if;

    return new;
end;
$$;

comment on function public.validate_product_combo_component() is
    'Valida tenant/self/parent combo; choice exige componente assembled+active; fixed bloqueia nested combo.';


-- =============================================================================
-- 3. Helper resolve_combo_sale_units
-- =============================================================================
-- p_components: [{ component_id, product_id, quantity?, label?, unit_index?, options? }]
-- Retorno: { "addons": numeric, "units": [{ component_id, product_id, product_name,
--   unit_index, label, child_qty_per_combo, allow_configuration, options }] }
-- Preços do cliente são IGNORADOS. Estoque validado com p_combo_qty.
-- =============================================================================

create or replace function public.resolve_combo_sale_units(
    p_org_id uuid,
    p_combo_id uuid,
    p_combo_name text,
    p_combo_price numeric,
    p_selection_mode text,
    p_min_choices integer,
    p_max_choices integer,
    p_components jsonb,
    p_combo_qty integer
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    v_mode text;
    v_component jsonb;
    v_slot record;
    v_child record;
    v_option jsonb;
    v_option_record record;
    v_comp_id uuid;
    v_comp_product_id uuid;
    v_client_qty integer;
    v_unit_index integer;
    v_ord integer := 0;
    v_label text;
    v_options jsonb;
    v_child_qty integer;
    v_unit_addons numeric(12,2);
    v_addons numeric(12,2) := 0;
    v_units jsonb := '[]'::jsonb;
    v_active_slot_count integer;
    v_payload_count integer;
    v_seen_slots uuid[] := array[]::uuid[];
    v_seen_indexes integer[] := array[]::integer[];
    v_product_need jsonb := '{}'::jsonb;
    v_option_need jsonb := '{}'::jsonb;
    v_pid text;
    v_oid text;
    v_need integer;
    v_opt_unit_qty integer;
    v_stock integer;
    v_prod_name text;
begin
    if p_org_id is null then
        raise exception 'organization_id obrigatório';
    end if;

    if p_combo_qty is null or p_combo_qty <= 0 then
        raise exception 'Quantidade de combo inválida';
    end if;

    if p_components is null or jsonb_typeof(p_components) <> 'array'
       or jsonb_array_length(p_components) = 0 then
        raise exception 'Combo % exige components[] com component_id', coalesce(p_combo_name, p_combo_id::text);
    end if;

    v_mode := coalesce(nullif(trim(p_selection_mode), ''), 'fixed');
    if v_mode not in ('fixed', 'choice') then
        raise exception 'combo_selection_mode inválido: %', v_mode;
    end if;

    -- p_combo_price no contrato do helper; preço comercial = base + addons no caller
    if p_combo_price is not null and p_combo_price < 0 then
        raise exception 'Preço base do combo inválido';
    end if;

    select count(*)::integer into v_active_slot_count
    from public.product_combo_components pcc
    where pcc.combo_product_id = p_combo_id
      and pcc.organization_id = p_org_id
      and pcc.active = true;

    if v_active_slot_count = 0 then
        raise exception 'Combo % sem componentes ativos', coalesce(p_combo_name, p_combo_id::text);
    end if;

    v_payload_count := jsonb_array_length(p_components);

    if v_mode = 'fixed' then
        if v_payload_count <> v_active_slot_count then
            raise exception 'Combo % exige todos os % componentes ativos (recebido: %)',
                coalesce(p_combo_name, p_combo_id::text), v_active_slot_count, v_payload_count;
        end if;
    else
        -- choice
        if p_min_choices is null or p_max_choices is null then
            raise exception 'Combo choice % exige combo_min_choices e combo_max_choices',
                coalesce(p_combo_name, p_combo_id::text);
        end if;
        if p_min_choices < 1 or p_max_choices < p_min_choices then
            raise exception 'Limites de escolha inválidos no combo % (min=%, max=%)',
                coalesce(p_combo_name, p_combo_id::text), p_min_choices, p_max_choices;
        end if;
        if v_payload_count < p_min_choices or v_payload_count > p_max_choices then
            raise exception 'Combo % exige entre % e % escolhas (recebido: %)',
                coalesce(p_combo_name, p_combo_id::text),
                p_min_choices, p_max_choices, v_payload_count;
        end if;
    end if;

    for v_component in select * from jsonb_array_elements(p_components)
    loop
        v_ord := v_ord + 1;
        v_comp_id := nullif(trim(coalesce(v_component->>'component_id', '')), '')::uuid;
        v_comp_product_id := (v_component->>'product_id')::uuid;

        if v_comp_id is null then
            raise exception 'component_id obrigatório no combo %', coalesce(p_combo_name, p_combo_id::text);
        end if;

        select *
        into v_slot
        from public.product_combo_components pcc
        where pcc.id = v_comp_id
        for update;

        if not found then
            raise exception 'component_id inválido: %', v_comp_id;
        end if;

        if v_slot.organization_id <> p_org_id then
            raise exception 'Componente de outra organização';
        end if;

        if v_slot.combo_product_id <> p_combo_id then
            raise exception 'component_id % não pertence ao combo %',
                v_comp_id, coalesce(p_combo_name, p_combo_id::text);
        end if;

        if not v_slot.active then
            raise exception 'Componente inativo no combo %', coalesce(p_combo_name, p_combo_id::text);
        end if;

        if v_comp_product_id is null
           or v_comp_product_id <> v_slot.component_product_id then
            raise exception 'product_id do componente não confere com o slot %', v_comp_id;
        end if;

        if v_mode = 'fixed' then
            if v_comp_id = any(v_seen_slots) then
                raise exception 'Componente duplicado no payload: %', v_comp_id;
            end if;
            v_seen_slots := array_append(v_seen_slots, v_comp_id);

            if v_component ? 'quantity' and v_component->>'quantity' is not null then
                v_client_qty := (v_component->>'quantity')::integer;
                if v_client_qty is null or v_client_qty <> v_slot.quantity then
                    raise exception 'Quantidade inválida no slot % (esperado %)',
                        v_comp_id, v_slot.quantity;
                end if;
            end if;

            v_child_qty := v_slot.quantity;
            v_unit_index := v_ord;
        else
            -- choice: mesma component_id pode repetir; cada entry = 1 unidade
            if v_component ? 'quantity' and v_component->>'quantity' is not null then
                v_client_qty := (v_component->>'quantity')::integer;
                if v_client_qty is null or v_client_qty <> 1 then
                    raise exception 'Cada escolha do combo deve ter quantity = 1';
                end if;
            end if;

            v_child_qty := 1;

            if v_component ? 'unit_index' and v_component->>'unit_index' is not null then
                v_unit_index := (v_component->>'unit_index')::integer;
                if v_unit_index is null or v_unit_index < 1 then
                    raise exception 'unit_index inválido no combo %', coalesce(p_combo_name, p_combo_id::text);
                end if;
            else
                v_unit_index := v_ord;
            end if;

            if v_unit_index = any(v_seen_indexes) then
                raise exception 'unit_index duplicado no combo %: %',
                    coalesce(p_combo_name, p_combo_id::text), v_unit_index;
            end if;
            v_seen_indexes := array_append(v_seen_indexes, v_unit_index);
        end if;

        select id, name, price, stock, status, organization_id, menu_kind
        into v_child
        from public.products
        where id = v_slot.component_product_id
          and organization_id = p_org_id
        for update;

        if not found then
            raise exception 'Componente não encontrado: %', v_slot.component_product_id;
        end if;

        if v_child.organization_id <> p_org_id
           or v_child.organization_id <> v_slot.organization_id then
            raise exception 'Tenant inválido no componente %', v_child.name;
        end if;

        if v_child.status <> 'active' then
            raise exception 'Componente inativo: %', v_child.name;
        end if;

        if v_child.menu_kind = 'combo' then
            raise exception 'Componente não pode ser combo: %', v_child.name;
        end if;

        if v_mode = 'choice' and v_child.menu_kind <> 'assembled' then
            raise exception 'Em combo choice, o componente deve ser assembled: %', v_child.name;
        end if;

        v_options := coalesce(v_component->'options', '[]'::jsonb);
        if jsonb_typeof(v_options) <> 'array' then
            v_options := '[]'::jsonb;
        end if;

        if not v_slot.allow_configuration then
            if jsonb_array_length(v_options) > 0 then
                raise exception 'Slot % não permite options (allow_configuration=false)', v_comp_id;
            end if;
            v_unit_addons := 0;
        else
            v_unit_addons := public.calculate_product_paid_option_addons(
                p_org_id,
                v_slot.component_product_id,
                v_options
            );

            if v_mode = 'fixed' then
                -- 026: addons * slot.quantity
                v_addons := v_addons + (v_unit_addons * v_slot.quantity);
            else
                -- choice: 1 unidade; NÃO multiplica por slot.quantity
                v_addons := v_addons + v_unit_addons;
            end if;

            for v_option in select * from jsonb_array_elements(v_options)
            loop
                v_oid := (v_option->>'option_id');
                v_opt_unit_qty := coalesce((v_option->>'quantity')::integer, 1);
                if v_oid is null or v_opt_unit_qty is null or v_opt_unit_qty <= 0 then
                    raise exception 'Opção inválida no componente %', v_child.name;
                end if;

                v_option_need := jsonb_set(
                    v_option_need,
                    array[v_oid],
                    to_jsonb(
                        coalesce((v_option_need->>v_oid)::integer, 0)
                        + (v_opt_unit_qty * v_child_qty)
                    ),
                    true
                );
            end loop;
        end if;

        v_pid := v_slot.component_product_id::text;
        v_product_need := jsonb_set(
            v_product_need,
            array[v_pid],
            to_jsonb(
                coalesce((v_product_need->>v_pid)::integer, 0) + v_child_qty
            ),
            true
        );

        v_label := coalesce(
            nullif(trim(coalesce(v_component->>'label', '')), ''),
            nullif(trim(coalesce(v_slot.display_name, '')), ''),
            v_child.name
        );

        v_units := v_units || jsonb_build_array(
            jsonb_build_object(
                'component_id', v_comp_id,
                'product_id', v_slot.component_product_id,
                'product_name', v_child.name,
                'unit_index', v_unit_index,
                'label', v_label,
                'child_qty_per_combo', v_child_qty,
                'allow_configuration', v_slot.allow_configuration,
                'options', v_options
            )
        );
    end loop;

    -- Estoque agregado: need_por_combo * p_combo_qty
    for v_pid, v_need in
        select key, (value #>> '{}')::integer
        from jsonb_each(v_product_need)
    loop
        select stock, name into v_stock, v_prod_name
        from public.products
        where id = v_pid::uuid and organization_id = p_org_id;

        if v_stock < (v_need * p_combo_qty) then
            raise exception 'Estoque insuficiente para componente: % (disponível: %)',
                v_prod_name, v_stock;
        end if;
    end loop;

    for v_oid, v_need in
        select key, (value #>> '{}')::integer
        from jsonb_each(v_option_need)
    loop
        select stock_control, stock, name, active
        into v_option_record
        from public.options
        where id = v_oid::uuid and organization_id = p_org_id;

        if not found then
            raise exception 'Opção não encontrada no componente: %', v_oid;
        end if;

        if v_option_record.stock_control
           and v_option_record.stock < (v_need * p_combo_qty) then
            raise exception 'Estoque insuficiente para opção: % (disponível: %)',
                v_option_record.name, v_option_record.stock;
        end if;
    end loop;

    return jsonb_build_object(
        'addons', v_addons,
        'units', v_units
    );
end;
$$;

comment on function public.resolve_combo_sale_units(uuid, uuid, text, numeric, text, integer, integer, jsonb, integer) is
    'Resolve unidades de venda de combo (fixed|choice): valida slots, addons, estoque agregado * p_combo_qty.';

grant execute on function public.resolve_combo_sale_units(uuid, uuid, text, numeric, text, integer, integer, jsonb, integer)
    to authenticated;


-- =============================================================================
-- 4. build_kitchen_item_summary — COPO N multilinha
-- =============================================================================

create or replace function public.build_kitchen_item_summary(p_sale_item_id uuid)
returns text
language sql
stable
as $$
    with parent_options as (
        select string_agg(
            case
                when sio.quantity > 1 then '+ ' || sio.quantity::text || 'x ' || sio.option_name
                else '+ ' || sio.option_name
            end,
            E'\n' order by sio.created_at
        ) as summary
        from public.sale_item_options sio
        where sio.sale_item_id = p_sale_item_id
    ),
    child_blocks as (
        select string_agg(
            case
                when si.combo_unit_index is not null then
                    -- Unidade = COPO N; nome principal = produto assembled real
                    -- (nunca usar component_label "Copo 1" como nome do produto)
                    'COPO ' || si.combo_unit_index::text || ' — ' || si.product_name
                else
                    coalesce(nullif(trim(si.component_label), ''), si.product_name)
            end
            || coalesce(
                E'\n' || (
                    select string_agg(
                        case
                            when sio.quantity > 1 then '+ ' || sio.quantity::text || 'x ' || sio.option_name
                            else '+ ' || sio.option_name
                        end,
                        E'\n' order by sio.created_at
                    )
                    from public.sale_item_options sio
                    where sio.sale_item_id = si.id
                ),
                ''
            ),
            E'\n'
            order by si.combo_unit_index nulls last, si.created_at
        ) as summary
        from public.sale_items si
        where si.parent_sale_item_id = p_sale_item_id
    )
    select nullif(
        trim(both E'\n' from concat_ws(
            E'\n',
            (select summary from parent_options),
            (select summary from child_blocks)
        )),
        ''
    );
$$;

comment on function public.build_kitchen_item_summary(uuid) is
    'Resumo KDS: filhos com combo_unit_index como COPO N — product_name + opções (+ Name). Sem UUIDs.';


-- =============================================================================
-- 5. finalize_sale — usa resolve_combo_sale_units (fixed = 026; choice = unidades)
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
    v_unit jsonb;
    v_product record;
    v_child record;
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
    v_resolved jsonb;
    v_addons numeric(12,2);
    v_comp_qty integer;
    v_comp_id uuid;
    v_comp_label text;
    v_unit_index integer;
    v_child_qty_per_combo integer;
    v_mode text;
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

        if v_quantity is null or v_quantity <= 0 then
            raise exception 'Quantidade inválida para o produto %', v_product_id;
        end if;

        select id, name, price, stock, status, organization_id, menu_kind,
               combo_selection_mode, combo_min_choices, combo_max_choices
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

            if jsonb_array_length(coalesce(v_item->'options', '[]'::jsonb)) > 0 then
                raise exception 'Combo % não aceita options no item pai', v_product.name;
            end if;

            v_mode := coalesce(nullif(trim(v_product.combo_selection_mode), ''), 'fixed');

            v_resolved := public.resolve_combo_sale_units(
                v_org_id,
                v_product.id,
                v_product.name,
                v_product.price,
                v_mode,
                v_product.combo_min_choices,
                v_product.combo_max_choices,
                coalesce(v_item->'components', '[]'::jsonb),
                v_quantity
            );

            v_addons := coalesce((v_resolved->>'addons')::numeric, 0);
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

        select id, name, price, stock, menu_kind,
               combo_selection_mode, combo_min_choices, combo_max_choices
        into v_product
        from public.products
        where id = v_product_id and organization_id = v_org_id
        for update;

        if v_has_components then
            v_mode := coalesce(nullif(trim(v_product.combo_selection_mode), ''), 'fixed');

            v_resolved := public.resolve_combo_sale_units(
                v_org_id,
                v_product.id,
                v_product.name,
                v_product.price,
                v_mode,
                v_product.combo_min_choices,
                v_product.combo_max_choices,
                coalesce(v_item->'components', '[]'::jsonb),
                v_quantity
            );

            v_addons := coalesce((v_resolved->>'addons')::numeric, 0);
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
            for v_unit in
                select * from jsonb_array_elements(coalesce(v_resolved->'units', '[]'::jsonb))
            loop
                v_comp_id := (v_unit->>'component_id')::uuid;
                v_child_qty_per_combo := (v_unit->>'child_qty_per_combo')::integer;
                v_comp_qty := v_child_qty_per_combo * v_quantity;
                v_comp_label := nullif(trim(coalesce(v_unit->>'label', '')), '');
                v_unit_index := (v_unit->>'unit_index')::integer;

                select id, name, stock
                into v_child
                from public.products
                where id = (v_unit->>'product_id')::uuid and organization_id = v_org_id
                for update;

                v_previous_stock := v_child.stock;

                insert into public.sale_items (
                    sale_id, product_id, product_name, quantity,
                    unit_price, subtotal,
                    parent_sale_item_id, combo_component_id, component_label,
                    combo_unit_index
                ) values (
                    v_sale_id, (v_unit->>'product_id')::uuid, v_child.name, v_comp_qty,
                    0, 0,
                    v_sale_item_id, v_comp_id, v_comp_label,
                    v_unit_index
                )
                returning id into v_child_sale_item_id;

                update public.products
                set stock = stock - v_comp_qty,
                    updated_at = now()
                where id = (v_unit->>'product_id')::uuid;

                insert into public.stock_movements (
                    product_id, organization_id, movement_type, quantity,
                    previous_stock, new_stock, notes, reference_id
                ) values (
                    (v_unit->>'product_id')::uuid, v_org_id, 'sale', v_comp_qty,
                    v_previous_stock, v_previous_stock - v_comp_qty,
                    'Venda combo PDV #' || v_sale_number, v_sale_id
                );

                if coalesce((v_unit->>'allow_configuration')::boolean, true) then
                    for v_option in
                        select * from jsonb_array_elements(
                            coalesce(v_unit->'options', '[]'::jsonb)
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
    'Finaliza venda PDV. Combo fixed/choice via resolve_combo_sale_units; filhos com combo_unit_index.';

grant execute on function public.finalize_sale(jsonb, text, numeric, numeric, text, uuid) to authenticated;


-- =============================================================================
-- 6. get_public_combo_definition — expõe selection_mode / min / max
-- =============================================================================

create or replace function public.get_public_combo_definition(
    p_store_slug text,
    p_combo_product_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_store record;
    v_product record;
    v_result jsonb;
begin
    select id, organization_id, enabled, published_at, slug
    into v_store
    from public.digital_stores
    where lower(slug) = lower(trim(p_store_slug))
      and enabled = true
      and published_at is not null;

    if not found then
        raise exception 'Loja digital não encontrada ou não publicada';
    end if;

    select id, name, price, status, menu_kind, organization_id, image_url,
           combo_selection_mode, combo_min_choices, combo_max_choices
    into v_product
    from public.products
    where id = p_combo_product_id
      and organization_id = v_store.organization_id;

    if not found then
        raise exception 'Produto não encontrado';
    end if;

    if v_product.menu_kind <> 'combo' then
        raise exception 'Produto não é combo';
    end if;

    if v_product.status <> 'active' then
        raise exception 'Produto inativo';
    end if;

    select jsonb_build_object(
        'product', jsonb_build_object(
            'id', v_product.id,
            'name', v_product.name,
            'price', v_product.price,
            'status', v_product.status,
            'menu_kind', v_product.menu_kind,
            'image_url', v_product.image_url,
            'combo_selection_mode', coalesce(v_product.combo_selection_mode, 'fixed'),
            'combo_min_choices', v_product.combo_min_choices,
            'combo_max_choices', v_product.combo_max_choices
        ),
        'components', coalesce((
            select jsonb_agg(
                jsonb_build_object(
                    'id', pcc.id,
                    'combo_product_id', pcc.combo_product_id,
                    'component_product_id', pcc.component_product_id,
                    'display_name', pcc.display_name,
                    'quantity', pcc.quantity,
                    'sort_order', pcc.sort_order,
                    'allow_configuration', pcc.allow_configuration,
                    'active', pcc.active,
                    'component_product', jsonb_build_object(
                        'id', cp.id,
                        'name', cp.name,
                        'price', cp.price,
                        'status', cp.status,
                        'image_url', cp.image_url,
                        'menu_kind', cp.menu_kind
                    ),
                    'engine_node', (
                        select jsonb_build_object(
                            'productId', cp.id,
                            'productName', cp.name,
                            'basePrice', cp.price,
                            'status', cp.status,
                            'groups', coalesce((
                                select jsonb_agg(
                                    jsonb_build_object(
                                        'id', og.id,
                                        'name', og.name,
                                        'description', og.description,
                                        'sortOrder', pog.sort_order,
                                        'type', coalesce(og.group_type, 'optional'),
                                        'selectionType', og.selection_type,
                                        'required', og.required,
                                        'active', true,
                                        'minSelection', og.min_selection,
                                        'maxSelection', og.max_selection,
                                        'maxFree', coalesce(og.max_free, 0),
                                        'allowsRepeat', coalesce(og.allow_repeat, false),
                                        'allowsQuantity', coalesce(og.allow_quantity, false),
                                        'hidden', false,
                                        'optionIds', coalesce((
                                            select jsonb_agg(o.id order by o.sort_order, o.name)
                                            from public.options o
                                            where o.group_id = og.id
                                              and o.active = true
                                              and o.organization_id = v_store.organization_id
                                        ), '[]'::jsonb)
                                    )
                                    order by pog.sort_order, og.name
                                )
                                from public.product_option_groups pog
                                join public.option_groups og on og.id = pog.group_id
                                where pog.product_id = cp.id
                                  and og.organization_id = v_store.organization_id
                                  and coalesce(og.hidden, false) = false
                            ), '[]'::jsonb),
                            'optionsByGroupId', coalesce((
                                select jsonb_object_agg(
                                    pog.group_id::text,
                                    (
                                        select coalesce(jsonb_agg(
                                            jsonb_build_object(
                                                'id', o.id,
                                                'groupId', o.group_id,
                                                'name', o.name,
                                                'description', o.description,
                                                'imageUrl', o.image_url,
                                                'price', o.price,
                                                'stockControl', o.stock_control,
                                                'sortOrder', o.sort_order,
                                                'active', o.active,
                                                'premium', coalesce(o.is_featured, false),
                                                'weight', coalesce(o.weight, 0)
                                            )
                                            order by o.sort_order, o.name
                                        ), '[]'::jsonb)
                                        from public.options o
                                        where o.group_id = pog.group_id
                                          and o.active = true
                                          and o.organization_id = v_store.organization_id
                                    )
                                )
                                from public.product_option_groups pog
                                join public.option_groups og on og.id = pog.group_id
                                where pog.product_id = cp.id
                                  and og.organization_id = v_store.organization_id
                                  and coalesce(og.hidden, false) = false
                            ), '{}'::jsonb)
                        )
                    )
                )
                order by pcc.sort_order
            )
            from public.product_combo_components pcc
            join public.products cp on cp.id = pcc.component_product_id
            where pcc.combo_product_id = v_product.id
              and pcc.organization_id = v_store.organization_id
              and pcc.active = true
              and cp.status = 'active'
              and cp.organization_id = v_store.organization_id
        ), '[]'::jsonb)
    )
    into v_result;

    return v_result;
end;
$$;

comment on function public.get_public_combo_definition(text, uuid) is
    'Definição pública de combo (slots + engine_node + selection_mode/min/max). Sem stock/sku/org.';

grant execute on function public.get_public_combo_definition(text, uuid) to anon, authenticated;


-- =============================================================================
-- 7. place_public_digital_order — mesma resolução de combo
-- =============================================================================

create or replace function public.place_public_digital_order(
    p_store_slug text,
    p_items jsonb,
    p_payment_method text,
    p_payment_amount numeric,
    p_discount numeric default 0,
    p_observation text default null,
    p_context jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_store record;
    v_item jsonb;
    v_option jsonb;
    v_unit jsonb;
    v_product record;
    v_child record;
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
    v_org_id uuid;
    v_minimum_order numeric(10,2);
    v_observation text;
    v_has_components boolean;
    v_resolved jsonb;
    v_addons numeric(12,2);
    v_comp_qty integer;
    v_comp_id uuid;
    v_comp_label text;
    v_unit_index integer;
    v_child_qty_per_combo integer;
    v_mode text;
begin
    select *
    into v_store
    from public.digital_stores ds
    where lower(ds.slug) = lower(trim(p_store_slug))
      and ds.enabled = true
      and ds.published_at is not null;

    if not found then
        raise exception 'Loja digital não encontrada ou não publicada';
    end if;

    v_org_id := v_store.organization_id;
    v_minimum_order := coalesce((v_store.settings->>'minimumOrder')::numeric, 0);
    v_observation := nullif(trim(coalesce(p_observation, '')), '');

    if p_items is null or jsonb_array_length(p_items) = 0 then
        raise exception 'O pedido deve conter ao menos um item';
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

    -- =========================================================================
    -- PASS 1: validação + subtotal
    -- =========================================================================
    for v_item in select * from jsonb_array_elements(p_items)
    loop
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::integer;
        v_has_components := jsonb_typeof(v_item->'components') = 'array'
            and jsonb_array_length(coalesce(v_item->'components', '[]'::jsonb)) > 0;

        if v_quantity is null or v_quantity <= 0 then
            raise exception 'Quantidade inválida para o produto %', v_product_id;
        end if;

        select id, name, price, stock, status, organization_id, menu_kind,
               combo_selection_mode, combo_min_choices, combo_max_choices
        into v_product
        from public.products
        where id = v_product_id
          and organization_id = v_org_id
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

            if jsonb_array_length(coalesce(v_item->'options', '[]'::jsonb)) > 0 then
                raise exception 'Combo % não aceita options no item pai', v_product.name;
            end if;

            v_mode := coalesce(nullif(trim(v_product.combo_selection_mode), ''), 'fixed');

            v_resolved := public.resolve_combo_sale_units(
                v_org_id,
                v_product.id,
                v_product.name,
                v_product.price,
                v_mode,
                v_product.combo_min_choices,
                v_product.combo_max_choices,
                coalesce(v_item->'components', '[]'::jsonb),
                v_quantity
            );

            v_addons := coalesce((v_resolved->>'addons')::numeric, 0);
            v_unit_price := v_product.price + v_addons;
        else
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
        raise exception 'Desconto (%) superior ao subtotal (%)', v_discount, v_subtotal;
    end if;

    v_total := v_subtotal - v_discount;

    if v_minimum_order > 0 and v_subtotal < v_minimum_order then
        raise exception 'Pedido mínimo de R$ %', v_minimum_order;
    end if;

    if p_payment_amount < v_total then
        raise exception 'Valor pago (%) inferior ao total (%)', p_payment_amount, v_total;
    end if;

    insert into public.sales (
        subtotal, discount, total, status, observation, customer_id, organization_id
    ) values (
        v_subtotal, v_discount, v_total, 'completed',
        v_observation, null, v_org_id
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

        select id, name, price, stock, menu_kind,
               combo_selection_mode, combo_min_choices, combo_max_choices
        into v_product
        from public.products
        where id = v_product_id and organization_id = v_org_id
        for update;

        if v_has_components then
            v_mode := coalesce(nullif(trim(v_product.combo_selection_mode), ''), 'fixed');

            v_resolved := public.resolve_combo_sale_units(
                v_org_id,
                v_product.id,
                v_product.name,
                v_product.price,
                v_mode,
                v_product.combo_min_choices,
                v_product.combo_max_choices,
                coalesce(v_item->'components', '[]'::jsonb),
                v_quantity
            );

            v_addons := coalesce((v_resolved->>'addons')::numeric, 0);
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
            for v_unit in
                select * from jsonb_array_elements(coalesce(v_resolved->'units', '[]'::jsonb))
            loop
                v_comp_id := (v_unit->>'component_id')::uuid;
                v_child_qty_per_combo := (v_unit->>'child_qty_per_combo')::integer;
                v_comp_qty := v_child_qty_per_combo * v_quantity;
                v_comp_label := nullif(trim(coalesce(v_unit->>'label', '')), '');
                v_unit_index := (v_unit->>'unit_index')::integer;

                select id, name, stock
                into v_child
                from public.products
                where id = (v_unit->>'product_id')::uuid and organization_id = v_org_id
                for update;

                v_previous_stock := v_child.stock;

                insert into public.sale_items (
                    sale_id, product_id, product_name, quantity,
                    unit_price, subtotal,
                    parent_sale_item_id, combo_component_id, component_label,
                    combo_unit_index
                ) values (
                    v_sale_id, (v_unit->>'product_id')::uuid, v_child.name, v_comp_qty,
                    0, 0,
                    v_sale_item_id, v_comp_id, v_comp_label,
                    v_unit_index
                )
                returning id into v_child_sale_item_id;

                update public.products
                set stock = stock - v_comp_qty,
                    updated_at = now()
                where id = (v_unit->>'product_id')::uuid;

                insert into public.stock_movements (
                    product_id, organization_id, movement_type, quantity,
                    previous_stock, new_stock, notes, reference_id
                ) values (
                    (v_unit->>'product_id')::uuid, v_org_id, 'sale', v_comp_qty,
                    v_previous_stock, v_previous_stock - v_comp_qty,
                    'Pedido Digital combo #' || v_sale_number, v_sale_id
                );

                if coalesce((v_unit->>'allow_configuration')::boolean, true) then
                    for v_option in
                        select * from jsonb_array_elements(
                            coalesce(v_unit->'options', '[]'::jsonb)
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
                    v_sale_item_id, v_option_record.id, v_option_record.name,
                    v_option_record.price, v_option_total_qty, v_option_subtotal
                );

                if v_option_record.stock_control then
                    update public.options
                    set stock = stock - v_option_total_qty,
                        updated_at = now()
                    where id = v_option_record.id;
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
                'Pedido Digital #' || v_sale_number, v_sale_id
            );
        end if;
    end loop;

    insert into public.sale_payments (sale_id, payment_method, amount)
    values (v_sale_id, p_payment_method, p_payment_amount);

    insert into public.financial_transactions (
        type, category, description, amount,
        transaction_date, source, reference_id, notes, organization_id
    ) values (
        'income', 'sale', 'Pedido Digital #' || v_sale_number, v_total,
        current_date, 'digital_ordering', v_sale_id,
        v_observation, v_org_id
    );

    perform public.generate_kitchen_ticket_from_sale(v_sale_id);

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
        'organization_id', v_org_id,
        'store_slug', v_store.slug,
        'estimated_minutes', coalesce((v_store.settings->>'averagePrepMinutes')::integer, 20)
    );
end;
$$;

comment on function public.place_public_digital_order(text, jsonb, text, numeric, numeric, text, jsonb) is
    'Checkout digital. Combo fixed/choice via resolve_combo_sale_units; filhos com combo_unit_index.';

grant execute on function public.place_public_digital_order(text, jsonb, text, numeric, numeric, text, jsonb)
    to anon, authenticated;


-- =============================================================================
-- FIM 028 — PROPOSTA — NÃO APLICAR AUTOMATICAMENTE
-- =============================================================================
