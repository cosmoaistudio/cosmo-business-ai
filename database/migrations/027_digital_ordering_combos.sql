-- =============================================================================
-- Migration 027: Combos no Pedido Digital (place_public_digital_order)
-- =============================================================================
-- Cosmo Business AI
--
-- STATUS: PROPOSTA PARA APROVAÇÃO — NÃO APLICAR AUTOMATICAMENTE.
-- Depende de: 023/024/025 (digital) + 026 (product combos + finalize_sale).
--
-- Propósito:
--   Espelhar as regras de combo da 026 em place_public_digital_order:
--   components[], validação de slots, preço no servidor, estoque dos filhos,
--   sale_items hierárquicos (parent_sale_item_id / combo_component_id).
--
-- NÃO altera: finalize_sale, schema de product_combo_components, autenticação.
-- =============================================================================


-- =============================================================================
-- 1. get_public_combo_definition — slots + grupos do filho (anon-safe)
-- =============================================================================
-- Contrato público mínimo: IDs necessários para components[]/options[] no checkout.
-- NÃO inclui: organization_id, stock, sku.
-- Filtra: slots active, filhos active + mesma org, grupos !hidden (groups E optionsByGroupId).
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

    select id, name, price, status, menu_kind, organization_id, image_url
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
            'image_url', v_product.image_url
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
    'Definição pública de combo (slots + engine_node). Sem stock/sku/organization_id; só grupos !hidden.';

grant execute on function public.get_public_combo_definition(text, uuid) to anon, authenticated;


-- =============================================================================
-- 2. place_public_digital_order — components[] (espelha finalize_sale 026)
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
    v_org_id uuid;
    v_minimum_order numeric(10,2);
    v_observation text;
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
    -- PASS 1: validação + subtotal (preço confiável no servidor para combo)
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
                    v_addons := v_addons + (
                        public.calculate_product_paid_option_addons(
                            v_org_id,
                            v_slot.component_product_id,
                            coalesce(v_component->'options', '[]'::jsonb)
                        ) * v_slot.quantity
                    );

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

            -- Ignora unit_price do cliente
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
                    'Pedido Digital combo #' || v_sale_number, v_sale_id
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
    'Checkout digital. Combo: valida slots, recalcula preço, baixa estoque dos filhos (026).';

grant execute on function public.place_public_digital_order(text, jsonb, text, numeric, numeric, text, jsonb)
    to anon, authenticated;
