-- =============================================================================
-- Migration 031: Preço promocional e destaque do Cosmo Digital Menu
-- =============================================================================
-- Cosmo Business AI
--
-- Aditivo e reversível. Não altera:
--   • products.price (preço oficial de venda / PDV)
--   • RLS de products
--   • finalize_sale
--   • place_public_digital_order
--   • triggers existentes
--   • options.is_featured
--
-- promotional_price é metadado visual do cardápio digital.
-- A cobrança promocional no checkout NÃO faz parte desta migration.
-- featured é exclusivo do Cosmo Digital Menu.
--
-- Publicar o cardápio continua sendo necessário para atualizar catalog_snapshot.
-- =============================================================================

alter table public.products
  add column if not exists promotional_price numeric(10,2),
  add column if not exists featured boolean not null default false;

alter table public.products
  drop constraint if exists products_promotional_price_lt_price;

alter table public.products
  add constraint products_promotional_price_lt_price
  check (
    promotional_price is null
    or (
      promotional_price > 0
      and promotional_price < price
    )
  );

comment on column public.products.promotional_price is
  'Preço promocional do cardápio digital. Não substitui products.price nas vendas.';

comment on column public.products.featured is
  'Destaque do Cosmo Digital Menu. Não afeta PDV nem options.is_featured.';

create index if not exists idx_products_featured
  on public.products (organization_id)
  where featured = true;
