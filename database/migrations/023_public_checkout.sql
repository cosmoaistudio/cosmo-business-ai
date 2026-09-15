-- ============================================================
-- 023: Checkout público via QR Code (Pedido Digital)
-- ============================================================
-- Persistência Supabase + RPCs seguras (anon, sem service role no client).
-- Depende de:
--   • public.organizations, public.products, public.sales (009)
--   • public.finalize_sale lógica de estoque/financeiro (015)
--   • public.kitchen_tickets trigger pós-venda (022)
-- ============================================================

-- ============================================================
-- 1. TABELAS
-- ============================================================

create table if not exists public.digital_stores (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null,
    slug text not null,
    name text not null,
    enabled boolean not null default true,
    logo_url text,
    banner_url text,
    welcome_message text not null default '',
    theme jsonb not null default '{}'::jsonb,
    settings jsonb not null default '{}'::jsonb,
    qr_codes jsonb not null default '[]'::jsonb,
    catalog_snapshot jsonb not null default '[]'::jsonb,
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.digital_store_tables (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null,
    store_id uuid not null,
    label text not null,
    seats integer not null default 4,
    active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. CONSTRAINTS
-- ============================================================

alter table public.digital_stores
    drop constraint if exists digital_stores_organization_id_fkey;

alter table public.digital_stores
    add constraint digital_stores_organization_id_fkey
    foreign key (organization_id) references public.organizations(id) on delete cascade;

alter table public.digital_stores
    drop constraint if exists digital_stores_organization_id_key;

alter table public.digital_stores
    add constraint digital_stores_organization_id_key unique (organization_id);

alter table public.digital_stores
    drop constraint if exists digital_stores_slug_key;

alter table public.digital_stores
    add constraint digital_stores_slug_key unique (slug);

alter table public.digital_store_tables
    drop constraint if exists digital_store_tables_organization_id_fkey;

alter table public.digital_store_tables
    add constraint digital_store_tables_organization_id_fkey
    foreign key (organization_id) references public.organizations(id) on delete cascade;

alter table public.digital_store_tables
    drop constraint if exists digital_store_tables_store_id_fkey;

alter table public.digital_store_tables
    add constraint digital_store_tables_store_id_fkey
    foreign key (store_id) references public.digital_stores(id) on delete cascade;

alter table public.digital_store_tables
    drop constraint if exists digital_store_tables_store_id_label_key;

alter table public.digital_store_tables
    add constraint digital_store_tables_store_id_label_key unique (store_id, label);

create index if not exists idx_digital_stores_slug
    on public.digital_stores(slug);

create index if not exists idx_digital_stores_organization_id
    on public.digital_stores(organization_id);

create index if not exists idx_digital_store_tables_store_id
    on public.digital_store_tables(store_id);

create index if not exists idx_digital_store_tables_organization_id
    on public.digital_store_tables(organization_id);

-- ============================================================
-- 3. RLS
-- ============================================================

alter table public.digital_stores enable row level security;
alter table public.digital_store_tables enable row level security;

drop policy if exists digital_stores_select on public.digital_stores;
create policy digital_stores_select on public.digital_stores
    for select to authenticated
    using (organization_id = public.get_my_organization_id());

drop policy if exists digital_stores_insert on public.digital_stores;
create policy digital_stores_insert on public.digital_stores
    for insert to authenticated
    with check (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

drop policy if exists digital_stores_update on public.digital_stores;
create policy digital_stores_update on public.digital_stores
    for update to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    )
    with check (organization_id = public.get_my_organization_id());

drop policy if exists digital_stores_delete on public.digital_stores;
create policy digital_stores_delete on public.digital_stores
    for delete to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin'])
    );

drop policy if exists digital_store_tables_select on public.digital_store_tables;
create policy digital_store_tables_select on public.digital_store_tables
    for select to authenticated
    using (organization_id = public.get_my_organization_id());

drop policy if exists digital_store_tables_insert on public.digital_store_tables;
create policy digital_store_tables_insert on public.digital_store_tables
    for insert to authenticated
    with check (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

drop policy if exists digital_store_tables_update on public.digital_store_tables;
create policy digital_store_tables_update on public.digital_store_tables
    for update to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    )
    with check (organization_id = public.get_my_organization_id());

drop policy if exists digital_store_tables_delete on public.digital_store_tables;
create policy digital_store_tables_delete on public.digital_store_tables
    for delete to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

-- ============================================================
-- 4. RPC — loja pública (anon + authenticated)
-- ============================================================

create or replace function public.get_public_digital_store(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
    v_store record;
    v_tables jsonb;
begin
    select *
    into v_store
    from public.digital_stores ds
    where lower(ds.slug) = lower(trim(p_slug))
      and ds.enabled = true
      and ds.published_at is not null;

    if not found then
        return null;
    end if;

    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'id', t.id,
                'label', t.label,
                'seats', t.seats
            )
            order by t.sort_order, t.label
        ),
        '[]'::jsonb
    )
    into v_tables
    from public.digital_store_tables t
    where t.store_id = v_store.id
      and t.active = true;

    return jsonb_build_object(
        'slug', v_store.slug,
        'organization_id', v_store.organization_id,
        'organization_name', v_store.name,
        'logo_url', v_store.logo_url,
        'banner_url', v_store.banner_url,
        'welcome_message', v_store.welcome_message,
        'theme', v_store.theme,
        'settings', v_store.settings,
        'published_at', v_store.published_at,
        'average_prep_minutes', coalesce((v_store.settings->>'averagePrepMinutes')::integer, 20),
        'minimum_order', coalesce((v_store.settings->>'minimumOrder')::numeric, 0),
        'delivery_fee', coalesce((v_store.settings->>'deliveryFee')::numeric, 0),
        'accepts_pickup', coalesce((v_store.settings->>'acceptsPickup')::boolean, true),
        'accepts_delivery', coalesce((v_store.settings->>'acceptsDelivery')::boolean, true),
        'accepts_dine_in', coalesce((v_store.settings->>'acceptsDineIn')::boolean, true),
        'tables', v_tables
    );
