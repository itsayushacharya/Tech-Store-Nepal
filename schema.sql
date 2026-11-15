-- Run once in Supabase → SQL Editor

-- 1) Multiple product images
alter table products add column if not exists images jsonb default '[]'::jsonb;

-- 2) Ratings & reviews (one review per user per product)
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
create policy "reviews open access" on reviews for all using (true) with check (true);
alter publication supabase_realtime add table reviews;

-- 3) Allow customer cancel / return statuses (only needed if your orders table has a status check constraint)
alter table orders drop constraint if exists orders_order_status_check;
