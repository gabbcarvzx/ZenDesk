alter table public.products
  add column if not exists category text,
  add column if not exists stock_quantity integer;

alter table public.services
  add column if not exists category text;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%status%'
  loop
    execute format('alter table public.products drop constraint %I', constraint_record.conname);
  end loop;
end $$;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.services'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%status%'
  loop
    execute format('alter table public.services drop constraint %I', constraint_record.conname);
  end loop;
end $$;

alter table public.products
  add constraint products_status_check
  check (status in ('active', 'inactive'));

alter table public.products
  add constraint products_stock_quantity_check
  check (stock_quantity is null or stock_quantity >= 0);

alter table public.services
  add constraint services_status_check
  check (status in ('active', 'inactive'));

create index if not exists products_organization_category_idx
  on public.products (organization_id, category);

create index if not exists services_organization_category_idx
  on public.services (organization_id, category);
