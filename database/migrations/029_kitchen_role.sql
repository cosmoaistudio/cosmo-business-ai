-- =============================================================================
-- Migration 029: Role kitchen (KDS / cozinha)
-- =============================================================================
-- Cosmo Business AI
--
-- STATUS: PROPOSTA — NÃO APLICAR AUTOMATICAMENTE.
-- Aplicar manualmente no Supabase SQL Editor somente após revisão.
--
-- Depende de: 009 (profiles + sales RLS) + 022 (kitchen_tickets RLS).
--
-- Propósito:
--   • Ampliar CHECK de profiles.role para incluir 'kitchen'.
--   • Permitir SELECT/UPDATE em kitchen_tickets / kitchen_ticket_items para kitchen.
--   • Permitir sales_select para kitchen (sync/realtime do KDS).
--
-- NÃO:
--   • Remove dados existentes
--   • Altera organization_id
--   • Cria organização
--   • Concede INSERT/DELETE em kitchen_* (criação continua trigger/RPC + admin/manager)
--   • Concede finalize_sale, estoque, financeiro, catálogo write
--   • Altera 026 / 027 / 028
-- =============================================================================


-- =============================================================================
-- 1. profiles.role — incluir kitchen (idempotente)
-- =============================================================================

do $$
declare
  cname text;
begin
  for cname in
    select con.conname
    from pg_constraint con
    join pg_attribute att
      on att.attrelid = con.conrelid
     and att.attnum = any (con.conkey)
    where con.conrelid = 'public.profiles'::regclass
      and con.contype = 'c'
      and att.attname = 'role'
  loop
    execute format('alter table public.profiles drop constraint %I', cname);
  end loop;
end $$;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'manager', 'cashier', 'kitchen'));


-- =============================================================================
-- 2. RLS — kitchen display (SELECT + UPDATE only)
-- =============================================================================

drop policy if exists kitchen_tickets_select on public.kitchen_tickets;
create policy kitchen_tickets_select on public.kitchen_tickets
    for select
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager', 'cashier', 'kitchen'])
    );

drop policy if exists kitchen_tickets_update on public.kitchen_tickets;
create policy kitchen_tickets_update on public.kitchen_tickets
    for update
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager', 'cashier', 'kitchen'])
    )
    with check (
        organization_id = public.get_my_organization_id()
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
              and public.has_role(array['admin', 'manager', 'cashier', 'kitchen'])
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
              and public.has_role(array['admin', 'manager', 'cashier', 'kitchen'])
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


-- =============================================================================
-- 3. RLS — sales_select (KDS syncMissing + realtime)
-- =============================================================================

drop policy if exists sales_select on public.sales;
create policy sales_select on public.sales
    for select
    to authenticated
    using (
        organization_id = public.get_my_organization_id()
        and public.has_role(array['admin', 'manager', 'cashier', 'kitchen'])
    );


-- =============================================================================
-- FIM 029
-- =============================================================================
-- Pós-aplicação manual (fora desta migration):
--   1) Criar usuário Auth na mesma organization_id da loja
--   2) UPDATE profiles SET role = 'kitchen' WHERE user_id = ...
--   3) Login no notebook → deve abrir /cozinha
-- =============================================================================
