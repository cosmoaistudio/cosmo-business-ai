create extension if not exists pgcrypto;

create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    category text,

    description text,

    price numeric(10,2) default 0,

    stock integer default 0,

    image text,

    status text default 'active',

    created_at timestamptz default now(),

    updated_at timestamptz default now()
);