create unique index if not exists payments_organization_mercadopago_idempotency_unique_idx
  on public.payments (organization_id, (metadata->>'idempotencyKey'))
  where provider = 'mercado_pago'
    and metadata ? 'idempotencyKey';
