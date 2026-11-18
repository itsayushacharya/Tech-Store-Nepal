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

-- 4) Support inbox (customer <-> admin chat)
create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_name text not null,
  user_email text default '',
  sender text not null check (sender in ('user','admin')),
  message text not null,
  order_id text default '',
  read_by_admin boolean default false,
  read_by_user boolean default false,
  created_at timestamptz default now()
);
create index if not exists support_messages_user_idx on support_messages (user_id, created_at);
alter table support_messages enable row level security;
create policy "support open access" on support_messages for all using (true) with check (true);
alter publication supabase_realtime add table support_messages;
