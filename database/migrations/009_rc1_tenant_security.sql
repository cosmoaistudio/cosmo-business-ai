-- RC1: Multi-tenant, perfis, RLS, auditoria e RPCs seguros

-- ============================================================
-- 1. ORGANIZAÇÕES E PERFIS
-- ============================================================

create table if not exists public.organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid not null references public.organizations(id) on delete cascade,
    role text not null default 'admin'
        check (role in ('admin', 'manager', 'cashier')),
    full_name text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique (user_id)
);

create index if not exists idx_profiles_organization_id
    on public.profiles(organization_id);

create index if not exists idx_profiles_user_id
    on public.profiles(user_id);

-- ============================================================
-- 2. AUDITORIA
-- ============================================================

create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    action text not null,
    entity_type text not null,
    entity_id uuid,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

create index if not exists idx_audit_logs_organization_id
    on public.audit_logs(organization_id);

create index if not exists idx_audit_logs_created_at
    on public.audit_logs(created_at desc);

-- ============================================================
-- 3. ORGANIZATION_ID NAS TABELAS DE NEGÓCIO
-- ============================================================

alter table public.products
    add column if not exists organization_id uuid references public.organizations(id);

alter table public.customers
    add column if not exists organization_id uuid references public.organizations(id);

alter table public.sales
    add column if not exists organization_id uuid references public.organizations(id);

alter table public.stock_movements
    add column if not exists organization_id uuid references public.organizations(id);

alter table public.financial_transactions
    add column if not exists organization_id uuid references public.organizations(id);

create index if not exists idx_products_organization_id
    on public.products(organization_id);

create index if not exists idx_customers_organization_id
    on public.customers(organization_id);

create index if not exists idx_sales_organization_id
    on public.sales(organization_id);

create index if not exists idx_stock_movements_organization_id
    on public.stock_movements(organization_id);

create index if not exists idx_financial_transactions_organization_id
    on public.financial_transactions(organization_id);

-- ============================================================
-- 4. BACKFILL DE DADOS EXISTENTES
-- ============================================================

do $$
declare
    v_default_org_id uuid;
begin
    select id into v_default_org_id
    from public.organizations
    where name = 'Organização Padrão'
    limit 1;

    if v_default_org_id is null then
        insert into public.organizations (name)
        values ('Organização Padrão')
        returning id into v_default_org_id;
    end if;

    update public.products
    set organization_id = v_default_org_id
    where organization_id is null;

    update public.customers
    set organization_id = v_default_org_id
    where organization_id is null;

    update public.sales
    set organization_id = v_default_org_id
    where organization_id is null;

    update public.stock_movements sm
    set organization_id = p.organization_id
    from public.products p
    where sm.product_id = p.id
      and sm.organization_id is null
      and p.organization_id is not null;

    update public.stock_movements
    set organization_id = v_default_org_id
    where organization_id is null;

    update public.financial_transactions
    set organization_id = v_default_org_id
    where organization_id is null;
end;
$$;

-- Perfis para usuários auth existentes sem perfil
insert into public.profiles (user_id, organization_id, role, full_name)
select
    u.id,
    o.id,
    'admin',
    coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
from auth.users u
cross join lateral (
    select id from public.organizations order by created_at limit 1
) o
where not exists (
    select 1 from public.profiles p where p.user_id = u.id
);

-- ============================================================
-- 5. HELPERS DE SEGURANÇA
-- ============================================================

create or replace function public.get_my_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select organization_id
    from public.profiles
    where user_id = auth.uid()
    limit 1;
$$;

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
    select role
    from public.profiles
    where user_id = auth.uid()
    limit 1;
$$;

create or replace function public.has_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(public.get_my_role(), '') = any (allowed_roles);
$$;

