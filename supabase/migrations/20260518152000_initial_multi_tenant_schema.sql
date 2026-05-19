-- Initial multi-tenant schema.
-- Security model:
-- 1. Every business table is scoped by organization_id.
-- 2. profiles.user_id is unique, so each authenticated user belongs to one organization.
-- 3. RLS policies only allow access to rows from the authenticated user's organization.
-- 4. Composite foreign keys include organization_id to prevent cross-tenant references.

create extension if not exists pgcrypto;

do $$
begin
  create type public.organization_status as enum ('active', 'suspended', 'deleted');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.profile_role as enum ('owner', 'admin', 'agent');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.profile_status as enum ('active', 'invited', 'removed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.customer_lifecycle_status as enum (
    'new',
    'qualified',
    'negotiating',
    'customer',
    'lost',
    'inactive'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.channel_type as enum ('manual', 'whatsapp', 'web');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.conversation_status as enum (
    'open',
    'waiting_customer',
    'waiting_human',
    'closed'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_direction as enum ('inbound', 'outbound');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_sender_type as enum ('customer', 'user', 'ai', 'system');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_status as enum ('draft', 'sent', 'delivered', 'read', 'failed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.appointment_status as enum (
    'requested',
    'scheduled',
    'confirmed',
    'completed',
    'canceled',
    'no_show'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_status as enum (
    'pending',
    'paid',
    'overdue',
    'canceled',
    'refunded',
    'failed'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ai_knowledge_status as enum ('draft', 'active', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.handoff_status as enum ('open', 'assigned', 'resolved', 'canceled');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  plan_slug text not null default 'starter'
    check (plan_slug in ('starter', 'pro', 'business')),
  status public.organization_status not null default 'active',
  timezone text not null default 'America/Sao_Paulo',
  owner_user_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists organizations_slug_unique_idx
  on public.organizations (lower(slug));

create index if not exists organizations_owner_user_id_idx
  on public.organizations (owner_user_id);

create index if not exists organizations_status_idx
  on public.organizations (status);

create index if not exists organizations_plan_slug_idx
  on public.organizations (plan_slug);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  full_name text,
  avatar_url text,
  role public.profile_role not null default 'agent',
  status public.profile_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);

create index if not exists profiles_organization_id_role_idx
  on public.profiles (organization_id, role);

create index if not exists profiles_user_id_status_idx
  on public.profiles (user_id, status);

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  business_name text not null,
  business_description text,
  industry text,
  timezone text not null default 'America/Sao_Paulo',
  default_language text not null default 'pt-BR',
  tone_of_voice text,
  human_handoff_rules text,
  ai_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  name text not null,
  phone text,
  email text,
  source text not null default 'manual',
  lifecycle_status public.customer_lifecycle_status not null default 'new',
  tags text[] not null default '{}',
  notes text,
  last_interaction_at timestamptz,
  next_follow_up_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);

create unique index if not exists customers_organization_phone_unique_idx
  on public.customers (organization_id, phone)
  where phone is not null;

create index if not exists customers_organization_lifecycle_idx
  on public.customers (organization_id, lifecycle_status);

create index if not exists customers_organization_follow_up_idx
  on public.customers (organization_id, next_follow_up_at);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  name text not null,
  description text,
  sku text,
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'BRL',
  status text not null default 'active' check (status in ('active', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);

create unique index if not exists products_organization_sku_unique_idx
  on public.products (organization_id, sku)
  where sku is not null;

create index if not exists products_organization_status_idx
  on public.products (organization_id, status);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  name text not null,
  description text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'BRL',
  status text not null default 'active' check (status in ('active', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);

create index if not exists services_organization_status_idx
  on public.services (organization_id, status);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  customer_id uuid,
  channel public.channel_type not null default 'manual',
  status public.conversation_status not null default 'open',
  assigned_profile_id uuid,
  external_thread_id text,
  last_message_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint conversations_customer_same_org_fk
    foreign key (organization_id, customer_id)
    references public.customers (organization_id, id)
    on delete restrict,
  constraint conversations_assigned_profile_same_org_fk
    foreign key (organization_id, assigned_profile_id)
    references public.profiles (organization_id, id)
    on delete restrict
);

create index if not exists conversations_organization_status_idx
  on public.conversations (organization_id, status);

create index if not exists conversations_organization_customer_idx
  on public.conversations (organization_id, customer_id);

create index if not exists conversations_organization_last_message_idx
  on public.conversations (organization_id, last_message_at desc);

create unique index if not exists conversations_external_thread_unique_idx
  on public.conversations (organization_id, channel, external_thread_id)
  where external_thread_id is not null;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  conversation_id uuid not null,
  customer_id uuid,
  direction public.message_direction not null,
  sender_type public.message_sender_type not null,
  sender_profile_id uuid,
  body text not null,
  external_message_id text,
  status public.message_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint messages_conversation_same_org_fk
    foreign key (organization_id, conversation_id)
    references public.conversations (organization_id, id)
    on delete cascade,
  constraint messages_customer_same_org_fk
    foreign key (organization_id, customer_id)
    references public.customers (organization_id, id)
    on delete restrict,
  constraint messages_sender_profile_same_org_fk
    foreign key (organization_id, sender_profile_id)
    references public.profiles (organization_id, id)
    on delete restrict
);

create index if not exists messages_organization_conversation_created_idx
  on public.messages (organization_id, conversation_id, created_at);

create unique index if not exists messages_external_message_unique_idx
  on public.messages (organization_id, external_message_id)
  where external_message_id is not null;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  customer_id uuid not null,
  service_id uuid,
  conversation_id uuid,
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz,
  status public.appointment_status not null default 'requested',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  check (scheduled_end_at is null or scheduled_end_at > scheduled_start_at),
  constraint appointments_customer_same_org_fk
    foreign key (organization_id, customer_id)
    references public.customers (organization_id, id)
    on delete restrict,
  constraint appointments_service_same_org_fk
    foreign key (organization_id, service_id)
    references public.services (organization_id, id)
    on delete restrict,
  constraint appointments_conversation_same_org_fk
    foreign key (organization_id, conversation_id)
    references public.conversations (organization_id, id)
    on delete restrict
);

create index if not exists appointments_organization_schedule_idx
  on public.appointments (organization_id, scheduled_start_at);

create index if not exists appointments_organization_status_idx
  on public.appointments (organization_id, status);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  customer_id uuid not null,
  conversation_id uuid,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'BRL',
  status public.payment_status not null default 'pending',
  provider text not null default 'manual',
  provider_payment_id text,
  description text,
  due_at timestamptz,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint payments_customer_same_org_fk
    foreign key (organization_id, customer_id)
    references public.customers (organization_id, id)
    on delete restrict,
  constraint payments_conversation_same_org_fk
    foreign key (organization_id, conversation_id)
    references public.conversations (organization_id, id)
    on delete restrict
);

create index if not exists payments_organization_status_idx
  on public.payments (organization_id, status);

create index if not exists payments_organization_due_idx
  on public.payments (organization_id, due_at);

create unique index if not exists payments_provider_payment_unique_idx
  on public.payments (organization_id, provider, provider_payment_id)
  where provider_payment_id is not null;

create table if not exists public.ai_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  title text not null,
  content text not null,
  source_type text not null default 'manual' check (source_type in ('manual', 'faq', 'url', 'file')),
  status public.ai_knowledge_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);

