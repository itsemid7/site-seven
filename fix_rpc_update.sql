-- Create a secure RPC function to update profiles
-- This function runs with "security definer" privileges, bypassing RLS on the table.
-- It manually checks if the executing user is an admin.

create or replace function public.update_profile_admin(
  target_id uuid,
  new_name text,
  new_phone text,
  new_role text
)
returns json
language plpgsql
security definer
as $$
declare
  current_role text;
begin
  -- Get the role of the user making the request
  select role into current_role from public.profiles where id = auth.uid();
  
  -- Check if they are an admin
  if current_role is null or current_role <> 'admin' then
    raise exception 'Permissão negada: Apenas administradores podem realizar esta ação.';
  end if;

  -- Perform the update
  update public.profiles
  set 
    full_name = new_name,
    phone = new_phone,
    role = new_role
  where id = target_id;

  return json_build_object('success', true);
end;
$$;
