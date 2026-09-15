-- Estoque: movimentações, estoque mínimo e alertas

alter table public.products
    add column if not exists min_stock integer not null default 0 check (min_stock >= 0);

create table if not exists public.stock_movements (
    id uuid primary key default gen_random_uuid(),

    product_id uuid not null references public.products(id),

    movement_type text not null
        check (movement_type in ('entry', 'exit', 'sale', 'adjustment')),

    quantity integer not null check (quantity > 0),

    previous_stock integer not null check (previous_stock >= 0),

    new_stock integer not null check (new_stock >= 0),

    notes text,

    reference_id uuid,

    created_at timestamptz default now()
);

create index if not exists idx_stock_movements_product_id
    on public.stock_movements(product_id);

create index if not exists idx_stock_movements_created_at
    on public.stock_movements(created_at desc);

create index if not exists idx_stock_movements_type
    on public.stock_movements(movement_type);

-- Entrada ou saída manual com registro atômico
create or replace function public.register_stock_movement(
    p_product_id uuid,
    p_movement_type text,
    p_quantity integer,
    p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_product record;
    v_new_stock integer;
    v_movement_id uuid;
begin
    if p_movement_type not in ('entry', 'exit') then
        raise exception 'Tipo de movimentação inválido para operação manual';
    end if;

    if p_quantity is null or p_quantity <= 0 then
        raise exception 'Quantidade inválida';
    end if;

    select id, name, stock
    into v_product
    from public.products
    where id = p_product_id
    for update;

    if not found then
        raise exception 'Produto não encontrado';
    end if;

    if p_movement_type = 'entry' then
        v_new_stock := v_product.stock + p_quantity;
    else
        if v_product.stock < p_quantity then
            raise exception 'Estoque insuficiente para saída (disponível: %)', v_product.stock;
        end if;

        v_new_stock := v_product.stock - p_quantity;
    end if;

    update public.products
    set stock = v_new_stock,
        updated_at = now()
    where id = p_product_id;

    insert into public.stock_movements (
        product_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        notes
    ) values (
        p_product_id,
        p_movement_type,
        p_quantity,
        v_product.stock,
        v_new_stock,
        nullif(trim(p_notes), '')
    )
    returning id into v_movement_id;

    return jsonb_build_object(
        'id', v_movement_id,
        'product_id', p_product_id,
        'product_name', v_product.name,
        'movement_type', p_movement_type,
        'quantity', p_quantity,
        'previous_stock', v_product.stock,
        'new_stock', v_new_stock
    );
end;
$$;

-- Registra movimentação de venda PDV no histórico de estoque
create or replace function public.finalize_sale(
    p_items jsonb,
    p_payment_method text,
    p_payment_amount numeric,
    p_discount numeric default 0,
    p_observation text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_item jsonb;
    v_product record;
    v_sale_id uuid;
    v_sale_number bigint;
    v_subtotal numeric(10,2) := 0;
    v_discount numeric(10,2) := 0;
    v_total numeric(10,2) := 0;
    v_item_subtotal numeric(10,2);
    v_quantity integer;
    v_product_id uuid;
    v_previous_stock integer;
begin
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

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::integer;

        if v_quantity is null or v_quantity <= 0 then
            raise exception 'Quantidade inválida para o produto %', v_product_id;
        end if;

        select id, name, price, stock, status
        into v_product
        from public.products
        where id = v_product_id
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

        v_item_subtotal := v_product.price * v_quantity;
        v_subtotal := v_subtotal + v_item_subtotal;
    end loop;

    if v_discount > v_subtotal then
        raise exception 'Desconto (%) superior ao subtotal da venda (%)', v_discount, v_subtotal;
    end if;

    v_total := v_subtotal - v_discount;

    if p_payment_amount < v_total then
        raise exception 'Valor pago (%) inferior ao total da venda (%)', p_payment_amount, v_total;
    end if;

    insert into public.sales (subtotal, discount, total, status, observation)
    values (v_subtotal, v_discount, v_total, 'completed', nullif(trim(p_observation), ''))
    returning id, sale_number into v_sale_id, v_sale_number;

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::integer;

        select id, name, price, stock
        into v_product
        from public.products
        where id = v_product_id
        for update;

        v_previous_stock := v_product.stock;
        v_item_subtotal := v_product.price * v_quantity;

        insert into public.sale_items (
            sale_id,
            product_id,
            product_name,
            quantity,
            unit_price,
            subtotal
        ) values (
            v_sale_id,
            v_product_id,
            v_product.name,
            v_quantity,
            v_product.price,
            v_item_subtotal
        );

        update public.products
        set stock = stock - v_quantity,
            updated_at = now()
        where id = v_product_id;

        insert into public.stock_movements (
            product_id,
            movement_type,
            quantity,
            previous_stock,
            new_stock,
            notes,
            reference_id
        ) values (
            v_product_id,
            'sale',
            v_quantity,
            v_previous_stock,
            v_previous_stock - v_quantity,
            'Venda PDV #' || v_sale_number,
            v_sale_id
        );
    end loop;

    insert into public.sale_payments (sale_id, payment_method, amount)
    values (v_sale_id, p_payment_method, p_payment_amount);

    return jsonb_build_object(
        'id', v_sale_id,
        'sale_number', v_sale_number,
        'subtotal', v_subtotal,
        'discount', v_discount,
        'total', v_total,
        'status', 'completed',
        'payment_method', p_payment_method,
        'payment_amount', p_payment_amount,
        'change_amount', p_payment_amount - v_total
    );
end;
$$;