create index if not exists ai_knowledge_base_organization_status_idx
  on public.ai_knowledge_base (organization_id, status);

create table if not exists public.human_handoffs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  conversation_id uuid not null,
  customer_id uuid,
  requested_by_message_id uuid,
  assigned_profile_id uuid,
  status public.handoff_status not null default 'open',
  reason text,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint human_handoffs_conversation_same_org_fk
    foreign key (organization_id, conversation_id)
    references public.conversations (organization_id, id)
    on delete cascade,
  constraint human_handoffs_customer_same_org_fk
    foreign key (organization_id, customer_id)
    references public.customers (organization_id, id)
    on delete restrict,
  constraint human_handoffs_message_same_org_fk
    foreign key (organization_id, requested_by_message_id)
    references public.messages (organization_id, id)
    on delete restrict,
  constraint human_handoffs_assigned_profile_same_org_fk
    foreign key (organization_id, assigned_profile_id)
    references public.profiles (organization_id, id)
    on delete restrict
);

create index if not exists human_handoffs_organization_status_idx
  on public.human_handoffs (organization_id, status);

create index if not exists human_handoffs_organization_conversation_idx
  on public.human_handoffs (organization_id, conversation_id);

create or replace function public.prevent_organization_owner_change()
returns trigger
language plpgsql
as $$
begin
  if old.owner_user_id <> new.owner_user_id then
    raise exception 'owner_user_id cannot be changed through client updates';
  end if;

  return new;
