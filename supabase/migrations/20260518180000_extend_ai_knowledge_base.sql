do $$
begin
  if not exists (
    select 1
    from pg_enum enum_value
    join pg_type enum_type on enum_type.oid = enum_value.enumtypid
    join pg_namespace enum_schema on enum_schema.oid = enum_type.typnamespace
    where enum_schema.nspname = 'public'
      and enum_type.typname = 'ai_knowledge_status'
      and enum_value.enumlabel = 'inactive'
  ) then
    alter type public.ai_knowledge_status add value 'inactive';
  end if;
end $$;

alter table public.ai_knowledge_base
  add column if not exists category text,
  add column if not exists priority integer not null default 3;

do $$
begin
  alter table public.ai_knowledge_base
    add constraint ai_knowledge_base_priority_check
    check (priority between 1 and 10);
exception when duplicate_object then null;
end $$;

create index if not exists ai_knowledge_base_organization_category_idx
  on public.ai_knowledge_base (organization_id, category);

create index if not exists ai_knowledge_base_organization_priority_idx
  on public.ai_knowledge_base (organization_id, priority, created_at desc);

drop policy if exists ai_knowledge_base_insert_admin_same_org on public.ai_knowledge_base;
create policy ai_knowledge_base_insert_owner_same_org
  on public.ai_knowledge_base
  for insert
  to authenticated
  with check (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner']::public.profile_role[])
  );

drop policy if exists ai_knowledge_base_update_admin_same_org on public.ai_knowledge_base;
create policy ai_knowledge_base_update_owner_same_org
  on public.ai_knowledge_base
  for update
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner']::public.profile_role[])
  )
  with check (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner']::public.profile_role[])
  );

drop policy if exists ai_knowledge_base_delete_admin_same_org on public.ai_knowledge_base;
create policy ai_knowledge_base_delete_owner_same_org
  on public.ai_knowledge_base
  for delete
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner']::public.profile_role[])
  );
