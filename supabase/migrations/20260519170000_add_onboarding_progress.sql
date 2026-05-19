create table if not exists public.onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  current_step text not null default 'welcome',
  completed_steps text[] not null default '{}',
  payload jsonb not null default '{}'::jsonb,
  demo_mode_enabled boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);

do $$
begin
  alter table public.onboarding_progress
    add constraint onboarding_progress_current_step_check
    check (
      current_step in (
        'welcome',
        'business',
        'niche',
        'hours',
        'catalog',
        'ai',
        'whatsapp',
        'pix',
        'ai-test',
        'finish'
      )
    );
exception when duplicate_object then null;
end $$;

create index if not exists onboarding_progress_organization_step_idx
  on public.onboarding_progress (organization_id, current_step);

create index if not exists onboarding_progress_organization_completed_idx
  on public.onboarding_progress (organization_id, completed_at);

drop trigger if exists onboarding_progress_set_updated_at on public.onboarding_progress;
create trigger onboarding_progress_set_updated_at
  before update on public.onboarding_progress
  for each row execute function public.set_updated_at();

alter table public.onboarding_progress enable row level security;
alter table public.onboarding_progress force row level security;

drop policy if exists onboarding_progress_select_same_org on public.onboarding_progress;
create policy onboarding_progress_select_same_org
  on public.onboarding_progress
  for select
  to authenticated
  using (public.is_member_of_organization(organization_id));

drop policy if exists onboarding_progress_insert_admin_same_org on public.onboarding_progress;
create policy onboarding_progress_insert_admin_same_org
  on public.onboarding_progress
  for insert
  to authenticated
  with check (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

drop policy if exists onboarding_progress_update_admin_same_org on public.onboarding_progress;
create policy onboarding_progress_update_admin_same_org
  on public.onboarding_progress
  for update
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  )
  with check (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

drop policy if exists onboarding_progress_delete_owner_same_org on public.onboarding_progress;
create policy onboarding_progress_delete_owner_same_org
  on public.onboarding_progress
  for delete
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner']::public.profile_role[])
  );

grant select, insert, update, delete on table public.onboarding_progress to authenticated;