end;
$$;

create or replace function public.get_public_digital_menu(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
    v_catalog jsonb;
begin
    select ds.catalog_snapshot
    into v_catalog
    from public.digital_stores ds
    where lower(ds.slug) = lower(trim(p_slug))
      and ds.enabled = true
      and ds.published_at is not null;

    if not found then
        return '[]'::jsonb;
    end if;

    return coalesce(v_catalog, '[]'::jsonb);
end;
$$;

-- ============================================================
-- 5. RPC — checkout público (sem auth, sem service role no client)
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
            'Pedido Digital #' || v_sale_number, v_sale_id
        );
    end loop;

    insert into public.sale_payments (sale_id, payment_method, amount)
    values (v_sale_id, p_payment_method, p_payment_amount);

    v_finance_description := 'Pedido Digital #' || v_sale_number;

    insert into public.financial_transactions (
        type, category, description, amount,
        transaction_date, source, reference_id, notes, organization_id
    ) values (
        'income', 'sale', v_finance_description, v_total,
        current_date, 'digital_ordering', v_sale_id,
        v_observation, v_org_id
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
        'organization_id', v_org_id,
        'store_slug', v_store.slug,
        'estimated_minutes', coalesce((v_store.settings->>'averagePrepMinutes')::integer, 20)
    );
end;
$$;

create or replace function public.get_public_order_status(
    p_store_slug text,
    p_sale_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
    v_org_id uuid;
    v_sale record;
    v_ticket record;
begin
    select ds.organization_id
    into v_org_id
    from public.digital_stores ds
    where lower(ds.slug) = lower(trim(p_store_slug))
      and ds.enabled = true;

    if not found then
        return null;
    end if;

    select s.id, s.sale_number, s.total, s.status, s.created_at
    into v_sale
    from public.sales s
    where s.id = p_sale_id
      and s.organization_id = v_org_id;

    if not found then
        return null;
    end if;

    select kt.id, kt.status, kt.estimated_minutes, kt.updated_at
    into v_ticket
    from public.kitchen_tickets kt
    where kt.sale_id = p_sale_id;

    return jsonb_build_object(
        'id', v_sale.id,
        'sale_number', v_sale.sale_number,
        'total', v_sale.total,
        'sale_status', v_sale.status,
        'kitchen_status', coalesce(v_ticket.status, 'pending'),
        'estimated_minutes', coalesce(v_ticket.estimated_minutes, 20),
        'updated_at', coalesce(v_ticket.updated_at, v_sale.created_at),
        'created_at', v_sale.created_at
    );
end;
$$;

-- ============================================================
-- 6. GRANTS
-- ============================================================

grant select, insert, update, delete on public.digital_stores to authenticated;
grant select, insert, update, delete on public.digital_store_tables to authenticated;

grant execute on function public.get_public_digital_store(text) to anon, authenticated;
grant execute on function public.get_public_digital_menu(text) to anon, authenticated;
grant execute on function public.place_public_digital_order(text, jsonb, text, numeric, numeric, text, jsonb) to anon, authenticated;
grant execute on function public.get_public_order_status(text, uuid) to anon, authenticated;
