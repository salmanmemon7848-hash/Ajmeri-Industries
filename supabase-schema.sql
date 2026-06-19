-- Ajmeri Industries — Supabase schema
-- Paste into Supabase SQL editor when you're ready to enable cloud sync.
-- Design choice: one shared workspace per install, no login. Rows are scoped
-- by workspace_id and accessed via anon key. Keep your URL+key private.

create table if not exists farmers (
  id text primary key,
  workspace_id text not null default 'ajmeri-default',
  name text not null,
  phone text,
  village text,
  balance numeric default 0,
  created_at timestamptz default now()
);

create table if not exists buyers (
  id text primary key,
  workspace_id text not null default 'ajmeri-default',
  name text not null,
  phone text,
  gstin text,
  balance numeric default 0,
  created_at timestamptz default now()
);

create table if not exists godowns (
  id text primary key,
  workspace_id text not null default 'ajmeri-default',
  name text not null,
  created_at timestamptz default now()
);

create table if not exists purchases (
  id text primary key,
  workspace_id text not null default 'ajmeri-default',
  date date not null,
  farmer_id text references farmers(id),
  variety text,
  weighmode text,           -- 'kaata' | 'bag'
  bags int,
  qtl numeric,
  moisture numeric,
  rate numeric,
  amount numeric,
  payment_mode text,        -- 'cash' | 'udhaari' | 'cheque' | 'upi'
  paid numeric,
  vehicle text,
  godown_id text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists milling (
  id text primary key,
  workspace_id text not null default 'ajmeri-default',
  date date not null,
  paddy_qtl numeric,
  rice_qtl numeric,
  broken_qtl numeric,
  bran_qtl numeric,
  husk_qtl numeric,
  yield_pct numeric,
  notes text,
  created_at timestamptz default now()
);

create table if not exists sales (
  id text primary key,
  workspace_id text not null default 'ajmeri-default',
  date date not null,
  buyer_id text references buyers(id),
  product text,
  unit text,                -- 'qtl' | 'bag'
  qty numeric,
  rate numeric,
  amount numeric,
  broker text,
  commission numeric,
  godown_id text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists bardana (
  id text primary key,
  workspace_id text not null default 'ajmeri-default',
  date date not null,
  kind text,                -- 'new' | 'old' | 'returned'
  qty int,
  party text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists payments (
  id text primary key,
  workspace_id text not null default 'ajmeri-default',
  date date not null,
  party_kind text,          -- 'farmer' | 'buyer'
  party_id text,
  direction text,           -- 'in' | 'out'
  amount numeric,
  mode text,                -- 'cash' | 'cheque' | 'upi'
  ref text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists cheques (
  id text primary key,
  workspace_id text not null default 'ajmeri-default',
  party_kind text,
  party_id text,
  number text,
  bank text,
  due_date date,
  amount numeric,
  status text default 'pending',  -- pending | cleared | bounced
  created_at timestamptz default now()
);

-- Open RLS for anon — secure your project URL/key instead.
alter table farmers   enable row level security;
alter table buyers    enable row level security;
alter table godowns   enable row level security;
alter table purchases enable row level security;
alter table milling   enable row level security;
alter table sales     enable row level security;
alter table bardana   enable row level security;
alter table payments  enable row level security;
alter table cheques   enable row level security;

create policy "anon all" on farmers   for all using (true) with check (true);
create policy "anon all" on buyers    for all using (true) with check (true);
create policy "anon all" on godowns   for all using (true) with check (true);
create policy "anon all" on purchases for all using (true) with check (true);
create policy "anon all" on milling   for all using (true) with check (true);
create policy "anon all" on sales     for all using (true) with check (true);
create policy "anon all" on bardana   for all using (true) with check (true);
create policy "anon all" on payments  for all using (true) with check (true);
create policy "anon all" on cheques   for all using (true) with check (true);