create or replace function public.log_audit(
    p_action text,
    p_entity_type text,
    p_entity_id uuid default null,
    p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_org_id uuid;
begin
    v_org_id := public.get_my_organization_id();

    if v_org_id is null then
        return;
    end if;

    insert into public.audit_logs (
        organization_id,
        user_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) values (
        v_org_id,
        auth.uid(),
        p_action,
        p_entity_type,
        p_entity_id,
        coalesce(p_metadata, '{}'::jsonb)
    );
end;
$$;

-- ============================================================
-- 6. TRIGGER: NOVO USUÁRIO → ORG + PERFIL ADMIN
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_org_id uuid;
    v_company_name text;
    v_full_name text;
begin
    v_company_name := coalesce(
        nullif(trim(new.raw_user_meta_data->>'company_name'), ''),
        'Minha Empresa'
    );

    v_full_name := coalesce(
        nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
        split_part(new.email, '@', 1)
    );

    insert into public.organizations (name)
    values (v_company_name)
    returning id into v_org_id;

    insert into public.profiles (user_id, organization_id, role, full_name)
    values (new.id, v_org_id, 'admin', v_full_name);

    perform public.log_audit(
        'auth.signup',
        'user',
        new.id,
        jsonb_build_object('email', new.email, 'organization_id', v_org_id)
    );

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();

-- ============================================================
-- 7. RPCs SEGUROS (ORG + AUDITORIA)
-- ============================================================

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
    v_org_id uuid;
begin
    v_org_id := public.get_my_organization_id();

    if v_org_id is null then
        raise exception 'Usuário sem organização vinculada';
    end if;

    if not public.has_role(array['admin', 'manager']) then
        raise exception 'Permissão insuficiente para movimentar estoque';
    end if;

    if p_movement_type not in ('entry', 'exit') then
        raise exception 'Tipo de movimentação inválido para operação manual';
    end if;

    if p_quantity is null or p_quantity <= 0 then
        raise exception 'Quantidade inválida';
    end if;

    select id, name, stock, organization_id
    into v_product
    from public.products
    where id = p_product_id
      and organization_id = v_org_id
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
        organization_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        notes
    ) values (
        p_product_id,
        v_org_id,
        p_movement_type,
        p_quantity,
        v_product.stock,
        v_new_stock,
        nullif(trim(p_notes), '')
    )
    returning id into v_movement_id;

    perform public.log_audit(
        'stock.movement',
        'stock_movement',
        v_movement_id,
        jsonb_build_object(
            'product_id', p_product_id,
            'movement_type', p_movement_type,
            'quantity', p_quantity
        )
    );

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
        v_item_subtotal := v_product.price * v_quantity;

        insert into public.sale_items (
            sale_id, product_id, product_name, quantity, unit_price, subtotal
        ) values (
            v_sale_id, v_product_id, v_product.name,
            v_quantity, v_product.price, v_item_subtotal
        );

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

revoke all on function public.get_my_organization_id() from public;
revoke all on function public.get_my_role() from public;
revoke all on function public.has_role(text[]) from public;
revoke all on function public.log_audit(text, text, uuid, jsonb) from public;

grant execute on function public.get_my_organization_id() to authenticated;
grant execute on function public.get_my_role() to authenticated;
grant execute on function public.has_role(text[]) to authenticated;
grant execute on function public.finalize_sale(jsonb, text, numeric, numeric, text, uuid) to authenticated;
grant execute on function public.register_stock_movement(uuid, text, integer, text) to authenticated;

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.sale_payments enable row level security;
alter table public.stock_movements enable row level security;
alter table public.financial_transactions enable row level security;

-- Organizations
create policy organizations_select on public.organizations
    for select to authenticated
    using (id = public.get_my_organization_id());

-- Profiles
create policy profiles_select on public.profiles
    for select to authenticated
    using (organization_id = public.get_my_organization_id());

create policy profiles_update_admin on public.profiles
    for update to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin'])
    )
    with check (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin'])
    );

-- Audit logs
create policy audit_logs_select on public.audit_logs
    for select to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

-- Products
create policy products_select on public.products
    for select to authenticated
    using (organization_id = public.get_my_organization_id());

create policy products_insert on public.products
    for insert to authenticated
    with check (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

create policy products_update on public.products
    for update to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    )
    with check (organization_id = public.get_my_organization_id());

create policy products_delete on public.products
    for delete to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

-- Customers
create policy customers_select on public.customers
    for select to authenticated
    using (organization_id = public.get_my_organization_id());

create policy customers_insert on public.customers
    for insert to authenticated
    with check (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

create policy customers_update on public.customers
    for update to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    )
    with check (organization_id = public.get_my_organization_id());

create policy customers_delete on public.customers
    for delete to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

-- Sales
create policy sales_select on public.sales
    for select to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager', 'cashier'])
    );

-- Sale items (via sales)
create policy sale_items_select on public.sale_items
    for select to authenticated
    using (
        exists (
            select 1 from public.sales s
            where s.id = sale_items.sale_id
              and s.organization_id = public.get_my_organization_id()
        )
    );

-- Sale payments (via sales)
create policy sale_payments_select on public.sale_payments
    for select to authenticated
    using (
        exists (
            select 1 from public.sales s
            where s.id = sale_payments.sale_id
              and s.organization_id = public.get_my_organization_id()
        )
    );

-- Stock movements
create policy stock_movements_select on public.stock_movements
    for select to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

-- Financial transactions
create policy financial_transactions_select on public.financial_transactions
    for select to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

create policy financial_transactions_insert on public.financial_transactions
    for insert to authenticated
    with check (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
        and source = 'manual'
    );

create policy financial_transactions_delete on public.financial_transactions
    for delete to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
        and source = 'manual'
    );

-- NOT NULL após backfill
alter table public.products alter column organization_id set not null;
alter table public.customers alter column organization_id set not null;
alter table public.sales alter column organization_id set not null;
alter table public.stock_movements alter column organization_id set not null;
alter table public.financial_transactions alter column organization_id set not null;

-- ============================================================
-- 9. TRIGGER: organization_id automático em INSERTs
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

drop trigger if exists products_set_org on public.products;
create trigger products_set_org
    before insert on public.products
    for each row execute function public.set_row_organization_id();

drop trigger if exists customers_set_org on public.customers;
create trigger customers_set_org
    before insert on public.customers
    for each row execute function public.set_row_organization_id();

drop trigger if exists financial_transactions_set_org on public.financial_transactions;
create trigger financial_transactions_set_org
    before insert on public.financial_transactions
    for each row execute function public.set_row_organization_id();
