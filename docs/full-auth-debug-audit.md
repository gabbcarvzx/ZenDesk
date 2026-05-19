# Full auth debug audit

Data: 2026-05-19.

## Resumo executivo

O `GET 304` visto em `/login` nao era a causa raiz do problema. `304 Not Modified` e uma resposta normal de cache/validacao do navegador e pode aparecer para assets ou navegacoes condicionais.

A falha real reproduzida no Supabase staging foi no cadastro com `supabase.auth.signUp`, que retornou:

```text
email rate limit exceeded
```

Isso impedia a criacao da conta antes do fluxo multi-tenant completar. Alem disso, o fluxo antigo criava o usuario Auth antes de criar organizacao/profile/settings; se qualquer etapa de banco falhasse, poderia sobrar usuario Auth sem tenant, causando login sem organizacao ativa e redirect de volta para `/login`.

## Causa real

- O cadastro usava `supabase.auth.signUp`.
- O projeto Supabase staging atingiu rate limit de email do provedor Auth.
- Quando `signUp` falhava, a conta nao era criada.
- Quando `signUp` criava usuario mas alguma etapa posterior falhava, o sistema podia ficar parcial.
- O login antigo nao validava se o usuario autenticado possuia `profile` e `organization` ativos antes de redirecionar para `/app/dashboard`.
- Nao havia `proxy.ts` para refresh de sessao/cookies Supabase no App Router.
- `/app` nao tinha pagina indice e retornava `404`.

## Correcoes aplicadas

### Cadastro

O cadastro agora usa fluxo server-side robusto:

1. Cria usuario via `serviceSupabase.auth.admin.createUser`.
2. Usa `email_confirm: true` para evitar o rate limit de envio de email no beta/staging.
3. Cria organizacao com `plan_slug = starter`.
4. Cria `profile` com `role = owner`.
5. Cria `business_settings` inicial.
6. Faz login com `signInWithPassword` para gravar cookies de sessao.
7. Redireciona para `/app/dashboard`.
8. Se qualquer etapa falhar, executa rollback do workspace e do usuario Auth.

### Login

O login agora:

- autentica com Supabase Auth;
- valida se existe `profile` ativo;
- valida se a organizacao vinculada esta ativa;
- faz `signOut` se a conta nao tiver tenant valido;
- retorna mensagem amigavel em vez de cair em loop de redirect;
- redireciona para `/app/dashboard` apenas quando a conta esta consistente.

### Sessao e cookies

Foi criado `src/proxy.ts` para atualizar sessao/cookies Supabase em paginas do app, sem depender dele como unica camada de autorizacao.

A protecao real continua no layout e nas Server Actions/Route Handlers.

### Rota `/app`

Foi criada `src/app/app/page.tsx` para redirecionar `/app` para `/app/dashboard`.

### API Pix

`POST /api/payments/mercadopago/create` agora autentica o usuario antes de validar payload de negocio. Sem sessao, retorna `401`.

## Arquivos alterados

- `src/features/auth/actions.ts`
- `src/features/auth/service.ts`
- `src/features/auth/service.test.ts`
- `src/features/auth/components/login-form.tsx`
- `src/features/auth/components/register-form.tsx`
- `src/lib/auth/guards.ts`
- `src/lib/auth/guards.test.ts`
- `src/lib/tenant.ts`
- `src/lib/tenant.test.ts`
- `src/app/app/layout.tsx`
- `src/app/app/page.tsx`
- `src/app/api/payments/mercadopago/create/route.ts`
- `src/proxy.ts`
- `docs/full-auth-debug-audit.md`

## Bugs encontrados

- Cadastro dependia de `signUp` e podia ser bloqueado por rate limit de email.
- Cadastro podia deixar estado parcial quando Auth criava usuario e banco falhava depois.
- Login redirecionava para dashboard sem garantir profile/organizacao ativos.
- Conta Auth sem tenant podia ficar presa em redirect para login sem mensagem util.
- `/app` retornava `404`.
- Rota Pix validava payload antes de autenticar.
- Nao havia proxy de refresh de sessao Supabase para App Router.

## Testes adicionados

### `src/features/auth/service.test.ts`

Cobre:

- cadastro bem-sucedido;
- erro de cadastro por Auth;
- rollback quando criacao de workspace falha;
- rollback quando criacao de sessao falha;
- login bem-sucedido;
- login com credenciais invalidas;
- login bloqueado quando usuario nao possui tenant ativo.

