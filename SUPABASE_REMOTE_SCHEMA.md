# Supabase Remote Schema Check

Run this after migrations or dashboard edits:

```bash
npm run validate:supabase
```

Current known blockers on the remote project:

```text
public.users.generation_credits_used is missing
public.users.creem_customer_id is needed for Creem billing portal
public.users.creem_subscription_id is needed for Creem subscription sync
```

Fix it in Supabase SQL Editor:

```sql
alter table public.users
  add column if not exists generation_credits_used integer not null default 0;

update public.users
set generation_credits_used = 0
where generation_credits_used is null;

alter table public.users
  add column if not exists creem_customer_id text,
  add column if not exists creem_subscription_id text;

create index if not exists users_creem_customer_id_idx
  on public.users (creem_customer_id)
  where creem_customer_id is not null;

create index if not exists users_creem_subscription_id_idx
  on public.users (creem_subscription_id)
  where creem_subscription_id is not null;
```

Then rerun:

```bash
npm run validate:supabase
```
