-- FlipScout schema for Supabase Postgres
-- Run this in the Supabase SQL editor

create table components (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  canonical_name text not null unique,
  aliases text[] not null default '{}',
  buy_value numeric(10,2) not null,
  resale_value numeric(10,2) not null,
  updated_at timestamptz default now()
);

create table deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text,
  source text not null,
  asking_price numeric(10,2) not null,
  est_value numeric(10,2),
  est_profit numeric(10,2),
  status text not null default 'new',
  verdict text,
  score int,
  confidence int,
  reasoning text,
  seller_name text,
  distance_mi numeric(6,1),
  listed_at timestamptz,
  raw_text text,
  images text[] default '{}',
  notes text,
  purchase_price numeric(10,2),
  sale_price numeric(10,2),
  fees numeric(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table deal_components (
  deal_id uuid references deals(id) on delete cascade,
  component_id uuid references components(id),
  qty int default 1,
  condition_note text,
  primary key (deal_id, component_id)
);

create table watchlists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  query text not null,
  max_price numeric(10,2),
  max_distance_mi numeric(6,1),
  sources text[] default '{}',
  active boolean default true,
  created_at timestamptz default now()
);

create table watchlist_hits (
  watchlist_id uuid references watchlists(id) on delete cascade,
  deal_id uuid references deals(id) on delete cascade,
  notified_at timestamptz,
  primary key (watchlist_id, deal_id)
);

create table status_history (
  id bigserial primary key,
  deal_id uuid references deals(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_at timestamptz default now()
);

-- Seed components
insert into components (category, canonical_name, aliases, buy_value, resale_value) values
  ('gpu', 'RTX 3080 10GB', array['rtx 3080', 'rtx3080', '3080'], 330, 400),
  ('gpu', 'RTX 3070', array['rtx 3070', 'rtx3070', '3070'], 240, 290),
  ('gpu', 'RTX 3060 Ti', array['rtx 3060 ti', '3060 ti', '3060ti'], 200, 240),
  ('gpu', 'RTX 3060 12GB', array['rtx 3060', 'rtx3060', '3060'], 170, 210),
  ('gpu', 'RTX 4060', array['rtx 4060', 'rtx4060', '4060'], 230, 270),
  ('gpu', 'RTX 2060', array['rtx 2060', 'rtx2060', '2060'], 110, 140),
  ('gpu', 'GTX 1660 Super', array['1660 super', '1660s', 'gtx 1660', '1660'], 85, 110),
  ('gpu', 'RX 6600', array['rx 6600', 'rx6600', '6600 xt', '6600'], 140, 175),
  ('gpu', 'RX 580 8GB', array['rx 580', 'rx580', '580'], 55, 75),
  ('cpu', 'Ryzen 7 5800X', array['5800x', 'ryzen 7 5800'], 130, 160),
  ('cpu', 'Ryzen 5 5600X', array['5600x', 'ryzen 5 5600x', '5600'], 85, 110),
  ('cpu', 'Ryzen 5 3600', array['ryzen 5 3600', 'r5 3600', '3600'], 55, 75),
  ('cpu', 'Core i5-12400F', array['i5-12400f', '12400f', 'i5 12400'], 90, 115),
  ('cpu', 'Core i7-10700K', array['i7-10700k', '10700k', 'i7 10700'], 110, 140),
  ('ram', '32GB DDR4 3200', array['32gb ddr4', '32 gb ddr4', '32gb ram', '32gb'], 50, 65),
  ('ram', '16GB DDR4 3200', array['16gb ddr4', '16 gb ddr4', '16gb ram', '16gb'], 25, 35),
  ('storage', '1TB NVMe SSD', array['1tb nvme', '1tb ssd', '1 tb ssd', '1tb m.2'], 40, 55),
  ('storage', '500GB SSD', array['500gb ssd', '512gb ssd', '500 gb ssd', '512gb nvme'], 20, 28),
  ('psu', '750W 80+ Gold PSU', array['750w gold', '750 watt gold', '750w psu', '750w'], 55, 75),
  ('psu', '650W 80+ Gold PSU', array['650w gold', '650 watt', '650w psu', '650w'], 45, 60),
  ('mobo', 'B550 Motherboard', array['b550'], 70, 90),
  ('mobo', 'B450 Motherboard', array['b450'], 45, 60),
  ('case', 'Mid-tower ATX case', array['mid tower', 'atx case', 'nzxt h510', '4000d', 'meshify'], 25, 40),
  ('cooler', '240mm AIO cooler', array['240mm aio', 'aio cooler', 'liquid cooler', 'aio'], 40, 55);

-- Seed watchlists
insert into watchlists (name, query, max_price, active) values
  ('RTX 3060 under $180', 'rtx 3060', 180, true),
  ('RTX 2060 under $110', 'rtx 2060', 110, true),
  ('5600X under $90', '5600x', 90, true),
  ('RX 6600 under $150', 'rx 6600', 150, true),
  ('Cases under $30', 'case', 30, false);
