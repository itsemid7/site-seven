-- Sync auth.users to public.profiles
-- This script finds any user in auth.users that is MISSING from public.profiles
-- and inserts them as an admin.

insert into public.profiles (id, email, full_name, role, created_at)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'full_name', email) as full_name,
  'admin' as role,
  created_at
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;

-- Also force everyone to be admin again, just to be sure
update public.profiles set role = 'admin';

-- Show the results
select count(*) as total_profiles from public.profiles;
