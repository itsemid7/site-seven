-- Disable RLS temporarily to debug visibility
alter table public.profiles disable row level security;

-- Check if there are any profiles
select count(*) from public.profiles;
