-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Categories Table
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products Table
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text,
  description text,
  price numeric not null,
  old_price numeric,
  images text[] default '{}',
  video text,
  category_id uuid references public.categories(id),
  sizes text[] default '{}',
  size_type text default 'clothing',
  colors text[] default '{}',
  weight numeric default 0,
  rating numeric default 0,
  reviews integer default 0,
  sales integer default 0,
  active boolean default true,
  is_new boolean default false,
  is_featured boolean default false,
  is_bestseller boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders Table
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  customer_name text not null,
  customer_email text,
  customer_phone text,
  customer_cpf text,
  address_cep text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  items jsonb not null,
  total numeric not null,
  freight_price numeric,
  freight_type text,
  status text default 'pending',
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users(id) primary key,
  full_name text,
  phone text,
  address jsonb,
  avatar_url text,
  updated_at timestamp with time zone
);

-- Add columns if they don't exist (for updates)
DO $$
BEGIN
    -- Products columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='weight') THEN
        ALTER TABLE public.products ADD COLUMN weight numeric default 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='active') THEN
        ALTER TABLE public.products ADD COLUMN active boolean default true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='video') THEN
        ALTER TABLE public.products ADD COLUMN video text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='size_type') THEN
        ALTER TABLE public.products ADD COLUMN size_type text default 'clothing';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='slug') THEN
        ALTER TABLE public.products ADD COLUMN slug text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_bestseller') THEN
        ALTER TABLE public.products ADD COLUMN is_bestseller boolean default false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sales') THEN
        ALTER TABLE public.products ADD COLUMN sales integer default 0;
    END IF;

    -- Orders columns (just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_cpf') THEN
        ALTER TABLE public.orders ADD COLUMN customer_cpf text;
    END IF;
END $$;

-- RLS Policies (Drop first to avoid errors on re-run, or use IF NOT EXISTS if supported, but DROP is safer for policies)
-- We wrap in DO block to handle errors if they don't exist, or just ignore errors.
-- Simpler: Just try to create, if it fails it fails (but that stops the script).
-- Better: DROP IF EXISTS.

drop policy if exists "Public categories are viewable by everyone" on public.categories;
drop policy if exists "Public categories are insertable by everyone" on public.categories;
drop policy if exists "Public categories are updatable by everyone" on public.categories;

alter table public.categories enable row level security;
create policy "Public categories are viewable by everyone" on public.categories for select using (true);
create policy "Public categories are insertable by everyone" on public.categories for insert with check (true);
create policy "Public categories are updatable by everyone" on public.categories for update using (true);

drop policy if exists "Public products are viewable by everyone" on public.products;
drop policy if exists "Public products are insertable by everyone" on public.products;
drop policy if exists "Public products are updatable by everyone" on public.products;
drop policy if exists "Public products are deletable by everyone" on public.products;

alter table public.products enable row level security;
create policy "Public products are viewable by everyone" on public.products for select using (true);
create policy "Public products are insertable by everyone" on public.products for insert with check (true);
create policy "Public products are updatable by everyone" on public.products for update using (true);
create policy "Public products are deletable by everyone" on public.products for delete using (true);

drop policy if exists "Public orders are viewable by everyone" on public.orders;
drop policy if exists "Public orders are insertable by everyone" on public.orders;
drop policy if exists "Public orders are updatable by everyone" on public.orders;

alter table public.orders enable row level security;
create policy "Public orders are viewable by everyone" on public.orders for select using (true);
create policy "Public orders are insertable by everyone" on public.orders for insert with check (true);
create policy "Public orders are updatable by everyone" on public.orders for update using (true);

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
