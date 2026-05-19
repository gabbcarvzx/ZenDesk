# Modelo de banco de dados

## Objetivo

Este schema define a fundação multi-tenant do SaaS. A unidade de isolamento é `organizations.id`, referenciada como `organization_id` em todas as entidades de negócio.

Regra principal: nenhum usuário autenticado pode ler, criar, atualizar ou excluir dados de outra organização.

## Arquivo SQL

A migration inicial está em:

- `supabase/migrations/20260518152000_initial_multi_tenant_schema.sql`

## Decisões de isolamento

- Cada usuário pertence a uma única organização nesta fase.
- O vínculo fica em `profiles.user_id`, que é `unique`.
- Toda tabela operacional possui `organization_id uuid not null`.
- Todas as tabelas sensíveis têm Row Level Security habilitado e forçado.
- Todas as políticas RLS usam a organização do usuário autenticado.
- Relacionamentos críticos usam foreign keys compostas com `organization_id`.
- A role `anon` não recebe acesso às tabelas.
- A role `authenticated` só acessa dados permitidos pelas políticas RLS.

## Funções de segurança no banco

### `public.current_user_organization_id()`

Retorna o `organization_id` do profile ativo associado ao `auth.uid()`.

### `public.current_user_role()`

Retorna o papel do usuário autenticado na organização atual.

Papéis:

- `owner`
- `admin`
- `agent`

### `public.is_member_of_organization(target_organization_id uuid)`

Retorna `true` somente quando o usuário autenticado pertence à organização informada.

### `public.has_organization_role(required_roles profile_role[])`

Retorna `true` quando o usuário autenticado possui um dos papéis exigidos.

Essas funções são `SECURITY DEFINER` para evitar recursão de RLS em `profiles`, mas retornam apenas dados derivados do usuário autenticado.

## Tabelas

### organizations

Representa o tenant.

Campos principais:

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid | PK |
| name | text | Obrigatório |
| slug | text | Único por índice em `lower(slug)` |
| status | organization_status | active, suspended, deleted |
| timezone | text | Default `America/Sao_Paulo` |
| owner_user_id | uuid | FK para `auth.users.id` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Atualizado por trigger |

RLS:

- Usuário lê apenas a própria organização.
- Usuário pode criar organização somente com `owner_user_id = auth.uid()`.
- Apenas `owner` e `admin` atualizam a organização.
- Alteração de `owner_user_id` por client update é bloqueada por trigger.

### profiles

Representa o usuário interno da organização.

Campos principais:

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid | PK |
| user_id | uuid | FK para `auth.users.id`, único |
| organization_id | uuid | FK para `organizations.id` |
| full_name | text | Opcional |
| avatar_url | text | Opcional |
| role | profile_role | owner, admin, agent |
| status | profile_status | active, invited, removed |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Atualizado por trigger |

Regras:

- `user_id` único garante uma organização por usuário nesta fase.
- `unique (organization_id, id)` permite foreign keys compostas tenant-safe.
- Alteração de `user_id` e `organization_id` é bloqueada por trigger.

RLS:

- Usuário lê o próprio profile e profiles da própria organização.
- Bootstrap permite criar o primeiro profile `owner` para organização criada pelo próprio usuário.
- Apenas `owner` pode atualizar ou remover outros profiles da organização.
- Usuário não pode excluir o próprio profile via client.

### business_settings

Configuração operacional da organização.

Campos principais:

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid | PK |
| organization_id | uuid | FK única para `organizations.id` |
| business_name | text | Obrigatório |
| business_description | text | Contexto do negócio |
| industry | text | Segmento |
| address | text | Endereço exibido ou usado pela IA |
| business_hours | text | Horário de funcionamento |
| timezone | text | Default `America/Sao_Paulo` |
| default_language | text | Default `pt-BR` |
| tone_of_voice | text | profissional, amigavel, vendedor, informal |
| human_handoff_rules | text | Regras para humano |
| important_rules | text | Regras importantes do atendimento |
| welcome_message | text | Mensagem de boas-vindas |
| human_handoff_message | text | Mensagem quando humano precisa assumir |
| cancellation_policy | text | Política de cancelamento |
| instagram_url | text | Link do Instagram |
| google_maps_url | text | Link do Google Maps |
| ai_enabled | boolean | Default `false` |
| metadata | jsonb | Default `{}` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Atualizado por trigger |

