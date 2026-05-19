# Checklist de validacao autenticada com Supabase staging

Data base: 2026-05-19.

Objetivo: validar o fluxo autenticado completo em um projeto Supabase staging real, garantindo que cadastro, login, organizacao, RLS, isolamento multi-tenant e modulos principais funcionem antes de liberar beta.

## 1. Preparacao do ambiente

- [ ] Criar projeto Supabase exclusivo para staging.
- [ ] Confirmar que staging nao aponta para banco de producao.
- [ ] Aplicar todas as migrations de `supabase/migrations`.
- [ ] Rodar `npm run verify:tenant-schema` localmente antes de testar.
- [ ] Configurar variaveis locais apontando para staging:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_APP_URL`
  - [ ] `APP_ENV=staging`
- [ ] Confirmar que nenhuma variavel server-only usa prefixo `NEXT_PUBLIC_`.
- [ ] Configurar URL do site no Supabase Auth para o dominio/localhost usado no teste.
- [ ] Configurar redirect URLs permitidas no Supabase Auth:
  - [ ] `http://localhost:3000/**`
  - [ ] URL de staging da Vercel, se existir.
- [ ] Decidir se email confirmation ficara ativo no staging.

## 2. Validacao das tabelas principais

No Supabase SQL Editor, confirmar que existem:

- [ ] `organizations`
- [ ] `profiles`
- [ ] `business_settings`
- [ ] `customers`
- [ ] `conversations`
- [ ] `messages`
- [ ] `products`
- [ ] `services`
- [ ] `appointments`
- [ ] `payments`
- [ ] `ai_knowledge_base`
- [ ] `human_handoffs`

Confirmar colunas criticas:

- [ ] Todas as tabelas de negocio possuem `organization_id`.
- [ ] `organizations.plan_slug` existe e default e `starter`.
- [ ] `profiles.user_id` e unico.
- [ ] Tabelas tenant-scoped possuem `unique (organization_id, id)`.
- [ ] FKs compostas com `organization_id` existem nas relacoes criticas.
- [ ] Indice unico de WhatsApp por `whatsapp_phone_number_id` existe.
- [ ] Indice de idempotencia Mercado Pago por organizacao existe.

## 3. RLS e policies

Para cada tabela principal:

- [ ] RLS esta habilitado.
- [ ] Force RLS esta habilitado.
- [ ] Existe ao menos uma policy por tabela.
- [ ] `anon` nao possui acesso amplo ao schema public.
- [ ] `authenticated` acessa apenas dados da propria organizacao.

Testes SQL recomendados:

- [ ] Conferir `pg_tables`/dashboard Supabase para RLS enabled.
- [ ] Conferir policies de `organizations`, `profiles`, `customers`, `conversations`, `messages`, `payments`.
- [ ] Confirmar que `organizations_update_admin` nao permite autopromocao de plano por causa do trigger `organizations_prevent_plan_self_change`.
- [ ] Confirmar que alteracao de `owner_user_id` e bloqueada.
- [ ] Confirmar que alteracao de `profiles.organization_id` e bloqueada.

## 4. Criacao de usuario e organizacao

Fluxo pelo app:

- [ ] Acessar `/register`.
- [ ] Criar usuario com email novo de staging.
- [ ] Informar nome realista da organizacao.
- [ ] Usar senha valida com no minimo 8 caracteres.
- [ ] Se email confirmation estiver ativo, confirmar email antes do login.

Validar no Supabase:

- [ ] Usuario foi criado em `auth.users`.
- [ ] Uma linha foi criada em `organizations`.
- [ ] `organizations.owner_user_id` aponta para o usuario criado.
- [ ] `organizations.status = active`.
- [ ] `organizations.plan_slug = starter`.
- [ ] Uma linha foi criada em `profiles`.
- [ ] `profiles.user_id` aponta para o usuario.
- [ ] `profiles.organization_id` aponta para a organizacao.
- [ ] `profiles.role = owner`.
- [ ] `profiles.status = active`.
- [ ] Uma linha foi criada em `business_settings`.
- [ ] `business_settings.organization_id` aponta para a organizacao.
- [ ] `business_settings.business_name` corresponde ao nome informado.

Possiveis falhas:

- [ ] Usuario criado sem profile.
- [ ] Profile criado sem organizacao.
- [ ] Organizacao criada sem `business_settings`.
- [ ] Erro por `SUPABASE_SERVICE_ROLE_KEY` ausente.
- [ ] Erro por email confirmation ativo e usuario tentando logar antes de confirmar.

## 5. Login e logout

Login:

- [ ] Acessar `/login`.
- [ ] Entrar com email/senha do usuario staging.
- [ ] Confirmar redirecionamento para `/app/dashboard`.
- [ ] Confirmar que layout interno mostra organizacao correta.
- [ ] Acessar diretamente `/app/customers` autenticado.
- [ ] Acessar diretamente `/app/payments` autenticado.

