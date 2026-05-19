create extension if not exists pg_trgm;
create extension if not exists btree_gin;

create index if not exists customers_organization_name_trgm_idx
  on public.customers using gin (organization_id, lower(name) gin_trgm_ops);

create index if not exists customers_organization_email_trgm_idx
  on public.customers using gin (organization_id, lower(email) gin_trgm_ops)
  where email is not null;

create index if not exists customers_organization_phone_trgm_idx
  on public.customers using gin (organization_id, lower(phone) gin_trgm_ops)
  where phone is not null;

create index if not exists customers_organization_source_idx
  on public.customers (organization_id, source);

create index if not exists customers_organization_tags_gin_idx
  on public.customers using gin (organization_id, tags);
