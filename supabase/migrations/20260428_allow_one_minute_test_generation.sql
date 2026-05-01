alter table public.generations
  drop constraint if exists generations_duration_minutes_check;

alter table public.generations
  add constraint generations_duration_minutes_check
  check (duration_minutes in (1, 5, 10, 15, 20));
