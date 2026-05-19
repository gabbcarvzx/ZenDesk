create index if not exists payments_organization_customer_created_idx
  on public.payments (organization_id, customer_id, created_at desc);

create index if not exists payments_organization_conversation_created_idx
  on public.payments (organization_id, conversation_id, created_at desc)
  where conversation_id is not null;

create index if not exists payments_organization_provider_idx
  on public.payments (organization_id, provider);
