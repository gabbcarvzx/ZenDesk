# Arquitetura

## Objetivo arquitetural

Criar uma plataforma SaaS multi-tenant, segura e preparada para crescimento horizontal, onde cada pequeno negócio opera dentro de uma organização isolada por `organization_id`.

O sistema deve ser simples o bastante para validar o MVP, mas estruturado para evoluir para integrações reais com WhatsApp Cloud API, Mercado Pago, filas, workers, auditoria e múltiplos planos comerciais.

## Visão em camadas

### Frontend

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Componentes separados por domínio.
- Rotas públicas para marketing, login e onboarding.
- Rotas protegidas para dashboard da organização.
- Preferência por Server Components para leitura de dados.
- Client Components apenas para interações, formulários e estados locais.

### Backend

- Next.js Route Handlers para APIs internas, webhooks e integrações externas.
- Server Actions para mutações internas de formulários quando fizer sentido.
- Camada de serviços por domínio: organizações, contatos, conversas, IA, billing e integrações.
- Validação server-side de autenticação, membership, plano e `organization_id`.
- Integrações externas encapsuladas em adapters.

### Banco de dados

- Supabase/PostgreSQL.
- Row Level Security em tabelas sensíveis.
- `organization_id` obrigatório em entidades de negócio.
- Índices compostos por `organization_id` e campos de busca frequente.
- Eventos de uso e auditoria desde o início.
- Estrutura preparada para backup e restore.

### Infraestrutura

- Deploy na Vercel.
- Supabase como banco, auth e storage futuro.
- Variáveis de ambiente separadas por ambiente.
- Logs estruturados.
- Monitoramento de erros e performance em fase de produção.
- Webhooks externos tratados com idempotência.

## Multi-tenancy

A unidade de isolamento é a organização.

Regras:

- `organizations.id` representa o tenant.
- Usuários não pertencem diretamente aos dados de negócio; eles acessam dados por membership.
- Toda tabela operacional deve possuir `organization_id`.
- Queries devem sempre filtrar por `organization_id`.
- Políticas de RLS devem verificar se `auth.uid()` pertence à organização.
- A aplicação deve resolver uma organização ativa antes de carregar dados protegidos.

## Autenticação e autorização

### Autenticação

- Supabase Auth para cadastro, login e sessão.
- Sessões seguras gerenciadas server-side conforme padrões do Supabase para Next.js.
- Proteção de rotas no servidor.

### Autorização

Autorização deve combinar:

- Usuário autenticado.
- Membership ativo na organização.
- Papel do usuário.
- Status do plano.
- Limites comerciais do plano.

Papéis iniciais:

- `owner`: controla organização, billing e membros.
- `admin`: gerencia operação e configurações.
- `agent`: atende conversas e contatos.

## Resolução de tenant

Estratégia recomendada:

- Após login, o usuário seleciona ou cria uma organização.
- A organização ativa é armazenada em contexto seguro da aplicação.
- Toda rota protegida valida se o usuário possui membership na organização ativa.
- Actions, Route Handlers e queries recebem `organization_id` validado no servidor.

Evitar:

- Confiar apenas em `organization_id` enviado pelo cliente.
- Buscar dados por `user_id` quando o domínio real é organizacional.
- Usar filtros opcionais de tenant.

## IA

### Papel da IA

A IA deve sugerir ou gerar respostas baseadas no contexto da organização, conversa e contato.

No MVP, o envio externo deve ser manual ou simulado. Isso reduz risco operacional e permite validar qualidade antes de automatizar WhatsApp.

### Componentes

- Configuração de agente por organização.
- Prompt base versionado.
- Contexto do negócio.
- Histórico recente da conversa.
- Regras de segurança e transferência para humano.
- Registro de uso e custo estimado.

### Segurança da IA

- Nunca montar prompt com dados de outra organização.
- Limitar tamanho do contexto.
- Registrar inputs e outputs com cuidado.
- Evitar armazenar segredos em prompts.
- Permitir revisão humana no MVP.

## WhatsApp Cloud API

Integração futura via webhooks e adapters.

Componentes previstos:

- Webhook de recebimento de mensagens.
- Verificação de assinatura.
- Registro idempotente de mensagens.
- Envio de mensagens com status.
- Mapeamento entre número do WhatsApp e organização.
- Controle de templates quando necessário.

O desenho do banco já deve separar canal, conversa e mensagem para suportar WhatsApp e canais futuros.

## Mercado Pago

Integração futura para cobrança recorrente.

Componentes previstos:

- Planos internos do SaaS.
- Assinaturas por organização.
- Webhooks de pagamento.
- Status de cobrança.
- Bloqueio por inadimplência.
- Histórico de eventos financeiros.

Billing não deve ser tratado como detalhe externo. O status do plano precisa influenciar permissões e limites dentro da aplicação.

## Observabilidade

Desde o MVP, registrar:

- Criação e atualização de entidades críticas.
- Chamadas à OpenAI.
- Uso por organização.
- Eventos de billing.
- Erros de webhooks.
- Tentativas negadas de acesso cross-tenant.

Em produção, adicionar:

- Monitoramento de erros.
- Métricas de latência.
- Alertas de falhas em webhooks.
- Painel de custo por organização.

## Estratégia de escalabilidade

### Curto prazo

- Next.js na Vercel.
- Supabase gerenciado.
- Processamento síncrono para fluxos simples.
- Geração de IA sob demanda.

### Médio prazo

- Fila para webhooks e mensagens.
- Workers para processamento assíncrono.
- Cache de configurações da organização.
- Rate limit por organização.
- Histórico paginado e arquivamento.

### Longo prazo

- Separação de serviços críticos.
- Sharding lógico por organização se necessário.
- Data warehouse para analytics.
- Base vetorial por organização para conhecimento avançado.
- Múltiplos canais além de WhatsApp.

## Estrutura de pastas recomendada para implementação futura

Quando o código for criado, uma estrutura inicial recomendada é:

- `src/app`: rotas do App Router.
- `src/components`: componentes compartilhados.
- `src/features`: módulos por domínio de produto.
- `src/lib`: clientes, helpers e infraestrutura.
- `src/server`: serviços server-side, autorização e integrações.
- `src/types`: tipos globais.
- `supabase`: migrations, seeds e configuração local.
- `docs`: documentação de produto e arquitetura.

## Decisões de produção

- Não depender apenas de middleware/proxy para autorização.
- Validar autorização dentro de Server Actions e Route Handlers.
- Inicializar clientes externos de forma segura e compatível com build.
- Manter segredos apenas em variáveis de ambiente.
- Usar ambientes separados: local, preview e production.
- Criar testes específicos para isolamento multi-tenant.

