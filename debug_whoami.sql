-- Create a debug function to see who the DB thinks you are
create or replace function public.get_my_info()
returns json
language plpgsql
security definer
as $$
declare
  curr_id uuid;
  curr_role text;
  curr_email text;
begin
  curr_id := auth.uid();
  
  select role, email into curr_role, curr_email
  from public.profiles
  where id = curr_id;

  return json_build_object(
    'auth_uid', curr_id,
    'profile_role', curr_role,
    'profile_email', curr_email
  );
end;
$$;
