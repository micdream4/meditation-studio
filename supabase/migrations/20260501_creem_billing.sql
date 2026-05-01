alter table public.users
  add column if not exists creem_customer_id text,
  add column if not exists creem_subscription_id text;

create index if not exists users_creem_customer_id_idx
  on public.users (creem_customer_id)
  where creem_customer_id is not null;

create index if not exists users_creem_subscription_id_idx
  on public.users (creem_subscription_id)
  where creem_subscription_id is not null;
