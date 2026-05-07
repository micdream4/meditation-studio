alter table public.users
  drop constraint if exists users_subscription_plan_check;

alter table public.users
  add constraint users_subscription_plan_check
  check (
    subscription_plan in ('basic', 'plus', 'pro', 'monthly', 'yearly')
    or subscription_plan is null
  );
