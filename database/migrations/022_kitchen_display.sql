-- ============================================================
-- 022: Kitchen Display System (KDS)
-- ============================================================
-- Infraestrutura completa do KDS como sidecar das vendas PDV.
-- Não altera finalize_sale, Product Engine nem schema do PDV.
--
-- Fluxo:
--   finalize_sale (RPC existente) → INSERT em public.sales
--   → trigger trg_kitchen_ticket_after_sale_insert
--   → public.generate_kitchen_ticket_from_sale()
--   → kitchen_tickets + kitchen_ticket_items
--
-- Depende de:
--   • public.organizations, public.sales, public.sale_items
--   • public.sale_item_options (015)
--   • public.customers (007)
--   • public.get_my_organization_id(), public.has_role() (009)
-- ============================================================

-- ============================================================
-- 1. CREATE TABLE: kitchen_tickets
-- ============================================================
-- Colunas sem FK/CHECK inline; constraints aplicadas nas seções 4 e 5.

create table if not exists public.kitchen_tickets (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null,
    sale_id uuid not null,
    sale_number bigint not null,

    customer_name text,

    status text not null default 'pending',
    priority text not null default 'normal',
    ticket_type text not null default 'counter',

    assigned_to text,

    started_at timestamptz,
    completed_at timestamptz,

    estimated_minutes integer not null default 20,

    notes text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.kitchen_tickets is
    'Tickets do Kitchen Display System (KDS). Um ticket por venda concluída no PDV.';

comment on column public.kitchen_tickets.organization_id is
    'Tenant dono do ticket; espelha sales.organization_id.';

comment on column public.kitchen_tickets.sale_id is
    'Venda de origem criada por public.finalize_sale().';

comment on column public.kitchen_tickets.sale_number is
    'Número sequencial da venda exibido no KDS.';

comment on column public.kitchen_tickets.customer_name is
    'Snapshot do nome do cliente no momento da venda.';

comment on column public.kitchen_tickets.status is
    'Ciclo KDS: pending → accepted → preparing → ready → delivered | cancelled.';

comment on column public.kitchen_tickets.priority is
    'Prioridade operacional: low, normal, high, urgent.';

comment on column public.kitchen_tickets.ticket_type is
    'Canal do pedido: pickup, dine_in, delivery, counter.';

comment on column public.kitchen_tickets.assigned_to is
    'Responsável pela preparação (nome ou identificador).';

comment on column public.kitchen_tickets.started_at is
    'Momento em que a preparação iniciou (status preparing).';

comment on column public.kitchen_tickets.completed_at is
    'Momento de conclusão (delivered ou cancelled).';

comment on column public.kitchen_tickets.estimated_minutes is
    'SLA estimado de preparo em minutos.';

comment on column public.kitchen_tickets.notes is
    'Observações da venda / cozinha (copiadas de sales.observation).';

-- Migração incremental de schema legado (022 anterior), se aplicável.
do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'kitchen_tickets'
          and column_name = 'service_type'
    ) and not exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'kitchen_tickets'
          and column_name = 'ticket_type'
    ) then
        alter table public.kitchen_tickets
            rename column service_type to ticket_type;
    end if;

    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'kitchen_tickets'
          and column_name = 'observation'
    ) and not exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'kitchen_tickets'
          and column_name = 'notes'
    ) then
        alter table public.kitchen_tickets
            rename column observation to notes;
    end if;
end;
$$;

alter table public.kitchen_tickets
    add column if not exists customer_name text,
    add column if not exists ticket_type text,
    add column if not exists started_at timestamptz,
    add column if not exists completed_at timestamptz,
    add column if not exists estimated_minutes integer,
    add column if not exists notes text;

update public.kitchen_tickets
set ticket_type = coalesce(ticket_type, 'counter')
where ticket_type is null;

update public.kitchen_tickets
set estimated_minutes = coalesce(estimated_minutes, 20)
where estimated_minutes is null;

update public.kitchen_tickets
set status = 'pending'
where status = 'new';

