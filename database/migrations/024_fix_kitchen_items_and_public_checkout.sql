-- ============================================================
-- 024: Corrige kitchen_ticket_items + checkout público anon
-- ============================================================
-- Problema 1: trigger em sales dispara antes de sale_items existirem,
--             ticket criado vazio e generate retorna cedo.
-- Problema 2: set_row_organization_id bloqueia financial_transactions
--             em RPC anon (place_public_digital_order).
-- Depende de: 022, 023
-- ============================================================

-- ============================================================
-- 1. generate_kitchen_ticket_from_sale — sincroniza itens
-- ============================================================

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
        loop
            insert into public.kitchen_ticket_items (
                ticket_id,
                sale_item_id,
                product_id,
                product_name,
                quantity,
                summary,
                status
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
        organization_id,
        sale_id,
        sale_number,
        customer_name,
        status,
        priority,
        ticket_type,
        notes
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
    loop
        insert into public.kitchen_ticket_items (
            ticket_id,
            sale_item_id,
            product_id,
            product_name,
            quantity,
            summary,
            status
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
    'Cria ou sincroniza kitchen_ticket + kitchen_ticket_items para venda concluída.';

-- ============================================================
-- 2. Trigger em sale_items (após itens existirem)
-- ============================================================

create or replace function public.kitchen_ticket_after_sale_item_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.generate_kitchen_ticket_from_sale(new.sale_id);
    return new;
end;
$$;

comment on function public.kitchen_ticket_after_sale_item_insert() is
    'Gera/sincroniza ticket KDS após inserção de sale_items.';

drop trigger if exists trg_kitchen_ticket_after_sale_insert on public.sales;

drop trigger if exists trg_kitchen_ticket_after_sale_item_insert on public.sale_items;
create trigger trg_kitchen_ticket_after_sale_item_insert
    after insert on public.sale_items
    for each row
    execute function public.kitchen_ticket_after_sale_item_insert();

comment on trigger trg_kitchen_ticket_after_sale_item_insert on public.sale_items is
    'Gera ticket KDS quando sale_items são inseridos (após finalize_sale / checkout público).';

-- ============================================================
-- 3. Backfill — tickets sem itens
-- ============================================================

do $$
declare
    v_sale_id uuid;
begin
    for v_sale_id in
        select distinct kt.sale_id
        from public.kitchen_tickets kt
        where not exists (
            select 1
            from public.kitchen_ticket_items kti
            where kti.ticket_id = kt.id
        )
    loop
        perform public.generate_kitchen_ticket_from_sale(v_sale_id);
    end loop;
end;
$$;

-- ============================================================
-- 4. set_row_organization_id — permitir RPC anon com org explícita
-- ============================================================

create or replace function public.set_row_organization_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_org_id uuid;
begin
    -- Checkout público e RPCs security definer definem organization_id
    -- sem sessão autenticada (auth.uid() is null).
    if new.organization_id is not null and auth.uid() is null then
        return new;
    end if;

    v_org_id := public.get_my_organization_id();

    if v_org_id is null then
        raise exception 'Usuário sem organização vinculada';
    end if;

    if new.organization_id is null then
        new.organization_id := v_org_id;
    elsif new.organization_id <> v_org_id then
        raise exception 'Acesso negado à organização';
    end if;

    return new;
end;
$$;

comment on function public.set_row_organization_id() is
    'Define organization_id em INSERT. Permite org explícita em RPC anon (checkout público).';

-- ============================================================
-- 5. place_public_digital_order — garantir sync KDS ao final
-- ============================================================

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
    v_product record;
    v_option_record record;
    v_sale_id uuid;
    v_sale_item_id uuid;
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
    v_previous_option_stock integer;
    v_finance_description text;
    v_org_id uuid;
    v_minimum_order numeric(10,2);
    v_observation text;
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

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::integer;

        if v_quantity is null or v_quantity <= 0 then
            raise exception 'Quantidade inválida para o produto %', v_product_id;
        end if;

        select id, name, price, stock, status, organization_id
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

        if v_product.stock < v_quantity then
            raise exception 'Estoque insuficiente para: % (disponível: %)', v_product.name, v_product.stock;
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

            if v_option_id is null then
                raise exception 'Opção inválida no produto %', v_product.name;
            end if;

            v_option_total_qty := v_option_unit_qty * v_quantity;

            select id, name, price, stock_control, stock, active, organization_id
            into v_option_record
            from public.options
            where id = v_option_id
              and organization_id = v_org_id;

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

        v_item_subtotal := v_unit_price * v_quantity;
        v_subtotal := v_subtotal + v_item_subtotal;
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
    )
    values (
        v_subtotal, v_discount, v_total, 'completed',
        v_observation, null, v_org_id
    )
    returning id, sale_number into v_sale_id, v_sale_number;

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::integer;

        select id, name, price, stock
        into v_product
        from public.products
        where id = v_product_id
          and organization_id = v_org_id
        for update;

        v_previous_stock := v_product.stock;
        v_unit_price := coalesce((v_item->>'unit_price')::numeric, v_product.price);
        v_item_subtotal := v_unit_price * v_quantity;

        insert into public.sale_items (
            sale_id, product_id, product_name, quantity, unit_price, subtotal
        ) values (
            v_sale_id, v_product_id, v_product.name,
            v_quantity, v_unit_price, v_item_subtotal
        )
        returning id into v_sale_item_id;

        for v_option in
            select * from jsonb_array_elements(coalesce(v_item->'options', '[]'::jsonb))
        loop
            v_option_id := (v_option->>'option_id')::uuid;
            v_option_unit_qty := coalesce((v_option->>'quantity')::integer, 1);
            v_option_total_qty := v_option_unit_qty * v_quantity;

            select id, name, price, stock_control, stock
            into v_option_record
            from public.options
            where id = v_option_id
              and organization_id = v_org_id
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

grant execute on function public.place_public_digital_order(text, jsonb, text, numeric, numeric, text, jsonb) to anon, authenticated;
