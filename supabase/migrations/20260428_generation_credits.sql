alter table public.users
  add column if not exists generation_credits_used integer not null default 0;

update public.users
set generation_credits_used = 0
where generation_credits_used is null;