end;
$$;

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

create or replace function public.prevent_profile_identity_change()
returns trigger
language plpgsql
as $$
begin
  if old.user_id <> new.user_id then
    raise exception 'profile user_id cannot be changed';
  end if;

  if old.organization_id <> new.organization_id then
    raise exception 'profile organization_id cannot be changed';
  end if;

  return new;
end;
$$;

create or replace function public.current_user_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.organization_id
  from public.profiles p
  where p.user_id = auth.uid()
    and p.status = 'active'
  limit 1;
$$;

create or replace function public.current_user_role()
returns public.profile_role
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.role
  from public.profiles p
  where p.user_id = auth.uid()
    and p.status = 'active'
  limit 1;
$$;

create or replace function public.is_member_of_organization(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(public.current_user_organization_id() = target_organization_id, false);
$$;

create or replace function public.has_organization_role(required_roles public.profile_role[])
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(public.current_user_role() = any(required_roles), false);
$$;

do $$
declare
  table_name text;
  trigger_name text;
begin
  foreach table_name in array array[
    'organizations',
    'profiles',
    'business_settings',
    'customers',
    'products',
    'services',
    'conversations',
    'messages',
    'appointments',
    'payments',
    'ai_knowledge_base',
    'human_handoffs'
  ]
  loop
    trigger_name := table_name || '_set_updated_at';
    execute format('drop trigger if exists %I on public.%I', trigger_name, table_name);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      trigger_name,
      table_name
    );
  end loop;
end $$;

drop trigger if exists organizations_prevent_owner_change on public.organizations;
create trigger organizations_prevent_owner_change
  before update on public.organizations
  for each row execute function public.prevent_organization_owner_change();

drop trigger if exists organizations_prevent_plan_self_change on public.organizations;
create trigger organizations_prevent_plan_self_change
  before update of plan_slug on public.organizations
  for each row execute function public.prevent_organization_plan_self_change();

drop trigger if exists profiles_prevent_identity_change on public.profiles;
create trigger profiles_prevent_identity_change
  before update on public.profiles
  for each row execute function public.prevent_profile_identity_change();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.business_settings enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.services enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.ai_knowledge_base enable row level security;
alter table public.human_handoffs enable row level security;

alter table public.organizations force row level security;
alter table public.profiles force row level security;
alter table public.business_settings force row level security;
alter table public.customers force row level security;
alter table public.products force row level security;
alter table public.services force row level security;
alter table public.conversations force row level security;
alter table public.messages force row level security;
alter table public.appointments force row level security;
alter table public.payments force row level security;
alter table public.ai_knowledge_base force row level security;
alter table public.human_handoffs force row level security;

drop policy if exists organizations_select_same_org on public.organizations;
create policy organizations_select_same_org
  on public.organizations
  for select
  to authenticated
  using (
    id = public.current_user_organization_id()
    or owner_user_id = auth.uid()
  );

drop policy if exists organizations_insert_owned on public.organizations;
create policy organizations_insert_owned
  on public.organizations
  for insert
  to authenticated
  with check (owner_user_id = auth.uid());

drop policy if exists organizations_update_admin on public.organizations;
create policy organizations_update_admin
  on public.organizations
  for update
  to authenticated
  using (
    id = public.current_user_organization_id()
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  )
  with check (
    id = public.current_user_organization_id()
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

drop policy if exists profiles_select_same_org on public.profiles;
create policy profiles_select_same_org
  on public.profiles
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_member_of_organization(organization_id)
  );

drop policy if exists profiles_insert_owner_bootstrap on public.profiles;
create policy profiles_insert_owner_bootstrap
  on public.profiles
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and status = 'active'
    and exists (
      select 1
      from public.organizations o
      where o.id = organization_id
        and o.owner_user_id = auth.uid()
    )
  );

drop policy if exists profiles_update_owner_same_org on public.profiles;
create policy profiles_update_owner_same_org
  on public.profiles
  for update
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner']::public.profile_role[])
    and user_id <> auth.uid()
  )
  with check (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner']::public.profile_role[])
  );

drop policy if exists profiles_delete_owner_same_org on public.profiles;
create policy profiles_delete_owner_same_org
  on public.profiles
  for delete
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner']::public.profile_role[])
    and user_id <> auth.uid()
  );