do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'kitchen_tickets'
          and column_name = 'preparing_at'
    ) then
        update public.kitchen_tickets
        set started_at = coalesce(started_at, preparing_at)
        where started_at is null
          and preparing_at is not null;
    end if;

    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'kitchen_tickets'
          and column_name = 'accepted_at'
    ) then
        update public.kitchen_tickets
        set started_at = coalesce(started_at, accepted_at)
        where started_at is null
          and accepted_at is not null;
    end if;

    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'kitchen_tickets'
          and column_name = 'delivered_at'
    ) then
        update public.kitchen_tickets
        set completed_at = coalesce(completed_at, delivered_at)
        where completed_at is null
          and delivered_at is not null;
    end if;
end;
$$;

alter table public.kitchen_tickets
    drop column if exists service_type,
    drop column if exists observation,
    drop column if exists accepted_at,
    drop column if exists preparing_at,
    drop column if exists ready_at,
    drop column if exists delivered_at;

alter table public.kitchen_tickets
    alter column ticket_type set default 'counter';

alter table public.kitchen_tickets
    alter column estimated_minutes set default 20;

update public.kitchen_tickets
set estimated_minutes = 20
where estimated_minutes is null;

alter table public.kitchen_tickets
    alter column estimated_minutes set not null;

update public.kitchen_tickets
set priority = 'normal'
where priority not in ('low', 'normal', 'high', 'urgent');

-- ============================================================
-- 2. CREATE TABLE: kitchen_ticket_items
-- ============================================================

create table if not exists public.kitchen_ticket_items (
    id uuid primary key default gen_random_uuid(),

    ticket_id uuid not null,
    sale_item_id uuid not null,
    product_id uuid not null,

    product_name text not null,
    quantity integer not null,

    summary text,

    status text not null default 'pending',

    created_at timestamptz not null default now()
);

comment on table public.kitchen_ticket_items is
    'Itens de produção vinculados a um kitchen_ticket.';

comment on column public.kitchen_ticket_items.ticket_id is
    'Ticket pai do KDS.';

comment on column public.kitchen_ticket_items.sale_item_id is
    'Referência ao item original da venda PDV.';

comment on column public.kitchen_ticket_items.summary is
    'Resumo textual das opções selecionadas (sale_item_options).';

comment on column public.kitchen_ticket_items.status is
    'Status individual do item na cozinha.';

-- ============================================================
-- 3. ÍNDICES
-- ============================================================

create index if not exists idx_kitchen_tickets_organization_id
    on public.kitchen_tickets(organization_id);

create index if not exists idx_kitchen_tickets_sale_id
    on public.kitchen_tickets(sale_id);

create index if not exists idx_kitchen_tickets_status
    on public.kitchen_tickets(status);

create index if not exists idx_kitchen_tickets_priority
    on public.kitchen_tickets(priority);

create index if not exists idx_kitchen_tickets_created_at
    on public.kitchen_tickets(created_at desc);

create index if not exists idx_kitchen_ticket_items_ticket_id
    on public.kitchen_ticket_items(ticket_id);

create index if not exists idx_kitchen_ticket_items_sale_item_id
    on public.kitchen_ticket_items(sale_item_id);

create index if not exists idx_kitchen_ticket_items_status
    on public.kitchen_ticket_items(status);

-- ============================================================
-- 4. CONSTRAINTS (CHECK, UNIQUE)
-- ============================================================

alter table public.kitchen_tickets
    drop constraint if exists kitchen_tickets_status_check;

alter table public.kitchen_tickets
    add constraint kitchen_tickets_status_check
    check (status in (
        'pending',
        'accepted',
        'preparing',
        'ready',
        'delivered',
        'cancelled'
    ));

alter table public.kitchen_tickets
    drop constraint if exists kitchen_tickets_priority_check;

alter table public.kitchen_tickets
    add constraint kitchen_tickets_priority_check
    check (priority in ('low', 'normal', 'high', 'urgent'));

alter table public.kitchen_tickets
    drop constraint if exists kitchen_tickets_ticket_type_check;

alter table public.kitchen_tickets
    add constraint kitchen_tickets_ticket_type_check
    check (ticket_type in ('pickup', 'dine_in', 'delivery', 'counter'));

alter table public.kitchen_tickets
    drop constraint if exists kitchen_tickets_estimated_minutes_check;

alter table public.kitchen_tickets
    add constraint kitchen_tickets_estimated_minutes_check
    check (estimated_minutes > 0);

