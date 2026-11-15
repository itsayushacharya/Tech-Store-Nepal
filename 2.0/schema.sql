-- ============================================================
-- TechStore NP — Full schema
-- Run once in Supabase → SQL Editor
-- ============================================================

-- ---------- users_app ----------
create table if not exists users_app (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  phone text,
  password text not null,
  created_at timestamptz default now()
);
alter table users_app enable row level security;
drop policy if exists "users_app open access" on users_app;
create policy "users_app open access" on users_app for all using (true) with check (true);

-- ---------- categories ----------
create table if not exists categories (
  key text primary key,
  label text not null
);
alter table categories enable row level security;
drop policy if exists "categories open access" on categories;
create policy "categories open access" on categories for all using (true) with check (true);

-- ---------- products ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  brand text,
  category text,
  price numeric not null default 0,
  "oldPrice" numeric,
  image text,
  images jsonb default '[]'::jsonb,
  description text,
  bullets jsonb default '[]'::jsonb,
  rating numeric default 0,
  reviews int default 0,
  sold text,
  badge text,
  "badgeText" text,
  created_at timestamptz default now()
);
-- add missing columns on existing installs
alter table products add column if not exists images jsonb default '[]'::jsonb;
alter table products add column if not exists "oldPrice" numeric;
alter table products add column if not exists "badgeText" text;
alter table products enable row level security;
drop policy if exists "products open access" on products;
create policy "products open access" on products for all using (true) with check (true);

-- ---------- delivery_rates ----------
create table if not exists delivery_rates (
  key text primary key,
  city text not null,
  province text,
  charge numeric not null default 0
);
alter table delivery_rates enable row level security;
drop policy if exists "delivery_rates open access" on delivery_rates;
create policy "delivery_rates open access" on delivery_rates for all using (true) with check (true);

-- ---------- payment_methods ----------
create table if not exists payment_methods (
  key text primary key,
  name text not null,
  type text not null default 'qr',      -- 'qr' | 'cod'
  enabled boolean default true,
  "accountId" text,
  "qrImage" text,
  instructions text
);
alter table payment_methods enable row level security;
drop policy if exists "payment_methods open access" on payment_methods;
create policy "payment_methods open access" on payment_methods for all using (true) with check (true);

-- ---------- orders ----------
create table if not exists orders (
  id text primary key,
  user_id text,
  name text,
  phone text,
  email text,
  address text,
  delivery_location text,
  payment_method text,
  items text,
  subtotal numeric default 0,
  delivery_charge numeric default 0,
  total numeric default 0,
  payment_status text default 'Pending',
  order_status text default 'Order Placed',
  transaction_id text,
  created_at timestamptz default now()
);
alter table orders enable row level security;
drop policy if exists "orders open access" on orders;
create policy "orders open access" on orders for all using (true) with check (true);

-- ---------- reviews ----------
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  user_id text not null,
  user_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text default '',
  created_at timestamptz default now(),
  unique (product_id, user_id)
);
alter table reviews enable row level security;
drop policy if exists "reviews open access" on reviews;
create policy "reviews open access" on reviews for all using (true) with check (true);

-- ---------- Realtime ----------
do $$
begin
  begin alter publication supabase_realtime add table products;         exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table categories;       exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table delivery_rates;   exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table payment_methods;  exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table orders;           exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table reviews;          exception when duplicate_object then null; end;
end $$;