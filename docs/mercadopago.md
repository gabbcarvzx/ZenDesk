# Mercado Pago Pix

## Objetivo

Esta integracao inicial cria cobrancas Pix no Mercado Pago, salva o pagamento em `public.payments`, retorna link/QR Code quando a API disponibilizar e recebe webhooks para atualizar o status local.

## Variaveis de ambiente

Configure apenas no ambiente server-side:

```bash
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
```

Se as variaveis nao existirem, as rotas retornam erro controlado (`503`) e o restante do sistema continua funcionando.

## Rotas

### Criar cobranca Pix

```http
POST /api/payments/mercadopago/create
Content-Type: application/json
Idempotency-Key: opcional-ate-64-caracteres
```

Body:

```json
{
  "customerId": "uuid-do-cliente",
  "conversationId": "uuid-da-conversa-opcional",
  "amountCents": 12990,
  "description": "Servico ou produto vendido",
  "payerEmail": "cliente@email.com",
  "dueAt": "2026-05-19T20:00:00.000Z"
}
```

`payerEmail` e obrigatorio quando o cliente nao possui email cadastrado.

Resposta:

```json
{
  "idempotencyKey": "uuid",
  "payment": {
    "id": "uuid-local",
    "providerPaymentId": "id-mercado-pago",
    "status": "pending",
    "checkoutUrl": "https://...",
    "qrCode": "000201...",
    "qrCodeBase64": "..."
  }
}
```

### Webhook

```http
POST /api/webhooks/mercadopago
```

Configure esta URL no painel do Mercado Pago:

```text
https://seu-dominio.com/api/webhooks/mercadopago
```

O endpoint valida `x-signature` e `x-request-id` usando `MERCADOPAGO_WEBHOOK_SECRET`, consulta o pagamento real na API do Mercado Pago e entao atualiza o registro local.

## Idempotencia

- A criacao envia `X-Idempotency-Key` para o Mercado Pago.
- A mesma chave tambem e salva em `payments.metadata.idempotencyKey`.
- A migration `20260518203000_add_mercadopago_payment_idempotency.sql` cria indice unico por `organization_id` e chave de idempotencia para `provider = 'mercado_pago'`.
- Webhooks sao idempotentes porque atualizam o pagamento por `provider_payment_id` ou pelo `external_reference` local, sem criar novos pagamentos.

## Status local

Mapeamento inicial:

- `approved`, `accredited` -> `paid`
- `pending`, `in_process`, `authorized`, `in_mediation` -> `pending`
- `expired` -> `overdue`
- `cancelled`, `charged_back` -> `canceled`
- `refunded` -> `refunded`
- `rejected` -> `failed`

## Seguranca

- Tokens e secrets nao sao logados.
- O corpo bruto do webhook nao e logado.
- A criacao Pix e o webhook aplicam rate limit basico por origem.
- A criacao exige usuario autenticado com papel `owner` ou `admin`.
- O webhook usa service role apenas no servidor, pois chamadas externas nao possuem sessao de usuario.
- Toda gravacao em `payments` continua usando `organization_id`.

## Limitacoes iniciais

- Apenas Pix esta implementado.
- O QR Code base64 e salvo em metadata para permitir replay idempotente; em escala maior, pode ser movido para storage/cache.
- A UI de pagamentos ainda nao chama esta rota diretamente.