RLS:

- Membros da organização leem.
- Apenas `owner` e `admin` criam ou atualizam.
- Apenas `owner` exclui.

### customers

Clientes finais ou leads.

Campos principais:

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid | PK |
| organization_id | uuid | FK para `organizations.id` |
| name | text | Obrigatório |
| phone | text | Único por organização quando informado |
| email | text | Opcional |
| source | text | Default `manual` |
| lifecycle_status | customer_lifecycle_status | new, qualified, negotiating, customer, lost, inactive |
| tags | text[] | Default vazio |
| notes | text | Opcional |
| last_interaction_at | timestamptz | Opcional |
| next_follow_up_at | timestamptz | Opcional |
| metadata | jsonb | Default `{}` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Atualizado por trigger |

RLS:

- Membros da organização leem, criam e atualizam.
- Apenas `owner` e `admin` excluem.

### products

Produtos vendidos ou ofertados pela organização.

Campos principais:

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid | PK |
| organization_id | uuid | FK para `organizations.id` |
| name | text | Obrigatório |
| description | text | Opcional |
| sku | text | Único por organização quando informado |
| category | text | Categoria comercial |
| price_cents | integer | Não negativo |
| stock_quantity | integer | Opcional, não negativo |
| currency | text | Default `BRL` |
| status | text | active, inactive |
| metadata | jsonb | Default `{}` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Atualizado por trigger |

RLS:

- Membros leem.
- Apenas `owner` e `admin` criam, atualizam ou excluem.

### services

Serviços agendáveis ou comercializados.

Campos principais:

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid | PK |
| organization_id | uuid | FK para `organizations.id` |
| name | text | Obrigatório |
| description | text | Opcional |
| category | text | Categoria comercial |
| duration_minutes | integer | Positivo quando informado |
| price_cents | integer | Não negativo |
| currency | text | Default `BRL` |
| status | text | active, inactive |
| metadata | jsonb | Default `{}` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Atualizado por trigger |

RLS:

- Membros leem.
- Apenas `owner` e `admin` criam, atualizam ou excluem.

### conversations

Agrupa mensagens por cliente e canal.

Campos principais:

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid | PK |
| organization_id | uuid | FK para `organizations.id` |
| customer_id | uuid | FK composta para `customers` |
| channel | channel_type | manual, whatsapp, web |
| status | conversation_status | open, waiting_customer, waiting_human, closed |
| assigned_profile_id | uuid | FK composta para `profiles` |
| external_thread_id | text | ID externo futuro |
| last_message_at | timestamptz | Opcional |
| metadata | jsonb | Default `{}` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Atualizado por trigger |

RLS:

- Membros da organização leem, criam e atualizam.
- Apenas `owner` e `admin` excluem.

### messages

Mensagens individuais dentro de uma conversa.

Campos principais:

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid | PK |
| organization_id | uuid | FK para `organizations.id` |
| conversation_id | uuid | FK composta para `conversations` |
| customer_id | uuid | FK composta para `customers` |
| direction | message_direction | inbound, outbound |
| sender_type | message_sender_type | customer, user, ai, system |
| sender_profile_id | uuid | FK composta para `profiles` |
| body | text | Obrigatório |
| external_message_id | text | Único por organização quando informado |
| status | message_status | draft, sent, delivered, read, failed |
| metadata | jsonb | Default `{}` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Atualizado por trigger |

RLS:

- Membros da organização leem, criam e atualizam.
- Apenas `owner` e `admin` excluem.

### appointments

Agendamentos vinculados a clientes e serviços.

Campos principais:

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid | PK |
| organization_id | uuid | FK para `organizations.id` |
| customer_id | uuid | FK composta para `customers` |
| service_id | uuid | FK composta para `services` |
| conversation_id | uuid | FK composta para `conversations` |
| scheduled_start_at | timestamptz | Obrigatório |
| scheduled_end_at | timestamptz | Deve ser maior que início quando informado |
| status | appointment_status | requested, scheduled, confirmed, completed, canceled, no_show |
| notes | text | Opcional |
| metadata | jsonb | Default `{}` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Atualizado por trigger |

RLS:

