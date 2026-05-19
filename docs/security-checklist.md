# Security checklist

Status da revisao: 2026-05-19.

Este checklist cobre os controles minimos para operar o SaaS sem vazamento entre tenants, sem exposicao de segredos e com webhooks confiaveis.

## Multi-tenant e RLS

- [x] Todas as entidades de negocio possuem `organization_id`.
- [x] As migrations habilitam `row level security` e `force row level security` nas tabelas do dominio.
- [x] As tabelas tenant-scoped possuem `unique (organization_id, id)` para permitir FKs compostas.
- [x] As queries server-side revisadas filtram por `organization_id` antes de ler ou gravar dados de negocio.
- [x] O script `npm run verify:tenant-schema` valida tabelas obrigatorias, RLS, policies, helpers e indices criticos.
- [x] `anon` nao recebe acesso amplo a tabelas no schema `public`.
- [ ] Antes de GA, adicionar testes de integracao com dois tenants reais tentando acessar dados cruzados.

## Autenticacao e autorizacao

- [x] Rotas e Server Actions de produto resolvem tenant no servidor via `requireOrganizationRole` ou `requireCurrentOrganizationId`.
- [x] Operacoes administrativas usam papeis (`owner`, `admin`, `agent`) no servidor.
- [x] `SUPABASE_SERVICE_ROLE_KEY` e usada apenas em Route Handlers server-side de webhook.
- [ ] Bloqueio por plano/status comercial ainda deve ser acoplado ao middleware de tenant antes da comercializacao.

## Webhooks

- [x] WhatsApp GET valida `hub.verify_token` contra `WHATSAPP_VERIFY_TOKEN`.
- [x] WhatsApp POST valida `x-hub-signature-256` com `WHATSAPP_APP_SECRET`.
- [x] WhatsApp resolve tenant por `business_settings.whatsapp_phone_number_id`.
- [x] Mercado Pago POST valida `x-signature` e `x-request-id` com `MERCADOPAGO_WEBHOOK_SECRET`.
- [x] Webhooks aplicam limite de tamanho de payload antes de processar conteudo.
- [x] Webhooks sao idempotentes: WhatsApp por `external_message_id`; Mercado Pago por `provider_payment_id`/`external_reference`.
- [x] Webhooks retornam `503` controlado quando secrets ou integrações obrigatorias nao estao configurados.
- [ ] Em escala, mover processamento pesado de webhook para fila/worker com retry controlado.

## Rate limiting

- [x] Existe rate limit basico por rota/IP para:
  - `GET /api/webhooks/whatsapp`
  - `POST /api/webhooks/whatsapp`
  - `POST /api/webhooks/mercadopago`
  - `POST /api/payments/mercadopago/create`
- [x] Identificadores de cliente sao hasheados antes de serem usados como chave interna.
- [ ] O rate limit atual e em memoria por instancia. Para producao com multiplas instancias, usar Vercel Firewall/WAF, Upstash Redis ou outro limitador distribuido.

## Logs e dados sensiveis

- [x] Tokens, secrets e payload bruto de webhooks nao sao logados.
- [x] Erros de envio do WhatsApp registram codigo/status do provedor sem token.
- [x] Falhas de webhook registram IDs operacionais e nomes de erro, nao corpo completo.
- [x] Telefones em logs de erro sao mascarados quando aparecem.
- [ ] Adicionar redacao centralizada para CPF, email e telefone caso novos endpoints passem a logar campos de cliente.

## IA e automacoes internas

- [x] O motor de IA recebe `tenantId`/`organizationId` no contexto.
- [x] Tools internas validam `organization_id` antes de criar agendamento, pagamento, handoff ou atualizar cliente.
- [x] Cobranca e agendamento exigem confirmacao clara antes de executar acao.
- [x] Prompt instrui a IA a nao revelar instrucoes internas e a pedir humano quando nao souber.
- [ ] Registrar uso de tokens/custo por organizacao antes de planos pagos em larga escala.

## Pagamentos

- [x] Criacao Pix exige usuario autenticado com papel `owner` ou `admin`.
- [x] Criacao Pix usa idempotency key local e no provedor.
- [x] Webhook consulta o pagamento real no Mercado Pago antes de atualizar status local.
- [x] Pagamentos sao atualizados com filtro por `organization_id`.
- [ ] Criar reconciliacao periodica para pagamentos pendentes/expirados.

## Aplicacao Next.js

- [x] Route Handlers sensiveis retornam erros JSON controlados.
- [x] Existe pagina de erro amigavel sem stack trace para usuario final.
- [x] Headers basicos de seguranca estao configurados em `next.config.ts`.
- [ ] Content Security Policy restritiva ainda precisa ser testada com Supabase, fontes, Mercado Pago e possiveis widgets antes de ativar.

## Banco, backups e operacao

- [x] Migrations ficam versionadas em `supabase/migrations`.
- [x] Indices compostos por tenant existem nas consultas criticas.
- [ ] Configurar backup automatico do Supabase antes de dados reais.
- [ ] Documentar e testar restore em ambiente de staging.
- [ ] Configurar alertas de erro, latencia e falha de webhook.

## Criterio minimo de producao

Antes de liberar clientes pagantes, estes itens devem estar verdes:

- [ ] Backup e restore testados.
- [ ] Rate limit distribuido configurado.
- [ ] Observabilidade/alertas configurados.
- [ ] Teste automatizado de isolamento entre dois tenants.
- [ ] Politica comercial de retencao/exclusao de dados definida.