Logout:

- [ ] Clicar em sair.
- [ ] Confirmar redirecionamento para `/login`.
- [ ] Tentar acessar `/app/dashboard` apos logout.
- [ ] Confirmar redirecionamento/bloqueio sem sessao.
- [ ] Confirmar que cookies de sessao nao mantem acesso indevido.

Possiveis falhas:

- [ ] Login retorna sucesso mas profile nao e encontrado.
- [ ] Sessao expirada causa erro bruto em vez de redirect.
- [ ] Logout nao invalida sessao.
- [ ] Usuario autenticado sem organizacao acessa area interna.

## 6. Dashboard

Com usuario autenticado:

- [ ] Acessar `/app/dashboard`.
- [ ] Confirmar que a pagina carrega sem fallback indevido.
- [ ] Confirmar metricas zeradas quando tenant ainda nao tem dados.
- [ ] Criar dados de teste e confirmar atualizacao:
  - [ ] cliente
  - [ ] conversa
  - [ ] mensagem
  - [ ] agendamento
  - [ ] pagamento
- [ ] Confirmar que metricas contam apenas dados do tenant logado.
- [ ] Confirmar que erros de query nao exibem stack trace.

Possiveis falhas:

- [ ] Dashboard mistura dados de outro tenant.
- [ ] Cards quebram com valores nulos.
- [ ] Grafico quebra com volume zero.
- [ ] Query sem `organization_id`.

## 7. Fluxo CRUD das tabelas principais

Clientes:

- [ ] Criar cliente manual em `/app/customers` com nome, telefone, email, origem, tags e observacoes.
- [ ] Editar cliente.
- [ ] Buscar por nome.
- [ ] Buscar por telefone.
- [ ] Buscar por email.
- [ ] Confirmar `customers.organization_id` correto.

Conversas:

- [ ] Criar conversa manual em `/app/conversations`.
- [ ] Confirmar criacao de `conversations`.
- [ ] Confirmar criacao de primeira `messages`.
- [ ] Assumir conversa se plano permitir.
- [ ] Devolver para IA se plano permitir.
- [ ] Enviar resposta manual se plano permitir.

Catalogo:

- [ ] Criar produto.
- [ ] Criar servico.
- [ ] Confirmar que produtos/servicos aparecem no contexto da IA.
- [ ] Confirmar `organization_id` correto.

Agenda:

- [ ] Em plano Starter, confirmar bloqueio de criacao.
- [ ] Alterar tenant para `pro` via service role.
- [ ] Criar agendamento.
- [ ] Editar agendamento.
- [ ] Cancelar agendamento.
- [ ] Confirmar vinculo com cliente e servico.

Pagamentos:

- [ ] Em plano Starter, confirmar bloqueio de Pix/cobranca.
- [ ] Alterar tenant para `pro` via service role.
- [ ] Criar cobranca manual.
- [ ] Se Mercado Pago sandbox estiver configurado, criar Pix.
- [ ] Confirmar `payments.provider`, `provider_payment_id`, `metadata.idempotencyKey`.
- [ ] Confirmar que UI exibe status, link e QR Code quando disponiveis.

IA playground:

- [ ] Criar mensagem fake em `/app/ai/playground`.
- [ ] Confirmar persistencia em `conversations`.
- [ ] Confirmar persistencia em `messages`.
- [ ] Confirmar limite mensal de mensagens IA por plano.
- [ ] Confirmar que contexto debug nao vaza para cliente final.

## 8. Isolamento multi-tenant

Criar dois tenants:

- [ ] Tenant A com usuario A.
- [ ] Tenant B com usuario B.
- [ ] Criar dados em cada tenant:
  - [ ] cliente
  - [ ] conversa
  - [ ] mensagem
  - [ ] produto
  - [ ] servico
  - [ ] agendamento
  - [ ] pagamento

Validar pelo app:

- [ ] Usuario A nao ve clientes do tenant B.
- [ ] Usuario A nao ve conversas do tenant B.
- [ ] Usuario A nao ve mensagens do tenant B.
- [ ] Usuario A nao ve pagamentos do tenant B.
- [ ] Usuario A nao ve agenda do tenant B.
- [ ] Usuario B nao ve dados do tenant A.

Testes negativos diretos:

- [ ] Copiar ID de cliente do tenant B e tentar abrir/usar no tenant A.
- [ ] Copiar ID de conversa do tenant B e tentar vincular pagamento no tenant A.
- [ ] Copiar ID de servico do tenant B e tentar criar agendamento no tenant A.
- [ ] Copiar ID de pagamento do tenant B e tentar consultar/alterar no tenant A.
- [ ] Confirmar que todas as tentativas falham ou retornam vazio.

