-- =============================================================================
-- Migration 032: Cobrança promocional server-side do Cardápio Digital
-- =============================================================================
-- Cosmo Business AI
--
-- Pré-requisito: 031_product_digital_promo (promotional_price / featured).
--
-- Baseada na RPC canônica de 028. NÃO reconstrói o checkout do zero.
-- NÃO altera finalize_sale, PDV, resolve_combo_sale_units, RLS, triggers.
-- NÃO lê catalog_snapshot para preço.
--
-- unit_price enviado pelo cliente continua no JSON (compatibilidade) e é IGNORADO.
-- p_discount e frete permanecem fora desta fase (3B).
--
-- Fonte de verdade: public.products no FOR UPDATE.
--   base digital = resolve_digital_menu_base_price(price, promotional_price)
--   simple/assembled: base + calculate_product_paid_option_addons
--   combo pai: base + addons de resolve_combo_sale_units
--   filhos do combo: unit_price = 0 (promotional_price do filho NÃO entra)
-- =============================================================================

create or replace function public.resolve_digital_menu_base_price(
    p_price numeric,
    p_promotional_price numeric
)
returns numeric
language sql
immutable
as $$
    select case
        when p_promotional_price is not null
         and p_promotional_price > 0
         and p_price is not null
         and p_promotional_price < p_price
        then p_promotional_price
        else coalesce(p_price, 0)
    end;
$$;

comment on function public.resolve_digital_menu_base_price(numeric, numeric) is
    'Base do Cardápio Digital. Não usar em finalize_sale nem no PDV.';


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
    v_base numeric(10,2);
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
    -- p_discount / frete: fora da 3B. unit_price do cliente é ignorado.
    -- Preço vem de products (não de catalog_snapshot).
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

        select id, name, price, promotional_price, stock, status, organization_id, menu_kind,
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

        v_base := public.resolve_digital_menu_base_price(
            v_product.price,
            v_product.promotional_price
        );

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
                v_base,
                v_mode,
                v_product.combo_min_choices,
                v_product.combo_max_choices,
                coalesce(v_item->'components', '[]'::jsonb),
                v_quantity
            );

            v_addons := coalesce((v_resolved->>'addons')::numeric, 0);
            v_unit_price := v_base + v_addons;
        else
            if v_product.stock < v_quantity then
                raise exception 'Estoque insuficiente para: % (disponível: %)',
                    v_product.name, v_product.stock;
            end if;

            v_addons := public.calculate_product_paid_option_addons(
                v_org_id,
                v_product.id,
                coalesce(v_item->'options', '[]'::jsonb)
            );
            v_unit_price := v_base + v_addons;

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

        select id, name, price, promotional_price, stock, menu_kind,
               combo_selection_mode, combo_min_choices, combo_max_choices
        into v_product
        from public.products
        where id = v_product_id and organization_id = v_org_id
        for update;

        v_base := public.resolve_digital_menu_base_price(
            v_product.price,
            v_product.promotional_price
        );

        if v_has_components then
            v_mode := coalesce(nullif(trim(v_product.combo_selection_mode), ''), 'fixed');

            v_resolved := public.resolve_combo_sale_units(
                v_org_id,
                v_product.id,
                v_product.name,
                v_base,
                v_mode,
                v_product.combo_min_choices,
                v_product.combo_max_choices,
                coalesce(v_item->'components', '[]'::jsonb),
                v_quantity
            );

            v_addons := coalesce((v_resolved->>'addons')::numeric, 0);
            v_unit_price := v_base + v_addons;
        else
            v_addons := public.calculate_product_paid_option_addons(
                v_org_id,
                v_product.id,
                coalesce(v_item->'options', '[]'::jsonb)
            );
            v_unit_price := v_base + v_addons;
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
    'Checkout digital. Preço de products (promo válida ou price); ignora unit_price do cliente. Combo via resolve_combo_sale_units. p_discount/frete fora da 3B.';

grant execute on function public.place_public_digital_order(text, jsonb, text, numeric, numeric, text, jsonb)
    to anon, authenticated;
