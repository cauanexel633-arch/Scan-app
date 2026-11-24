-- Scan-app initial schema. Apply in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.ports (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(char_length(name) between 2 and 80), webhook_url text not null,
 token_hash text not null unique, webhook_secret text not null, enabled boolean not null default true, created_at timestamptz not null default now()
);
create index if not exists ports_user_id_idx on public.ports(user_id);
create table if not exists public.scan_requests (
 id uuid primary key default gen_random_uuid(), port_id uuid not null references public.ports(id) on delete cascade,
 external_request_id text not null, client_payload text not null, scanner_token_hash text not null,
 status text not null default 'open' check(status in ('open','completed','cancelled')), created_at timestamptz not null default now(),
 unique(port_id,external_request_id)
);
create index if not exists scan_requests_port_created_idx on public.scan_requests(port_id,created_at desc);
create table if not exists public.scan_events (
 id uuid primary key, port_id uuid not null references public.ports(id) on delete cascade,
 request_id uuid not null references public.scan_requests(id) on delete cascade,
 barcode text not null check(char_length(barcode) between 1 and 512), payload jsonb not null, created_at timestamptz not null default now()
);
create index if not exists scan_events_request_created_idx on public.scan_events(request_id,created_at desc);
create table if not exists public.webhook_deliveries (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.scan_events(id) on delete cascade,
 port_id uuid not null references public.ports(id) on delete cascade,
 status text not null check(status in ('delivered','failed')), http_status integer, response_excerpt text,
 attempts integer not null default 1, created_at timestamptz not null default now()
);
create index if not exists webhook_deliveries_port_created_idx on public.webhook_deliveries(port_id,created_at desc);
alter table public.ports enable row level security;
alter table public.scan_requests enable row level security;
alter table public.scan_events enable row level security;
alter table public.webhook_deliveries enable row level security;
revoke all on public.ports,public.scan_requests,public.scan_events,public.webhook_deliveries from anon,authenticated;