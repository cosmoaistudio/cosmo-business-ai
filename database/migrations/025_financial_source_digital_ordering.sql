-- ============================================================
-- 025: Origem financeira digital_ordering (checkout público QR)
-- ============================================================
-- Corrige: financial_transactions_source_check rejeitava
-- source = 'digital_ordering' em place_public_digital_order().
--
-- Valores permitidos (compatível com 006):
--   manual, pdv, system, digital_ordering
-- Depende de: 006, 023, 024
-- ============================================================

alter table public.financial_transactions
    drop constraint if exists financial_transactions_source_check;

alter table public.financial_transactions
    add constraint financial_transactions_source_check
    check (source in ('manual', 'pdv', 'system', 'digital_ordering'));

comment on column public.financial_transactions.source is
    'Origem do lançamento: manual, pdv, system ou digital_ordering (pedido via QR/checkout público).';
