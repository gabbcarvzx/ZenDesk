# WhatsApp Cloud API

## Objetivo

Este modulo recebe mensagens do WhatsApp Cloud API, identifica a organizacao pelo `phone_number_id`, salva cliente/conversa/mensagens e responde usando o motor de IA interno.

## Variaveis de ambiente

Configure no ambiente server-side:

```bash
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_APP_SECRET=
WHATSAPP_GRAPH_API_VERSION=v25.0
```

`WHATSAPP_GRAPH_API_VERSION` e opcional. Os tokens nunca devem ser expostos no browser nem enviados em logs.

## URL do webhook

Use a rota:

```text
https://seu-dominio.com/api/webhooks/whatsapp
```

No painel da Meta, o token de verificacao deve ser igual a `WHATSAPP_VERIFY_TOKEN`.

## Mapeamento multi-tenant

Cada numero do WhatsApp precisa apontar explicitamente para uma organizacao. Depois de aplicar as migrations, preencha:

```sql
update public.business_settings
set whatsapp_phone_number_id = '<WHATSAPP_PHONE_NUMBER_ID>'
where organization_id = '<ORGANIZATION_ID>';
```

Essa coluna tem indice unico para impedir que o mesmo numero seja ligado a dois tenants.

## Fluxo do POST

1. Valida a assinatura `x-hub-signature-256` usando `WHATSAPP_APP_SECRET`.
2. Faz parse apenas de mensagens recebidas.
3. Ignora eventos sem mensagem, como status de entrega.
4. Resolve o tenant por `business_settings.whatsapp_phone_number_id`.
5. Cria ou atualiza o cliente pelo telefone do WhatsApp.
6. Cria ou reutiliza a conversa `channel = whatsapp`.
7. Salva a mensagem inbound com `external_message_id` para idempotencia.
8. Chama o motor de IA quando a conversa nao esta assumida por humano.
9. Salva a resposta da IA.
10. Envia a resposta pela Cloud API e atualiza o status da mensagem.

## Seguranca

- O endpoint POST rejeita payload sem assinatura valida.
- GET e POST aplicam rate limit basico por origem para reduzir abuso.
- O corpo do webhook nao e logado.
- Tokens e secrets nao sao logados.
- O `WHATSAPP_PHONE_NUMBER_ID` funciona como allowlist quando definido.
- A gravacao usa service role somente no servidor, porque webhooks externos nao possuem sessao de usuario.
- Toda gravacao continua levando `organization_id` resolvido no backend.

## Limitacoes iniciais

- Mensagens de midia sem legenda sao salvas como texto tecnico e tendem a pedir atendimento humano.
- O envio usa texto simples dentro da janela permitida pelo WhatsApp.
- Ainda nao ha tela para conectar numeros; o mapeamento inicial e feito via SQL.
- Status webhooks de entrega/leitura sao aceitos mas ignorados nesta primeira versao.