drop policy if exists business_settings_select_same_org on public.business_settings;
create policy business_settings_select_same_org
  on public.business_settings
  for select
  to authenticated
  using (public.is_member_of_organization(organization_id));

drop policy if exists business_settings_insert_admin_same_org on public.business_settings;
create policy business_settings_insert_admin_same_org
  on public.business_settings
  for insert
  to authenticated
  with check (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

drop policy if exists business_settings_update_admin_same_org on public.business_settings;
create policy business_settings_update_admin_same_org
  on public.business_settings
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

drop policy if exists business_settings_delete_owner_same_org on public.business_settings;
create policy business_settings_delete_owner_same_org
  on public.business_settings
  for delete
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner']::public.profile_role[])
  );

drop policy if exists products_select_same_org on public.products;
create policy products_select_same_org
  on public.products
  for select
  to authenticated
  using (public.is_member_of_organization(organization_id));

drop policy if exists products_insert_admin_same_org on public.products;
create policy products_insert_admin_same_org
  on public.products
  for insert
  to authenticated
  with check (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

drop policy if exists products_update_admin_same_org on public.products;
create policy products_update_admin_same_org
  on public.products
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

drop policy if exists products_delete_admin_same_org on public.products;
create policy products_delete_admin_same_org
  on public.products
  for delete
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

drop policy if exists services_select_same_org on public.services;
create policy services_select_same_org
  on public.services
  for select
  to authenticated
  using (public.is_member_of_organization(organization_id));

drop policy if exists services_insert_admin_same_org on public.services;
create policy services_insert_admin_same_org
  on public.services
  for insert
  to authenticated
  with check (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

drop policy if exists services_update_admin_same_org on public.services;
create policy services_update_admin_same_org
  on public.services
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

drop policy if exists services_delete_admin_same_org on public.services;
create policy services_delete_admin_same_org
  on public.services
  for delete
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

drop policy if exists ai_knowledge_base_select_same_org on public.ai_knowledge_base;
create policy ai_knowledge_base_select_same_org
  on public.ai_knowledge_base
  for select
  to authenticated
  using (public.is_member_of_organization(organization_id));

drop policy if exists ai_knowledge_base_insert_admin_same_org on public.ai_knowledge_base;
create policy ai_knowledge_base_insert_admin_same_org
  on public.ai_knowledge_base
  for insert
  to authenticated
  with check (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

drop policy if exists ai_knowledge_base_update_admin_same_org on public.ai_knowledge_base;
create policy ai_knowledge_base_update_admin_same_org
  on public.ai_knowledge_base
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

drop policy if exists ai_knowledge_base_delete_admin_same_org on public.ai_knowledge_base;
create policy ai_knowledge_base_delete_admin_same_org
  on public.ai_knowledge_base
  for delete
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

drop policy if exists customers_select_same_org on public.customers;
create policy customers_select_same_org
  on public.customers
  for select
  to authenticated
  using (public.is_member_of_organization(organization_id));

drop policy if exists customers_insert_same_org on public.customers;
create policy customers_insert_same_org
  on public.customers
  for insert
  to authenticated
  with check (public.is_member_of_organization(organization_id));

drop policy if exists customers_update_same_org on public.customers;
create policy customers_update_same_org
  on public.customers
  for update
  to authenticated
  using (public.is_member_of_organization(organization_id))
  with check (public.is_member_of_organization(organization_id));

drop policy if exists customers_delete_admin_same_org on public.customers;
create policy customers_delete_admin_same_org
  on public.customers
  for delete
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

drop policy if exists conversations_select_same_org on public.conversations;
create policy conversations_select_same_org
  on public.conversations
  for select
  to authenticated
  using (public.is_member_of_organization(organization_id));

drop policy if exists conversations_insert_same_org on public.conversations;
create policy conversations_insert_same_org
  on public.conversations
  for insert
  to authenticated
  with check (public.is_member_of_organization(organization_id));

drop policy if exists conversations_update_same_org on public.conversations;
create policy conversations_update_same_org
  on public.conversations
  for update
  to authenticated
  using (public.is_member_of_organization(organization_id))
  with check (public.is_member_of_organization(organization_id));

drop policy if exists conversations_delete_admin_same_org on public.conversations;
create policy conversations_delete_admin_same_org
  on public.conversations
  for delete
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

drop policy if exists messages_select_same_org on public.messages;
create policy messages_select_same_org
  on public.messages
  for select
  to authenticated
  using (public.is_member_of_organization(organization_id));

drop policy if exists messages_insert_same_org on public.messages;
create policy messages_insert_same_org
  on public.messages
  for insert
  to authenticated
  with check (public.is_member_of_organization(organization_id));

drop policy if exists messages_update_same_org on public.messages;
create policy messages_update_same_org
  on public.messages
  for update
  to authenticated
  using (public.is_member_of_organization(organization_id))
  with check (public.is_member_of_organization(organization_id));

drop policy if exists messages_delete_admin_same_org on public.messages;
create policy messages_delete_admin_same_org
  on public.messages
  for delete
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

drop policy if exists appointments_select_same_org on public.appointments;
create policy appointments_select_same_org
  on public.appointments
  for select
  to authenticated
  using (public.is_member_of_organization(organization_id));

drop policy if exists appointments_insert_same_org on public.appointments;
create policy appointments_insert_same_org
  on public.appointments
  for insert
  to authenticated
  with check (public.is_member_of_organization(organization_id));

drop policy if exists appointments_update_same_org on public.appointments;
create policy appointments_update_same_org
  on public.appointments
  for update
  to authenticated
  using (public.is_member_of_organization(organization_id))
  with check (public.is_member_of_organization(organization_id));

drop policy if exists appointments_delete_admin_same_org on public.appointments;
create policy appointments_delete_admin_same_org
  on public.appointments
  for delete
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

drop policy if exists payments_select_same_org on public.payments;
create policy payments_select_same_org
  on public.payments
  for select
  to authenticated
  using (public.is_member_of_organization(organization_id));

drop policy if exists payments_insert_admin_same_org on public.payments;
create policy payments_insert_admin_same_org
  on public.payments
  for insert
  to authenticated
  with check (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

drop policy if exists payments_update_admin_same_org on public.payments;
create policy payments_update_admin_same_org
  on public.payments
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

drop policy if exists payments_delete_owner_same_org on public.payments;
create policy payments_delete_owner_same_org
  on public.payments
  for delete
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner']::public.profile_role[])
  );

drop policy if exists human_handoffs_select_same_org on public.human_handoffs;
create policy human_handoffs_select_same_org
  on public.human_handoffs
  for select
  to authenticated
  using (public.is_member_of_organization(organization_id));

drop policy if exists human_handoffs_insert_same_org on public.human_handoffs;
create policy human_handoffs_insert_same_org
  on public.human_handoffs
  for insert
  to authenticated
  with check (public.is_member_of_organization(organization_id));

drop policy if exists human_handoffs_update_same_org on public.human_handoffs;
create policy human_handoffs_update_same_org
  on public.human_handoffs
  for update
  to authenticated
  using (public.is_member_of_organization(organization_id))
  with check (public.is_member_of_organization(organization_id));

drop policy if exists human_handoffs_delete_admin_same_org on public.human_handoffs;
create policy human_handoffs_delete_admin_same_org
  on public.human_handoffs
  for delete
  to authenticated
  using (
    public.is_member_of_organization(organization_id)
    and public.has_organization_role(array['owner', 'admin']::public.profile_role[])
  );

revoke all on all tables in schema public from anon;
revoke all on table
  public.organizations,
  public.profiles,
  public.business_settings,
  public.customers,
  public.products,
  public.services,
  public.conversations,
  public.messages,
  public.appointments,
  public.payments,
  public.ai_knowledge_base,
  public.human_handoffs
from anon;

grant usage on schema public to authenticated;

grant select, insert, update, delete on table
  public.organizations,
  public.profiles,
  public.business_settings,
  public.customers,
  public.products,
  public.services,
  public.conversations,
  public.messages,
  public.appointments,
  public.payments,
  public.ai_knowledge_base,
  public.human_handoffs
to authenticated;

revoke all on function public.current_user_organization_id() from public;
revoke all on function public.current_user_role() from public;
revoke all on function public.is_member_of_organization(uuid) from public;
revoke all on function public.has_organization_role(public.profile_role[]) from public;

grant execute on function public.current_user_organization_id() to authenticated, service_role;
grant execute on function public.current_user_role() to authenticated, service_role;
grant execute on function public.is_member_of_organization(uuid) to authenticated, service_role;
grant execute on function public.has_organization_role(public.profile_role[]) to authenticated, service_role;