### `src/lib/auth/guards.test.ts`

Cobre:

- redirect sem sessao/profile;
- liberacao com profile ativo;
- comportamento local quando Supabase nao esta configurado.

### `src/lib/tenant.test.ts`

Cobre:

- acesso dentro da mesma organizacao;
- bloqueio cross-tenant;
- permissoes de owner/admin/agent;
- billing restrito ao owner.

## Validacao Supabase staging real

### Variaveis

Sem imprimir valores sensiveis:

- `NEXT_PUBLIC_SUPABASE_URL`: set
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: set
- `SUPABASE_SERVICE_ROLE_KEY`: set
- `NEXT_PUBLIC_APP_URL`: set
- Mercado Pago: ausente neste ambiente, esperado retornar `503` controlado.
- WhatsApp: variaveis principais set.

### Schema real

Consultas com service role:

- `organizations.plan_slug`: ok
- `profiles`: ok
- `business_settings`: ok

### Probe antigo

Fluxo antigo com `signUp`:

- `signup=ERROR AuthApiError email rate limit exceeded`

### Probe novo

Fluxo novo com `auth.admin.createUser`:

- `admin_create_user=ok`
- `organization=ok`
- `profile=ok`
- `business_settings=ok`
- `login=ok`
- `cleanup=done`

### Isolamento multi-tenant real

Foram criados dois tenants descartaveis e removidos no fim.

Resultado:

- `tenant_own_read=ok`
- `tenant_cross_read=blocked`
- `tenant_cross_insert=blocked`
- `tenant_cleanup=done`

## Testes E2E HTTP locais

### Cadastro via `/register`

Formulario HTML + Server Action real:

- `register_get=200`
- `register_post=303`
- `register_location=/app/dashboard`
- `register_set_cookie=yes`
- `register_org_created=1`
- `register_e2e_cleanup=done`

### Login via `/login`

Formulario HTML + Server Action real:

- `login_get=200`
- `login_post=303`
- `login_location=/app/dashboard`
- `login_set_cookie=yes`
- `dashboard_with_login_cookie=200`
- `login_e2e_cleanup=done`

## Smoke HTTP das rotas principais

Sem sessao autenticada:

- `GET / => 200`
- `GET /pricing => 200`
- `GET /login => 200`
- `GET /register => 200`
- `GET /app => 307`
- `GET /app/dashboard => 307`
- `GET /app/settings/business => 307`
- `GET /app/catalog => 307`
- `GET /app/customers => 307`
- `GET /app/conversations => 307`
- `GET /app/appointments => 307`
- `GET /app/payments => 307`
- `GET /app/ai/playground => 307`
- `GET /api/webhooks/whatsapp => 403`
- `POST /api/webhooks/mercadopago => 503`
- `POST /api/payments/mercadopago/create => 401`

Interpretacao:

- Rotas publicas carregam.
- Rotas `/app/*` protegem corretamente sem sessao.
- WhatsApp sem challenge/token valido rejeita com `403`.
- Mercado Pago sem variaveis retorna `503` controlado.
- Criacao Pix sem sessao retorna `401`.

## Comandos executados

- `npm run lint`: passou.
- `npm test`: passou, 11 arquivos e 43 testes.
- `npm run build`: passou.
- `npm run verify:tenant-schema`: passou.
- `npm audit --omit=dev --audit-level=moderate`: passou, 0 vulnerabilidades.

## Resultado final

O fluxo autenticado principal foi corrigido e validado:

- cadastro cria usuario, organizacao, profile e settings;
- cadastro faz login e redireciona;
- cadastro possui rollback contra estado parcial;
- login cria sessao/cookies;
- login bloqueia conta sem tenant ativo com mensagem amigavel;
- `/app/dashboard` abre com cookie de login real;
- rotas protegidas redirecionam sem sessao;
- RLS/tenant isolation foram validados com dois tenants reais descartaveis.

## Pendencias restantes

- Decidir se, em producao, o cadastro publico deve confirmar email automaticamente ou usar fluxo com confirmacao por email. Para beta/staging, `auth.admin.createUser` com `email_confirm: true` remove o bloqueio de rate limit.
- Configurar rate limiting especifico para Server Actions de login/cadastro antes de abrir cadastro publico.
- Adicionar E2E formal com Playwright no CI para login/cadastro/dashboard.
- Monitorar Supabase Auth logs em staging durante os primeiros cadastros beta.
- Manter migrations aplicadas no Supabase antes de testar novos fluxos.
