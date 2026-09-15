-- ============================================================
-- 015: Opções vendidas por item (sale_item_options)
-- ============================================================
-- Persiste snapshot das opções escolhidas no PDV, atualiza estoque
-- das opções com stock_control e evolui finalize_sale.
-- Depende de:
--   - public.sale_items          (migration 002)
--   - public.options             (migration 012)
--   - public.finalize_sale       (migration 014)
-- ============================================================

-- ============================================================
-- 1. TABELA: sale_item_options
-- ============================================================

create table if not exists public.sale_item_options (
    id uuid primary key default gen_random_uuid(),

    sale_item_id uuid not null
        references public.sale_items(id) on delete cascade,

    option_id uuid not null
        references public.options(id),

    option_name text not null,

    price numeric(10, 2) not null
        constraint sale_item_options_price_check
        check (price >= 0),

    quantity integer not null
        constraint sale_item_options_quantity_check
        check (quantity > 0),

    subtotal numeric(10, 2) not null
        constraint sale_item_options_subtotal_check
        check (subtotal >= 0),

    created_at timestamptz not null default now()
);

comment on table public.sale_item_options is
    'Snapshot das opções selecionadas em cada item de venda do PDV.';

comment on column public.sale_item_options.sale_item_id is
    'Item de venda ao qual a opção pertence.';

comment on column public.sale_item_options.option_id is
    'Referência da opção vendida.';

comment on column public.sale_item_options.option_name is
    'Nome da opção no momento da venda.';

comment on column public.sale_item_options.price is
    'Preço unitário adicional da opção no momento da venda.';

comment on column public.sale_item_options.quantity is
    'Quantidade total vendida desta opção no item.';

comment on column public.sale_item_options.subtotal is
    'Subtotal da opção (price * quantity).';

-- ============================================================
-- 2. ÍNDICES
-- ============================================================

create index if not exists idx_sale_item_options_sale_item_id
    on public.sale_item_options(sale_item_id);

create index if not exists idx_sale_item_options_option_id
    on public.sale_item_options(option_id);

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.sale_item_options enable row level security;

drop policy if exists sale_item_options_select on public.sale_item_options;

create policy sale_item_options_select on public.sale_item_options
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.sale_items si
            join public.sales s on s.id = si.sale_id
            where si.id = sale_item_options.sale_item_id
              and s.organization_id = public.get_my_organization_id()
        )
    );

-- ============================================================
-- 4. finalize_sale com opções
-- ============================================================

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
    v_customer_name text;
    v_finance_description text;
    v_org_id uuid;
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
        select name
        into v_customer_name
        from public.customers
        where id = p_customer_id
          and organization_id = v_org_id;

        if not found then
            raise exception 'Cliente não encontrado';
        end if;
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

            if v_option_unit_qty is null or v_option_unit_qty <= 0 then
                raise exception 'Quantidade inválida para opção no produto %', v_product.name;
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
        raise exception 'Desconto (%) superior ao subtotal da venda (%)', v_discount, v_subtotal;
    end if;

    v_total := v_subtotal - v_discount;

    if p_payment_amount < v_total then
        raise exception 'Valor pago (%) inferior ao total da venda (%)', p_payment_amount, v_total;
    end if;

    insert into public.sales (
        subtotal, discount, total, status, observation, customer_id, organization_id
    )
    values (
        v_subtotal, v_discount, v_total, 'completed',
        nullif(trim(p_observation), ''), p_customer_id, v_org_id
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
                sale_item_id,
                option_id,
                option_name,
                price,
                quantity,
                subtotal
            ) values (
                v_sale_item_id,
                v_option_record.id,
                v_option_record.name,
                v_option_record.price,
                v_option_total_qty,
                v_option_subtotal
            );

            if v_option_record.stock_control then
                v_previous_option_stock := v_option_record.stock;

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
            'Venda PDV #' || v_sale_number, v_sale_id
        );
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

grant execute on function public.finalize_sale(jsonb, text, numeric, numeric, text, uuid) to authenticated;