alter table public.kitchen_tickets
    drop constraint if exists kitchen_tickets_sale_id_unique;

alter table public.kitchen_tickets
    add constraint kitchen_tickets_sale_id_unique unique (sale_id);

alter table public.kitchen_ticket_items
    drop constraint if exists kitchen_ticket_items_quantity_check;

alter table public.kitchen_ticket_items
    add constraint kitchen_ticket_items_quantity_check
    check (quantity > 0);

alter table public.kitchen_ticket_items
    drop constraint if exists kitchen_ticket_items_status_check;

alter table public.kitchen_ticket_items
    add constraint kitchen_ticket_items_status_check
    check (status in ('pending', 'preparing', 'ready', 'cancelled'));

alter table public.kitchen_ticket_items
    drop constraint if exists kitchen_ticket_items_sale_item_unique;

alter table public.kitchen_ticket_items
    add constraint kitchen_ticket_items_sale_item_unique unique (ticket_id, sale_item_id);

-- ============================================================
-- 5. FOREIGN KEYS
-- ============================================================

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'kitchen_tickets_organization_id_fkey'
          and conrelid = 'public.kitchen_tickets'::regclass
    ) then
        alter table public.kitchen_tickets
            add constraint kitchen_tickets_organization_id_fkey
            foreign key (organization_id)
            references public.organizations(id)
            on delete cascade;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'kitchen_tickets_sale_id_fkey'
          and conrelid = 'public.kitchen_tickets'::regclass
    ) then
        alter table public.kitchen_tickets
            add constraint kitchen_tickets_sale_id_fkey
            foreign key (sale_id)
            references public.sales(id)
            on delete cascade;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'kitchen_ticket_items_ticket_id_fkey'
          and conrelid = 'public.kitchen_ticket_items'::regclass
    ) then
        alter table public.kitchen_ticket_items
            add constraint kitchen_ticket_items_ticket_id_fkey
            foreign key (ticket_id)
            references public.kitchen_tickets(id)
            on delete cascade;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'kitchen_ticket_items_sale_item_id_fkey'
          and conrelid = 'public.kitchen_ticket_items'::regclass
    ) then
        alter table public.kitchen_ticket_items
            add constraint kitchen_ticket_items_sale_item_id_fkey
            foreign key (sale_item_id)
            references public.sale_items(id)
            on delete cascade;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'kitchen_ticket_items_product_id_fkey'
          and conrelid = 'public.kitchen_ticket_items'::regclass
    ) then
        alter table public.kitchen_ticket_items
            add constraint kitchen_ticket_items_product_id_fkey
            foreign key (product_id)
            references public.products(id);
    end if;
end;
$$;

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

alter table public.kitchen_tickets enable row level security;
alter table public.kitchen_ticket_items enable row level security;

-- ============================================================
-- 7. POLICIES
-- ============================================================

drop policy if exists kitchen_tickets_select on public.kitchen_tickets;
create policy kitchen_tickets_select on public.kitchen_tickets
    for select
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager', 'cashier'])
    );

drop policy if exists kitchen_tickets_insert on public.kitchen_tickets;
create policy kitchen_tickets_insert on public.kitchen_tickets
    for insert
    to authenticated
    with check (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

drop policy if exists kitchen_tickets_update on public.kitchen_tickets;
create policy kitchen_tickets_update on public.kitchen_tickets
    for update
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager', 'cashier'])
    )
    with check (
        organization_id = public.get_my_organization_id()
    );

drop policy if exists kitchen_tickets_delete on public.kitchen_tickets;
create policy kitchen_tickets_delete on public.kitchen_tickets
    for delete
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager'])
    );

drop policy if exists kitchen_ticket_items_select on public.kitchen_ticket_items;
create policy kitchen_ticket_items_select on public.kitchen_ticket_items
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.kitchen_tickets kt
            where kt.id = kitchen_ticket_items.ticket_id
              and kt.organization_id = public.get_my_organization_id()
              and public.has_role(array['admin', 'manager', 'cashier'])
        )
    );