Falha critica:

- [ ] Qualquer vazamento entre tenants deve bloquear o beta ate correcao.

## 9. Testes RLS com cliente anon/authenticated

Usando Supabase client com anon key e usuario autenticado:

- [ ] Sem login, tentar ler `customers`: deve negar/retornar vazio.
- [ ] Sem login, tentar inserir `customers`: deve negar.
- [ ] Logado como tenant A, tentar inserir `customers` com `organization_id` do tenant B: deve negar.
- [ ] Logado como tenant A, tentar atualizar linha do tenant B: deve negar.
- [ ] Logado como tenant A, tentar criar `messages` em conversa do tenant B: deve negar por FK/RLS.
- [ ] Logado como tenant A, tentar mudar `organizations.plan_slug`: deve negar pelo trigger.

Usando service role:

- [ ] Confirmar que service role consegue operar tarefas administrativas previstas.
- [ ] Confirmar que service role nao e usado em componentes client-side.
- [ ] Confirmar que logs nao imprimem service role.

## 10. Billing e plano

- [ ] Novo tenant nasce como `starter`.
- [ ] Starter consegue usar recursos basicos.
- [ ] Starter nao cria CRM manual completo, agenda, Pix ou handoff humano.
- [ ] Alterar `organizations.plan_slug` para `pro` usando SQL/service role administrativo.
- [ ] Pro libera CRM, agenda, Pix e handoff humano.
- [ ] Alterar para `business` usando SQL/service role administrativo.
- [ ] Business herda recursos Pro.
- [ ] Tentar alterar plano pelo app/client: deve falhar.

Possiveis falhas:

- [ ] Owner consegue alterar o proprio plano.
- [ ] Starter acessa recurso Pro via Server Action.
- [ ] UI bloqueia, mas API permite.
- [ ] API bloqueia, mas mensagem de erro e confusa.

## 11. Webhooks em staging

WhatsApp:

- [ ] GET `/api/webhooks/whatsapp` com token correto retorna challenge.
- [ ] GET com token incorreto retorna `403`.
- [ ] POST sem assinatura retorna `401`.
- [ ] POST com assinatura invalida retorna `401`.
- [ ] POST com phone number sem mapping retorna resposta segura.
- [ ] POST duplicado por `external_message_id` nao duplica mensagem.

Mercado Pago:

- [ ] POST `/api/webhooks/mercadopago` sem secret configurado retorna `503`.
- [ ] POST com assinatura invalida retorna `401` quando secret existe.
- [ ] Webhook valido atualiza pagamento local correto.
- [ ] Webhook nao cria pagamento em tenant errado.

Rate limit:

- [ ] Sem Upstash, confirmar funcionamento local com fallback em memoria.
- [ ] Com Upstash, confirmar que chamadas excedentes recebem `429`.
- [ ] Confirmar que logs nao expõem IP bruto nem token.

## 12. Logs e erros

- [ ] Erros de login nao revelam se email existe.
- [ ] Erros de cadastro nao imprimem senha.
- [ ] Webhooks nao logam payload bruto.
- [ ] Tokens e secrets nao aparecem em logs.
- [ ] Telefones aparecem mascarados quando logados.
- [ ] Falhas de Supabase mostram mensagem amigavel na UI.
- [ ] Route Handlers retornam JSON controlado.
- [ ] Pagina de erro global aparece em falhas inesperadas.

## 13. Checklist go/no-go do beta

Liberar beta somente se:

- [ ] Cadastro cria usuario, organizacao, profile e settings corretamente.
- [ ] Login/logout funcionam.
- [ ] Usuario sem sessao nao acessa `/app`.
- [ ] Dois tenants nao enxergam dados um do outro.
- [ ] RLS esta habilitado e forçado nas tabelas principais.
- [ ] APIs e Server Actions bloqueiam acesso cross-tenant.
- [ ] Plano Starter nao acessa recursos Pro por API.
- [ ] Plano nao pode ser autopromovido por owner/admin.
- [ ] Dashboard nao mistura dados.
- [ ] CRUD principal funciona em tenant real.
- [ ] Webhooks rejeitam assinatura invalida.
- [ ] Logs nao vazam segredos.
- [ ] `npm run lint` passa.
- [ ] `npm test` passa.
- [ ] `npm run build` passa.
- [ ] `npm run verify:tenant-schema` passa.

Bloquear beta se:

- [ ] Qualquer query retornar dados de outro tenant.
- [ ] Qualquer usuario alterar `organization_id`, `owner_user_id` ou `plan_slug` indevidamente.
- [ ] Qualquer webhook aceitar payload sem validacao.
- [ ] Qualquer token/secret aparecer em log.
- [ ] Build de producao falhar.
