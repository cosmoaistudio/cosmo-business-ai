-- Vendas PDV: schema transacional
-- Cada venda é uma operação atômica via finalize_sale()

create sequence if not exists public.sale_number_seq start 1;

-- Cabeçalho da venda
create table if not exists public.sales (
    id uuid primary key default gen_random_uuid(),

    sale_number bigint not null default nextval('public.sale_number_seq'),

    subtotal numeric(10,2) not null default 0,

    total numeric(10,2) not null default 0,

    status text not null default 'completed'
        check (status in ('completed', 'cancelled')),

    -- Reservado para emissão futura de comprovante
    receipt_issued_at timestamptz,

    created_at timestamptz default now(),

    updated_at timestamptz default now()
);

-- Itens da venda (snapshot de preço/nome no momento da venda)
create table if not exists public.sale_items (
    id uuid primary key default gen_random_uuid(),

    sale_id uuid not null references public.sales(id) on delete cascade,

    product_id uuid not null references public.products(id),

    product_name text not null,

    quantity integer not null check (quantity > 0),

    unit_price numeric(10,2) not null,

    subtotal numeric(10,2) not null,

    created_at timestamptz default now()
);

-- Forma de pagamento da venda
create table if not exists public.sale_payments (
    id uuid primary key default gen_random_uuid(),

    sale_id uuid not null references public.sales(id) on delete cascade,

    payment_method text not null
        check (payment_method in ('cash', 'credit_card', 'debit_card', 'pix')),

    amount numeric(10,2) not null check (amount > 0),

    created_at timestamptz default now()
);

create index if not exists idx_sales_status on public.sales(status);
create index if not exists idx_sales_created_at on public.sales(created_at desc);
create index if not exists idx_sale_items_sale_id on public.sale_items(sale_id);
create index if not exists idx_sale_items_product_id on public.sale_items(product_id);
create index if not exists idx_sale_payments_sale_id on public.sale_payments(sale_id);

-- Finaliza venda em transação única (rollback automático em caso de erro)
create or replace function public.finalize_sale(
    p_items jsonb,
    p_payment_method text,
    p_payment_amount numeric
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
    v_total numeric(10,2) := 0;
    v_item_subtotal numeric(10,2);
    v_quantity integer;
    v_product_id uuid;
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

    -- Valida estoque e calcula totais
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

    v_total := v_subtotal;

    if p_payment_amount < v_total then
        raise exception 'Valor pago (%) inferior ao total da venda (%)', p_payment_amount, v_total;
    end if;

    insert into public.sales (subtotal, total, status)
    values (v_subtotal, v_total, 'completed')
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
    end loop;

    insert into public.sale_payments (sale_id, payment_method, amount)
    values (v_sale_id, p_payment_method, p_payment_amount);

    return jsonb_build_object(
        'id', v_sale_id,
        'sale_number', v_sale_number,
        'subtotal', v_subtotal,
        'total', v_total,
        'status', 'completed',
        'payment_method', p_payment_method,
        'payment_amount', p_payment_amount,
        'change_amount', p_payment_amount - v_total
    );
end;
$$;
