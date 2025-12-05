-- Simplify RLS to guarantee Admin access
-- Drop existing update policy
drop policy if exists "Users can update own profile OR admin" on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;

-- Create a simpler, more permissive policy for admins
create policy "Admins can update any profile" on public.profiles
  for update using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Keep the self-update policy
create policy "Users can update own profile" on public.profiles
  for update using (
    auth.uid() = id
  );

-- Ensure the user is actually an admin (redundant but safe)
-- update public.profiles set role = 'admin' where email = 'emidalmeida@outlook.com';
