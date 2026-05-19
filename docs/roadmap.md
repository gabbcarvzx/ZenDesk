# Roadmap

## Fase 0: Fundação

Objetivo: alinhar produto, arquitetura e riscos antes de implementar.

Entregas:

- Documentação inicial.
- Escopo do MVP.
- Modelo de dados planejado.
- Checklist de segurança.
- Decisões de stack e multi-tenancy.

Resultado esperado:

- Base clara para iniciar implementação sem improvisar arquitetura crítica.

## Fase 1: Base SaaS multi-tenant

Objetivo: criar a fundação segura do produto.

Entregas:

- Projeto Next.js com App Router, TypeScript e Tailwind.
- Supabase configurado.
- Supabase Auth.
- Organizações.
- Memberships.
- Papéis de usuário.
- Dashboard protegido.
- Resolução de organização ativa.
- RLS inicial.
- Testes de isolamento entre tenants.

Critério de conclusão:

- Um usuário só acessa dados das organizações onde possui membership ativo.

## Fase 2: CRM conversacional básico

Objetivo: permitir operação manual de contatos e conversas.

Entregas:

- Cadastro de contatos.
- Lista e detalhe de contatos.
- Conversas.
- Mensagens.
- Status de conversa.
- Status comercial do contato.
- Follow-up manual.
- Dashboard operacional inicial.

Critério de conclusão:

- Uma organização consegue registrar contatos, conversas e evolução comercial com segurança.

## Fase 3: IA assistida

Objetivo: validar valor da IA sem automatizar envio externo.

Entregas:

- Configuração do agente de IA por organização.
- Geração de respostas com OpenAI API.
- Registro de uso por organização.
- Limites por plano.
- Revisão humana antes de envio.
- Logs de interação.
- Tratamento de erro e fallback.

Critério de conclusão:

- Usuários conseguem gerar respostas úteis com contexto da organização e histórico da conversa.

## Fase 4: Billing preparado

Objetivo: transformar uso em produto monetizável.

Entregas:

- Planos internos.
- Assinaturas por organização.
- Trial.
- Bloqueio por status de plano.
- Limites de uso.
- Tela de plano e uso.
- Estrutura preparada para Mercado Pago.

Critério de conclusão:

- O sistema consegue liberar, limitar ou bloquear recursos conforme plano e assinatura.

## Fase 5: Piloto com clientes reais

Objetivo: validar disposição de pagamento e fluxo operacional.

Entregas:

- Onboarding assistido.
- Uso com 5 a 10 negócios.
- Coleta de feedback.
- Métricas de conversas, leads e follow-ups.
- Ajustes de prompt e UX.
- Definição dos planos comerciais iniciais.

Critério de conclusão:

- Pelo menos alguns clientes demonstram intenção real de pagamento ou pagam pelo piloto.

## Fase 6: WhatsApp Cloud API

Objetivo: conectar o produto ao canal real.

Entregas:

- Webhook de mensagens recebidas.
- Verificação de assinatura.
- Mapeamento de número para organização.
- Registro idempotente de mensagens.
- Envio de mensagens.
- Status de entrega.
- Tratamento de falhas.

Critério de conclusão:

- Uma organização consegue operar conversas reais pelo WhatsApp dentro do sistema.

## Fase 7: Mercado Pago

Objetivo: ativar cobrança recorrente.

Entregas:

- Integração com Mercado Pago.
- Checkout ou assinatura.
- Webhooks de pagamento.
- Atualização automática de status.
- Tela de billing.
- Bloqueio por inadimplência.

Critério de conclusão:

- Uma organização consegue assinar, pagar, renovar e ter acesso controlado automaticamente.

## Fase 8: Automação comercial

Objetivo: aumentar retenção e valor percebido.

Entregas:

- Follow-ups automáticos.
- Recuperação de clientes inativos.
- Campanhas segmentadas.
- Templates aprovados quando necessário.
- Relatórios de conversão.
- Sugestões inteligentes de próximos passos.

Critério de conclusão:

- O produto demonstra impacto mensurável em vendas, agendamentos ou recuperação de clientes.

## Fase 9: Escala e operação

Objetivo: preparar crescimento com estabilidade.

Entregas:

- Filas e workers.
- Rate limit por organização.
- Observabilidade avançada.
- Painel de custos por tenant.
- Backup e restore testado.
- Auditoria administrativa.
- Otimização de queries.
- Arquivamento de histórico antigo.

Critério de conclusão:

- A plataforma suporta crescimento de clientes sem perda de isolamento, estabilidade ou previsibilidade de custo.

## Prioridades permanentes

- Segurança multi-tenant.
- Clareza de monetização.
- Controle de custo de IA.
- Simplicidade para pequenos negócios.
- Observabilidade desde cedo.
- Evolução incremental sem comprometer arquitetura.