drop policy if exists kitchen_ticket_items_insert on public.kitchen_ticket_items;
create policy kitchen_ticket_items_insert on public.kitchen_ticket_items
    for insert
    to authenticated
    with check (
        exists (
            select 1
            from public.kitchen_tickets kt
            where kt.id = kitchen_ticket_items.ticket_id
              and kt.organization_id = public.get_my_organization_id()
              and public.has_role(array['admin', 'manager'])
        )
    );

drop policy if exists kitchen_ticket_items_update on public.kitchen_ticket_items;
create policy kitchen_ticket_items_update on public.kitchen_ticket_items
    for update
    to authenticated
    using (
        exists (
            select 1
            from public.kitchen_tickets kt
            where kt.id = kitchen_ticket_items.ticket_id
              and kt.organization_id = public.get_my_organization_id()
              and public.has_role(array['admin', 'manager', 'cashier'])
        )
    )
    with check (
        exists (
            select 1
            from public.kitchen_tickets kt
            where kt.id = kitchen_ticket_items.ticket_id
              and kt.organization_id = public.get_my_organization_id()
        )
    );

drop policy if exists kitchen_ticket_items_delete on public.kitchen_ticket_items;
create policy kitchen_ticket_items_delete on public.kitchen_ticket_items
    for delete
    to authenticated
    using (
        exists (
            select 1
            from public.kitchen_tickets kt
            where kt.id = kitchen_ticket_items.ticket_id
              and kt.organization_id = public.get_my_organization_id()
              and public.has_role(array['admin', 'manager'])
        )
    );

-- ============================================================
-- 8. FUNCTIONS
-- ============================================================

drop function if exists public.create_kitchen_ticket_from_sale() cascade;
drop function if exists public.set_kitchen_ticket_updated_at() cascade;

create or replace function public.infer_kitchen_ticket_type(p_notes text)
returns text
language plpgsql
immutable
as $$
declare
    v_text text := lower(coalesce(p_notes, ''));
begin
    if v_text ~ '(delivery|entrega|ifood|uber|rappi)' then
        return 'delivery';
    elsif v_text ~ '(mesa|table|comanda)' then
        return 'dine_in';
    elsif v_text ~ '(retirada|balc[aã]o|pickup|takeaway)' then
        return 'pickup';
    end if;
    return 'counter';
end;
$$;

comment on function public.infer_kitchen_ticket_type(text) is
    'Deriva ticket_type a partir do texto de observações da venda.';

create or replace function public.build_kitchen_item_summary(p_sale_item_id uuid)
returns text
language sql
stable
as $$
    select nullif(
        string_agg(
            format('%sx %s', sio.quantity, sio.option_name),
            ', '
            order by sio.option_name
        ),
        ''
    )
    from public.sale_item_options sio
    where sio.sale_item_id = p_sale_item_id;
$$;

comment on function public.build_kitchen_item_summary(uuid) is
    'Agrega opções vendidas (sale_item_options) em texto para o KDS.';

