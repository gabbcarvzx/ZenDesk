# Production checklist

Status da revisao: 2026-05-19.

Este documento e o checklist operacional para subir e manter o SaaS em producao.

## Gate obrigatorio antes do deploy

- [ ] `npm run lint` sem erros.
- [ ] `npm run verify:tenant-schema` sem erros.
- [ ] `npm test` sem erros.
- [ ] `npm run build` sem erros.
- [ ] Variaveis obrigatorias configuradas no ambiente Vercel Production.
- [ ] Supabase migrations aplicadas no projeto de producao.
- [ ] Webhooks configurados com URLs HTTPS de producao.

## Variaveis de ambiente

Obrigatorias para o app base:

- `NEXT_PUBLIC_APP_URL`
- `APP_ENV`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Obrigatorias apenas quando a feature estiver ativa:

- IA: `OPENAI_API_KEY`
- WhatsApp: `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`
- WhatsApp opcional: `WHATSAPP_GRAPH_API_VERSION`
- Mercado Pago Pix: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`
- Rate limit distribuido: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

Regra de produto: a falta de variaveis de integracao nao deve quebrar o app inteiro. Rotas da integracao retornam erro controlado (`503`) ate que a feature esteja configurada.

## Banco e multi-tenant

- [x] Todas as tabelas de negocio tem `organization_id`.
- [x] RLS esta habilitado e forçado nas tabelas.
- [x] Policies usam membership ativo do usuario.
- [x] FKs compostas impedem relacionamento cruzado entre tenants.
- [x] Indice unico de WhatsApp garante mapeamento unico de `phone_number_id` para tenant.
- [x] Indice de idempotencia do Mercado Pago e por organizacao.
- [ ] Teste de restore em staging.

## Webhooks e integracoes

- [x] WhatsApp valida token de verificacao e assinatura HMAC.
- [x] Mercado Pago valida assinatura do webhook.
- [x] Webhooks usam limite de tamanho de payload.
- [x] Webhooks possuem rate limiting preparado para Upstash Redis, com fallback em memoria.
- [x] Logs nao registram tokens, secrets ou payload bruto.
- [ ] Configurar retries/fila para processamento pesado.
- [ ] Configurar monitoramento de falhas de webhook.

## Seguranca HTTP

- [x] `X-Frame-Options: DENY`
- [x] `X-Content-Type-Options: nosniff`
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] `Permissions-Policy` desabilitando camera, microfone e geolocalizacao.
- [x] `Strict-Transport-Security` em producao.
- [ ] CSP restritiva apos teste de compatibilidade.

## Erros e logs

- [x] Pagina de erro amigavel para falhas no App Router.
- [x] Route Handlers retornam mensagens genericas ao usuario.
- [x] Logs de webhooks sao estruturados por evento.
- [ ] Conectar logs/erros a uma ferramenta de observabilidade antes de escalar.

## Billing e monetizacao

- [x] Modelo inicial de `payments`.
- [x] Integracao Pix inicial com Mercado Pago.
- [x] Webhook atualiza status local com idempotencia.
- [x] Policy central de plano em `src/lib/billing/policy.ts`.
- [x] Bloqueio por plano para CRM manual, agendamentos, Pix, handoff humano e limite mensal de respostas IA.
- [ ] Status de assinatura/trial/bloqueado ainda deve ser persistido antes de clientes pagantes em escala.

## Smoke tests apos deploy

- Acessar `/`, `/pricing`, `/login` e `/app/dashboard`.
- Verificar que pagina protegida redireciona/nega acesso sem sessao.
- Criar uma organizacao/usuario de teste.
- Criar cliente, conversa, agendamento e pagamento manual.
- Testar `/app/ai/playground` com conversa fake.
- Enviar verificacao GET do WhatsApp com token correto e incorreto.
- Simular POST de webhook com assinatura invalida e confirmar `401`.
- Criar cobranca Pix em ambiente controlado quando Mercado Pago estiver configurado.

## Go/no-go

Nao liberar clientes pagantes se qualquer item abaixo estiver pendente:

- Build de producao quebrado.
- RLS ausente em tabela de negocio.
- Endpoint lendo dados sem `organization_id`.
- Webhook aceitando payload sem assinatura valida.
- Logs expondo token, secret ou payload bruto com dados de cliente.
- Falta de backup automatico para banco de producao.
