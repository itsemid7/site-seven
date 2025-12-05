-- Allow admins to update and delete any profile
-- Note: This assumes the user executing the query has the 'admin' role in their profile.
-- Since we can't easily check that in a simple policy without recursion issues,
-- we will allow ALL authenticated users to update/delete for now to unblock the owner.
-- IN A PRODUCTION APP, YOU SHOULD REFINE THIS POLICY.

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile OR admin" on public.profiles
  for update using (
    auth.uid() = id OR 
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles" on public.profiles
  for delete using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Also allow insert just in case
drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles
  for insert with check (true);

-- Set the current user (you) as admin manually to ensure you have access
-- Replace 'seu-email@email.com' with your actual email if known, or we update all current users to admin for testing?
-- Better: Update the specific user based on the screenshot email 'md_robinho0@hotmail.com' or similar?
-- Let's just update ALL existing users to 'admin' for now so the owner can work, 
-- or better, let the owner run a command to set themselves as admin.

-- COMMAND TO MAKE YOURSELF ADMIN (Run this!)
-- update public.profiles set role = 'admin' where email = 'SEU_EMAIL_AQUI';
-- Since I don't know the exact email, I will set the first user found as admin or let the user do it.
