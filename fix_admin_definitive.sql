-- Create a secure function to check admin status (bypasses RLS)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Re-create policies using the new function
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Users can update own profile OR admin" on public.profiles;

create policy "Admins can update any profile" on public.profiles
  for update using (
    public.is_admin() OR auth.uid() = id
  );

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles" on public.profiles
  for delete using (
    public.is_admin()
  );
