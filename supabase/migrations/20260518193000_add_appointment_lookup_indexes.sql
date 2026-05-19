create index if not exists appointments_organization_customer_schedule_idx
  on public.appointments (organization_id, customer_id, scheduled_start_at desc);

create index if not exists appointments_organization_service_schedule_idx
  on public.appointments (organization_id, service_id, scheduled_start_at desc)
  where service_id is not null;

create index if not exists appointments_organization_conversation_idx
  on public.appointments (organization_id, conversation_id)
  where conversation_id is not null;
