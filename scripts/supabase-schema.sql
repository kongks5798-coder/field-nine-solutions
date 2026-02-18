-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Customers table
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- Unique email optional (comment out if not desired)
create unique index if not exists customers_email_unique on public.customers (lower(email));

-- Orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  status text not null check (status in ('pending','paid','preparing','risk_review','cancelled','refunded')),
  created_at timestamptz not null default now()
);

-- Indexes for query performance
create index if not exists customers_created_at_desc on public.customers (created_at desc);
create index if not exists orders_created_at_desc on public.orders (created_at desc);
create index if not exists orders_customer_id_idx on public.orders (customer_id);

-- PostgREST hints (optional): expose tables via REST
-- Supabase exposes public schema via Rest by default; nothing else required.

-- Test selects
-- select * from public.customers limit 1;
-- select * from public.orders limit 1;