- Membros da organização leem, criam e atualizam.
- Apenas `owner` e `admin` excluem.

### payments

Cobranças e pagamentos.

Campos principais:

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid | PK |
| organization_id | uuid | FK para `organizations.id` |
| customer_id | uuid | FK composta para `customers` |
| conversation_id | uuid | FK composta para `conversations` |
| amount_cents | integer | Não negativo |
| currency | text | Default `BRL` |
| status | payment_status | pending, paid, overdue, canceled, refunded, failed |
| provider | text | manual, mercado_pago futuramente |
| provider_payment_id | text | Único por organização/provedor quando informado |
| description | text | Opcional |
| due_at | timestamptz | Opcional |
| paid_at | timestamptz | Opcional |
| metadata | jsonb | Default `{}` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Atualizado por trigger |

RLS:

- Membros da organização leem.
- Apenas `owner` e `admin` criam ou atualizam.
- Apenas `owner` exclui.

### ai_knowledge_base

Base de conhecimento por organização para uso futuro da IA.

Campos principais:

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid | PK |
| organization_id | uuid | FK para `organizations.id` |
| title | text | Obrigatório |
| content | text | Obrigatório |
| category | text | Categoria operacional, como FAQ, regras, pagamentos ou servicos |
| priority | integer | Prioridade entre 1 e 10 para ordenar contexto da IA |
| source_type | text | manual, faq, url, file |
| status | ai_knowledge_status | active, inactive; valores legados draft e archived podem existir por compatibilidade |
| metadata | jsonb | Default `{}` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Atualizado por trigger |

RLS:

- Membros leem.
- Apenas `owner` cria, atualiza ou exclui.

Regra da aplicacao:

- A tela `/app/ai/knowledge-base` restringe escrita ao papel `owner`.
- O `organization_id` e sempre resolvido no servidor.
- Formularios nunca enviam nem controlam `organization_id`.
- Consultas sempre filtram por `organization_id` alem das policies RLS.

### human_handoffs

Controle de transferência para atendimento humano.

Campos principais:

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid | PK |
| organization_id | uuid | FK para `organizations.id` |
| conversation_id | uuid | FK composta para `conversations` |
| customer_id | uuid | FK composta para `customers` |
| requested_by_message_id | uuid | FK composta para `messages` |
| assigned_profile_id | uuid | FK composta para `profiles` |
| status | handoff_status | open, assigned, resolved, canceled |
| reason | text | Opcional |
| resolved_at | timestamptz | Opcional |
| metadata | jsonb | Default `{}` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Atualizado por trigger |

RLS:

- Membros da organização leem, criam e atualizam.
- Apenas `owner` e `admin` excluem.

## Helpers na aplicação

Helpers server-side criados:

- `src/lib/supabase/server.ts`
- `src/lib/tenant.server.ts`
- `src/lib/tenant.ts`

Funções principais:

- `createSupabaseServerClient()`
- `getAuthenticatedUser()`
- `requireAuthenticatedUser()`
- `getCurrentTenantProfile()`
- `getCurrentOrganizationId()`
- `requireCurrentOrganizationId()`
- `requireCurrentOrganization()`
- `requireOrganizationRole()`
- `assertCanAccessOrganization()`

Regra de uso: Server Actions, Route Handlers e Server Components protegidos devem obter o `organization_id` no servidor, nunca confiar em `organization_id` enviado pelo cliente.

## Verificação automatizada

Script criado:

```bash
npm run verify:tenant-schema
```

Esse script verifica:

- Presença das tabelas obrigatórias.
- `organization_id uuid not null` nas tabelas de negócio.
- `unique (organization_id, id)` nas tabelas tenant-scoped.
- RLS habilitado e forçado.
- Políticas existentes por tabela.
- Funções auxiliares de tenant.
- Revogação de acesso da role `anon`.

## Pontos críticos

- Não criar novas tabelas operacionais sem `organization_id`.
- Não criar foreign keys entre entidades tenant-scoped sem incluir `organization_id`.
- Não consultar dados por `user_id` quando o domínio real é organizacional.
- Não aceitar `organization_id` do cliente sem comparar com `requireCurrentOrganizationId()`.
- Não usar a service role no browser.
- Não desativar RLS em tabelas de negócio.
