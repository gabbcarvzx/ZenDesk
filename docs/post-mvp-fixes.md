# Post-MVP fixes para beta

Data: 2026-05-19.

## Objetivo

Este pacote corrige riscos de beta que estavam pendentes na auditoria do MVP:

- enforcement server-side de plano/billing;
- rate limiting preparado para ambiente distribuido;
- fluxo Pix real na UI de pagamentos;
- documentacao operacional para o beta.

## Enforcement de plano

A policy central fica em `src/lib/billing/policy.ts`.

Planos atuais:

- `starter`: 500 respostas IA/mes, 1 numero WhatsApp, IA basica, produtos/servicos e playground.
- `pro`: 3.000 respostas IA/mes, Pix, agenda, CRM, handoff humano, IA avancada.
- `business`: 15.000 respostas IA/mes, 3 numeros WhatsApp, multiplos atendentes, analytics avancado, automacoes e suporte prioritario.

Fonte de verdade do plano:

- `organizations.plan_slug`
- valores permitidos: `starter`, `pro`, `business`
- default: `starter`
- trigger `organizations_prevent_plan_self_change` impede autopromocao de plano via client Supabase; mudanca de plano deve ser feita pelo backend de billing com service role.

Migration adicionada:

- `supabase/migrations/20260519110000_add_billing_plan_to_organizations.sql`

Pontos bloqueados server-side:

| Recurso | Starter | Pro | Business | Enforcement |
| --- | --- | --- | --- | --- |
| Respostas IA mensais | 500 | 3.000 | 15.000 | WhatsApp webhook e playground |
| CRM manual | bloqueado | liberado | liberado | `/app/customers` actions |
| Agendamentos | bloqueado | liberado | liberado | UI, actions e tool interna |
| Pix Mercado Pago | bloqueado | liberado | liberado | rota API e UI |
| Cobranca manual | bloqueado | liberado | liberado | server action de pagamentos |
| Handoff humano | bloqueado | liberado | liberado | actions e tool interna |

Decisao de produto: clientes ainda podem ser criados automaticamente por WhatsApp e atualizados pela IA para captura basica de contato, porque isso e parte do funil minimo mesmo no Starter. O CRM manual completo fica bloqueado no Starter.

## Rate limiting

`src/lib/rate-limit.ts` agora expoe `enforceRateLimit`.

Comportamento:

- Se `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` existirem, usa Upstash Redis REST com janela fixa.
- Se Upstash falhar ou nao estiver configurado, usa fallback em memoria para nao quebrar o app.
- Chaves de cliente continuam hashadas e nao expõem IP bruto em storage/logs.

Variaveis novas:

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Recomendacao de beta: configurar Upstash Redis antes de abrir trafego externo. O fallback em memoria e aceitavel apenas para desenvolvimento e demos controladas.

## Pix na UI

A tela `/app/payments` agora permite:

- criar cobranca manual;
- criar Pix Mercado Pago pelo botao "Criar Pix Mercado Pago";
- chamar diretamente `POST /api/payments/mercadopago/create`;
- exibir status retornado;
- exibir link de pagamento;
- exibir QR Code base64 quando disponivel;
- exibir codigo Pix copia e cola quando disponivel.

Regras:

- cliente precisa ter email cadastrado para criar Pix;
- metodo selecionado precisa ser `Pix`;
- rota exige usuario `owner` ou `admin`;
- rota exige plano Pro ou Business;
- se Mercado Pago nao estiver configurado, a rota retorna `503` controlado.

## Pendencias antes do beta pago

- Persistir status comercial da assinatura: `trial`, `active`, `past_due`, `blocked`.
- Enforcar status comercial no tenant middleware/layout.
- Criar reconciliador de pagamentos pendentes/expirados.
- Registrar uso de tokens e custo de IA por organizacao.
- Testar dois tenants reais tentando acessar dados cruzados.
- Configurar observabilidade e alertas.

## Validacao

Rodada executada em 2026-05-19:

- `npm run lint`: passou.
- `npm test`: passou, 8 arquivos e 29 testes.
- `npm run build`: passou.
- `npm run verify:tenant-schema`: passou.
