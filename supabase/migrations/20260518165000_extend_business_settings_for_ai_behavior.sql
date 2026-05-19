alter table public.business_settings
  add column if not exists address text,
  add column if not exists business_hours text,
  add column if not exists important_rules text,
  add column if not exists welcome_message text,
  add column if not exists human_handoff_message text,
  add column if not exists cancellation_policy text,
  add column if not exists instagram_url text,
  add column if not exists google_maps_url text;

do $$
begin
  alter table public.business_settings
    add constraint business_settings_tone_of_voice_check
    check (
      tone_of_voice is null
      or tone_of_voice in ('profissional', 'amigavel', 'vendedor', 'informal')
    );
exception when duplicate_object then null;
end $$;

create index if not exists business_settings_organization_ai_enabled_idx
  on public.business_settings (organization_id, ai_enabled);
