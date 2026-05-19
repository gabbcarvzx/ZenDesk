# Fluxo de treinamento

## Jornada recomendada

1. Cliente cria conta.
2. Cadastro redireciona para `/app/onboarding`.
3. Cliente preenche as 10 etapas guiadas.
4. Sistema calcula checklist real de implantacao.
5. Cliente usa modo demo para entender conversas, clientes, pagamentos e IA.
6. Cliente consulta a central de ajuda quando tiver duvida contextual.
7. Cliente testa IA antes de conectar operacao real.
8. Cliente acompanha metricas no dashboard apos o go-live.

## Checklist de implantacao

O checklist e calculado no servidor com dados reais do tenant:

- `business_settings`
- produtos e servicos
- base de conhecimento da IA
- WhatsApp phone number ID
- variaveis de ambiente de WhatsApp e Mercado Pago
- progresso do onboarding
- conversas e pagamentos existentes
- permissoes de plano

Status possiveis:

- `Configurado`: pronto.
- `Atenção`: parcialmente pronto ou dependente de plano/ambiente.
- `Pendente`: falta configuracao essencial.

## Tutoriais interativos

O `ProductTourLauncher` fica no shell autenticado e exibe tours por area:

- Dashboard
- Conversas
- IA
- Clientes
- Pagamentos
- Configuracoes

O tour destaca itens de navegacao com `data-tour-id`, explica a area e permite avancar, voltar, concluir ou pular.

## Modo demo

O modo demo e opcional e fica em `/app/training`. Ele mostra dados simulados de:

- conversas
- clientes
- pagamentos
- mensagens da IA

Ele nao grava dados falsos nas tabelas operacionais. Isso evita poluir metricas reais e preserva isolamento multi-tenant.

## Estados vazios inteligentes

Listas vazias agora explicam:

- o que falta
- por que importa para o negocio
- qual primeiro passo executar
- qual CTA seguir

Telas cobertas:

- produtos
- servicos
- clientes
- conversas
- pagamentos
- agenda
- base de conhecimento

## Critérios de qualidade

- Todos os dados operacionais continuam filtrados por `organization_id`.
- Progresso e demo sao salvos por tenant.
- Escrita do onboarding exige `owner` ou `admin`.
- Conteudo educacional nao acessa segredos.
- Fluxo e responsivo e reutiliza componentes existentes.
