-- Safe, idempotent schema for CropDoc (run repeatedly)
-- 1) Enable extension
create extension if not exists "pgcrypto";

-- 2) Lookups: languages
create table if not exists public.languages (
  code varchar(10) primary key,       -- e.g. 'en','hi','ta'
  name text not null,
  direction varchar(3) not null default 'ltr',
  created_at timestamptz not null default now()
);

-- 3) Lookups: states (English names)
create table if not exists public.states (
  code varchar(20) primary key,       -- e.g. 'MH', 'TN'
  name text not null,
  country_code varchar(5) not null default 'IN',
  created_at timestamptz not null default now()
);

-- 4) Users table (drop old users if present with different shape)
-- Note: if you have data to preserve, export it first.
drop trigger if exists trg_users_updated_at on public.users;
drop function if exists set_updated_at();
drop table if exists public.users cascade;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,                -- store normalized E.164 where possible
  phone_country_code varchar(8),
  phone_verified boolean not null default false,
  language_code varchar(10) not null references public.languages(code) on update cascade on delete restrict,
  state_code varchar(20) references public.states(code) on update cascade on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- unique index on phone (case-insensitive)
create unique index if not exists users_phone_idx on public.users(lower(phone));

-- trigger/function to keep updated_at fresh
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
before update on public.users
for each row
execute procedure set_updated_at();

-- 5) OTP verifications (temporary)
create table if not exists public.otp_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  phone text not null,
  code varchar(100) not null,         -- store hashed values in prod
  code_expires_at timestamptz not null,
  consumed boolean not null default false,
  attempts smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists otp_phone_idx on public.otp_verifications(lower(phone));

-- 6) Auth events audit
create table if not exists public.auth_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  phone text,
  event_type text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- End of schema


