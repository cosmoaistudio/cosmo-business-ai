-- Clientes (base para Dashboard e módulo futuro)

create table if not exists public.customers (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    phone text,

    email text,

    birth_date date,

    address text,

    notes text,

    created_at timestamptz default now(),

    updated_at timestamptz default now()
);

create index if not exists idx_customers_created_at
    on public.customers(created_at desc);

create index if not exists idx_customers_name
    on public.customers(name);
