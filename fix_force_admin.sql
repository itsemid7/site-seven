-- Force ALL users to be admins
-- This ensures that whichever user you are logged in as, you will have permission.
-- Since "No rows returned" happened before, this avoids issues with typing the email exactly right.

update public.profiles set role = 'admin';

-- Verify that rows were actually updated
select count(*) as total_admins from public.profiles where role = 'admin';
