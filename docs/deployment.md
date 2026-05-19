# Deployment

Guia de deploy para Vercel + Supabase.

## 1. Preparar ambiente

Instale dependencias e rode a verificacao local:

```bash
npm install
npm run lint
npm run verify:tenant-schema
npm test
npm run build
```

Se algum comando falhar, corrija antes de publicar.

## 2. Configurar Supabase

1. Crie projetos separados para staging e production.
2. Aplique as migrations em `supabase/migrations`.
3. Confirme que RLS esta habilitado e forçado nas tabelas.
4. Confirme que `anon` nao possui permissao ampla em tabelas de negocio.
5. Ative backups automaticos no projeto de producao.
6. Teste restore em staging antes de inserir dados reais.

## 3. Configurar Vercel

Build command:

```bash
npm run build
```

Install command:

```bash
npm install
```

Runtime:

- Next.js App Router.
- Route Handlers de webhook usam `runtime = "nodejs"` porque validam HMAC e integram SDK/fetch server-side.

## 4. Variaveis na Vercel

Configure em Production e, quando existir, tambem em Preview/Staging com valores separados.

Obrigatorias para o app base:

```bash
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
APP_ENV=production
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

IA:

```bash
OPENAI_API_KEY=
```

WhatsApp:

```bash
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_APP_SECRET=
WHATSAPP_GRAPH_API_VERSION=
```

Mercado Pago:

```bash
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
```

Nunca crie variavel `NEXT_PUBLIC_` para tokens, secrets, service role ou access tokens privados.

## 5. Configurar webhooks

WhatsApp Cloud API:

```text
https://seu-dominio.com/api/webhooks/whatsapp
```

- Use `WHATSAPP_VERIFY_TOKEN` como token de verificacao.
- Garanta que `business_settings.whatsapp_phone_number_id` esteja preenchido para a organizacao correta.

Mercado Pago:

```text
https://seu-dominio.com/api/webhooks/mercadopago
```

- Configure o secret usado por `MERCADOPAGO_WEBHOOK_SECRET`.
- Use ambiente sandbox antes de chaves reais.

## 6. Pos-deploy

Rode smoke tests:

1. Acesse a home e paginas publicas.
2. Acesse uma rota `/app/*` sem sessao e confirme protecao.
3. Entre com usuario de teste e confirme que dados pertencem somente ao tenant atual.
4. Crie cliente, conversa, agendamento e pagamento manual.
5. Teste o playground de IA.
6. Simule webhook com assinatura invalida e confirme `401`.
7. Simule payload grande e confirme `413`.
8. Verifique logs e confirme que nenhum token, secret ou payload bruto foi registrado.

## 7. Rollback

- Use rollback de deployment na Vercel quando a falha for de aplicacao.
- Para falha de schema, aplique migration corretiva; evite editar migration ja aplicada.
- Se uma integracao externa estiver instavel, remova/desative apenas as variaveis da feature para retornar `503` controlado nas rotas afetadas.

## 8. Riscos residuais conhecidos

- Rate limiting atual e em memoria por instancia. Para alto volume, configurar limitador distribuido.
- CSP restritiva ainda nao esta ativa.
- Observabilidade e alertas precisam ser conectados antes de escala comercial.
- Plano/assinatura e bloqueio por billing ainda sao etapas de produto pendentes.
