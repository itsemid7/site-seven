-- Add created_at column if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'created_at') then
        alter table public.profiles add column created_at timestamp with time zone default timezone('utc'::text, now()) not null;
    end if;
end $$;

-- Enable RLS again (Security Best Practice)
alter table public.profiles enable row level security;
