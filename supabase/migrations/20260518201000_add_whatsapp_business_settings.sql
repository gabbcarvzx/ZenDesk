alter table public.business_settings
  add column if not exists whatsapp_phone_number_id text;

create unique index if not exists business_settings_whatsapp_phone_number_unique_idx
  on public.business_settings (whatsapp_phone_number_id)
  where whatsapp_phone_number_id is not null;