create or replace function public.calculate_kitchen_prep_minutes(p_ticket_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_ticket record;
    v_end timestamptz;
begin
    select started_at, completed_at, created_at
    into v_ticket
    from public.kitchen_tickets
    where id = p_ticket_id;

    if not found then
        return null;
    end if;

    v_end := coalesce(v_ticket.completed_at, now());

    if v_ticket.started_at is not null then
        return greatest(
            0,
            floor(extract(epoch from (v_end - v_ticket.started_at)) / 60.0)::integer
        );
    end if;

    return greatest(
        0,
        floor(extract(epoch from (v_end - v_ticket.created_at)) / 60.0)::integer
    );
end;
$$;

comment on function public.calculate_kitchen_prep_minutes(uuid) is
    'Retorna minutos de preparo: started_at → completed_at (ou agora se em aberto).';

create or replace function public.sync_kitchen_ticket_status()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();

    if new.status = 'preparing'
       and (old.status is distinct from 'preparing')
       and new.started_at is null then
        new.started_at := now();
    end if;

    if new.status in ('delivered', 'cancelled')
       and (old.status is distinct from new.status)
       and new.completed_at is null then
        new.completed_at := now();
    end if;

    if new.status in ('pending', 'accepted', 'ready')
       and old.status in ('delivered', 'cancelled') then
        new.completed_at := null;
    end if;

    return new;
end;
$$;

comment on function public.sync_kitchen_ticket_status() is
    'Sincroniza started_at/completed_at/updated_at quando status do ticket muda.';

create or replace function public.propagate_kitchen_ticket_status_to_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.status = old.status then
        return new;
    end if;

    if new.status = 'delivered' then
        update public.kitchen_ticket_items
        set status = 'ready'
        where ticket_id = new.id
          and status <> 'cancelled';
    elsif new.status = 'cancelled' then
        update public.kitchen_ticket_items
        set status = 'cancelled'
        where ticket_id = new.id;
    elsif new.status = 'preparing' then
        update public.kitchen_ticket_items
        set status = 'preparing'
        where ticket_id = new.id
          and status = 'pending';
    end if;

    return new;
end;
$$;

comment on function public.propagate_kitchen_ticket_status_to_items() is
    'Propaga mudanças de status do ticket para kitchen_ticket_items.';

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
    'Cria kitchen_ticket e kitchen_ticket_items para uma venda concluída.';

create or replace function public.kitchen_ticket_after_sale_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.status = 'completed' then
        perform public.generate_kitchen_ticket_from_sale(new.id);
    end if;
    return new;
end;
$$;

comment on function public.kitchen_ticket_after_sale_insert() is
    'Handler de trigger pós-venda. finalize_sale insere em sales com status completed.';

-- ============================================================
-- 9. TRIGGERS
-- ============================================================

drop trigger if exists trg_create_kitchen_ticket_from_sale on public.sales;

drop trigger if exists trg_kitchen_ticket_after_sale_insert on public.sales;
create trigger trg_kitchen_ticket_after_sale_insert
    after insert on public.sales
    for each row
    execute function public.kitchen_ticket_after_sale_insert();

comment on trigger trg_kitchen_ticket_after_sale_insert on public.sales is
    'Gera ticket KDS automaticamente quando finalize_sale conclui uma venda.';

drop trigger if exists trg_kitchen_ticket_sync_status on public.kitchen_tickets;
create trigger trg_kitchen_ticket_sync_status
    before update of status on public.kitchen_tickets
    for each row
    execute function public.sync_kitchen_ticket_status();

drop trigger if exists trg_kitchen_ticket_updated_at on public.kitchen_tickets;
create trigger trg_kitchen_ticket_updated_at
    before update on public.kitchen_tickets
    for each row
    execute function public.sync_kitchen_ticket_status();

comment on trigger trg_kitchen_ticket_updated_at on public.kitchen_tickets is
    'Mantém updated_at e timestamps de ciclo de vida do ticket.';

drop trigger if exists trg_kitchen_ticket_propagate_items on public.kitchen_tickets;
create trigger trg_kitchen_ticket_propagate_items
    after update of status on public.kitchen_tickets
    for each row
    execute function public.propagate_kitchen_ticket_status_to_items();

-- ============================================================
-- 10. SUPABASE REALTIME
-- ============================================================

do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'kitchen_tickets'
    ) then
        alter publication supabase_realtime add table public.kitchen_tickets;
    end if;

    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'kitchen_ticket_items'
    ) then
        alter publication supabase_realtime add table public.kitchen_ticket_items;
    end if;
end;
$$;

-- ============================================================
-- 11. BACKFILL — vendas concluídas sem ticket (idempotente)
-- ============================================================

do $$
declare
    v_sale_id uuid;
begin
    for v_sale_id in
        select s.id
        from public.sales s
        where s.status = 'completed'
          and not exists (
              select 1
              from public.kitchen_tickets kt
              where kt.sale_id = s.id
          )
        order by s.created_at asc
        limit 5000
    loop
        perform public.generate_kitchen_ticket_from_sale(v_sale_id);
    end loop;
end;
$$;

-- ============================================================
-- 12. GRANTS
-- ============================================================

grant select, insert, update, delete on public.kitchen_tickets to authenticated;
grant select, insert, update, delete on public.kitchen_ticket_items to authenticated;

grant execute on function public.infer_kitchen_ticket_type(text) to authenticated;
grant execute on function public.build_kitchen_item_summary(uuid) to authenticated;
grant execute on function public.calculate_kitchen_prep_minutes(uuid) to authenticated;
grant execute on function public.generate_kitchen_ticket_from_sale(uuid) to authenticated;
