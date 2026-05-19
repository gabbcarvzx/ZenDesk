alter table public.organizations
  add column if not exists plan_slug text not null default 'starter';

do $$
begin
  alter table public.organizations
    add constraint organizations_plan_slug_check
    check (plan_slug in ('starter', 'pro', 'business'));
exception when duplicate_object then null;
end $$;

create index if not exists organizations_plan_slug_idx
  on public.organizations (plan_slug);

create or replace function public.prevent_organization_plan_self_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if old.plan_slug is distinct from new.plan_slug
    and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'plan_slug cannot be changed through client updates';
  end if;

  return new;
end;
$$;

drop trigger if exists organizations_prevent_plan_self_change on public.organizations;
create trigger organizations_prevent_plan_self_change
  before update of plan_slug on public.organizations
  for each row execute function public.prevent_organization_plan_self_change();
