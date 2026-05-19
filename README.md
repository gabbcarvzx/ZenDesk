# Codinome: Zendesk

> Nome provisório interno. A marca comercial definitiva deve ser definida antes de qualquer lançamento público para evitar conflito de posicionamento, domínio, SEO ou propriedade intelectual.

## Visão geral

Este repositório contém a fundação de um SaaS multi-tenant para pequenos negócios usarem IA no WhatsApp para atendimento, vendas, agendamento, cobrança e recuperação de clientes.

O produto deve ser tratado como uma plataforma comercial real: seguro, escalável, monetizável, observável e preparado para múltiplas organizações usando a mesma infraestrutura sem vazamento de dados entre clientes.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- Supabase/PostgreSQL em fase futura
- Supabase Auth em fase futura
- Multi-tenant por `organization_id`
- OpenAI API em fase futura
- WhatsApp Cloud API em fase futura
- Mercado Pago em fase futura
- Deploy na Vercel

## Status atual

Fase 1 iniciada: base Next.js criada com App Router, TypeScript, Tailwind CSS, ESLint, rotas públicas e shell inicial de área autenticada.

Ainda não há conexão com Supabase, OpenAI, WhatsApp Cloud API ou Mercado Pago. A rota `/app/dashboard` já possui estrutura visual de produto autenticado, mas a validação real de sessão e membership deve ser implementada com Supabase Auth na próxima fase.

## Rotas iniciais

- Home: `/`
- Pricing: `/pricing`
- Login: `/login`
- Register: `/register`
- Dashboard: `/app/dashboard`
- Catálogo: `/app/catalog`
- Produtos: `/app/catalog/products`
- Serviços: `/app/catalog/services`
- Base de conhecimento da IA: `/app/ai/knowledge-base`
- Configurações do negócio: `/app/settings/business`
- Webhook WhatsApp Cloud API: `/api/webhooks/whatsapp`

## Como rodar localmente

1. Instale as dependências:

```bash
npm install
```

2. Copie as variáveis de ambiente:

```bash
cp .env.example .env.local
```

3. Rode o servidor local:

```bash
npm run dev
```

4. Acesse `http://localhost:3000`.

## Scripts

- `npm run dev`: inicia o servidor de desenvolvimento.
- `npm run lint`: executa ESLint.
- `npm run build`: gera build de produção.
- `npm run start`: inicia a aplicação em modo produção após build.
- `npm run verify:tenant-schema`: valida a migration multi-tenant e pontos básicos de RLS.

## Estrutura inicial

- `src/app`: rotas do App Router.
- `src/app/(public)`: páginas públicas.
- `src/app/(auth)`: páginas de login e cadastro.
- `src/app/app`: área autenticada do produto.
- `src/components`: componentes reutilizáveis.
- `src/components/ui`: primitivos de UI.
- `src/components/layout`: layouts compartilhados.
- `src/features`: módulos por domínio de produto.
- `src/lib`: configurações, rotas, helpers de tenant, Supabase e tipos de infraestrutura.
- `supabase/migrations`: migrations SQL do schema multi-tenant.
- `scripts`: verificações automatizadas de arquitetura.
- `docs`: documentação de produto, arquitetura, segurança e roadmap.

## Princípios obrigatórios

- Toda entidade de negócio deve possuir `organization_id`.
- Toda consulta de dados de negócio deve ser filtrada por `organization_id`.
- O banco deve usar Row Level Security quando aplicável.
- Usuários acessam organizações por vínculo explícito de membership.
- Autenticação e autorização devem ser validadas no servidor.
- Dados de clientes finais não podem vazar entre organizações.
- Billing, planos e limites devem existir desde a modelagem inicial.
- Integrações externas devem ser assíncronas, auditáveis e idempotentes.
- Logs devem ser estruturados, sem expor segredos ou dados sensíveis.
- A arquitetura deve suportar evolução para filas, workers e webhooks em produção.

## Documentação

- [Visão de produto](docs/product-vision.md)
- [Escopo do MVP](docs/mvp-scope.md)
- [Arquitetura](docs/architecture.md)
- [Modelo de banco de dados](docs/database-schema.md)
- [Checklist de segurança](docs/security-checklist.md)
- [Checklist de producao](docs/production-checklist.md)
- [Deploy](docs/deployment.md)
- [Configuração do WhatsApp Cloud API](docs/whatsapp-cloud-api.md)
- [Configuração do Mercado Pago Pix](docs/mercadopago.md)
- [Roadmap](docs/roadmap.md)

## Próximos passos técnicos

1. Conectar Supabase Auth.
2. Criar schema inicial com `organizations`, `organization_members`, `contacts`, `conversations`, `messages`, `ai_agents`, `usage_events` e `subscriptions`.
3. Implementar resolução server-side de organização ativa.
4. Criar políticas de RLS e testes de isolamento entre tenants.
5. Proteger `/app/dashboard` com sessão real, membership e status do plano.
6. Preparar Server Actions e Route Handlers por domínio.
7. Implementar primeira persistência de contatos e conversas.
