-- Migration: Create Products and Categories System
-- Description: Sets up the core tables for product management with RLS
-- Author: AI Assistant
-- Date: 2024-03-20

-- Enable necessary extensions
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- Drop existing tables if they exist (in reverse order of dependencies)
drop table if exists public.user_products;
drop table if exists public.products;

-- Create products table
create table public.products (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    default_category_id uuid references public.categories(id) not null,
    is_common boolean default false not null,
    created_by uuid references auth.users(id),
    created_at timestamp with time zone default now() not null
);

-- Add partial unique constraint for common products
create unique index unique_common_product_name on public.products (name) where is_common = true;

-- Create user_products table for user preferences and tracking
create table public.user_products (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) not null,
    product_id uuid references public.products(id) not null,
    preferred_category_id uuid references public.categories(id),
    last_used_at timestamp with time zone default now(),
    use_count integer default 0 not null,
    created_at timestamp with time zone default now() not null,
    unique(user_id, product_id)
);

-- Add product_id to shopping_list_items if the table exists
do $$
begin
    if exists (select 1 from information_schema.tables where table_name = 'shopping_list_items') then
        alter table public.shopping_list_items 
        add column if not exists product_id uuid references public.products(id);
    end if;
end $$;

-- Enable Row Level Security
alter table public.products enable row level security;
alter table public.user_products enable row level security;

-- Products Policies
create policy "Products are viewable by all authenticated users"
on public.products for select
to authenticated
using (true);

create policy "Users can create custom products"
on public.products for insert
to authenticated
with check (
    created_by = auth.uid() 
    and is_common = false
);

create policy "Users can update their own products"
on public.products for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "Users can delete their own products"
on public.products for delete
to authenticated
using (created_by = auth.uid());

-- User Products Policies
create policy "Users can view their own product preferences"
on public.user_products for select
to authenticated
using (user_id = auth.uid());

create policy "Users can create their own product preferences"
on public.user_products for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own product preferences"
on public.user_products for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own product preferences"
on public.user_products for delete
to authenticated
using (user_id = auth.uid());

-- Create indexes for better performance
create index if not exists idx_products_name on public.products using gin (name gin_trgm_ops);
create index if not exists idx_products_category on public.products(default_category_id);
create index if not exists idx_user_products_user on public.user_products(user_id);
create index if not exists idx_user_products_product on public.user_products(product_id);
create index if not exists idx_user_products_last_used on public.user_products(last_used_at); 