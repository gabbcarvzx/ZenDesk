# Escopo do MVP

## Objetivo do MVP

Validar se pequenos negócios pagam por uma IA que centraliza atendimento inicial, qualificação, registro de conversas e follow-up comercial via WhatsApp.

O MVP deve provar valor comercial antes de automatizar todo o ciclo de vendas, agenda e cobrança.

## Escopo incluído

### Autenticação e organizações

- Cadastro e login com Supabase Auth.
- Criação de organização.
- Membership entre usuários e organizações.
- Papéis iniciais: `owner`, `admin`, `agent`.
- Seleção de organização ativa.
- Proteção de rotas autenticadas.

### Configuração da IA

- Perfil da organização.
- Descrição dos serviços.
- Tom de voz.
- Instruções de atendimento.
- Perguntas frequentes.
- Regras de quando transferir para humano.

### Contatos

- Cadastro de contatos.
- Nome, telefone, origem e status.
- Histórico vinculado à organização.
- Tags ou segmentos simples.

### Conversas

- Lista de conversas.
- Mensagens por conversa.
- Status da conversa: aberta, aguardando cliente, aguardando humano, finalizada.
- Origem inicial simulada ou manual antes da integração oficial com WhatsApp.

### IA no atendimento

- Geração de resposta com OpenAI API.
- Prompt construído com contexto da organização.
- Registro da resposta sugerida.
- Aprovação manual no MVP antes de envio externo.
- Controle de uso por organização.

### Funil simples

- Status do contato: novo, qualificado, em negociação, cliente, perdido, inativo.
- Observações comerciais.
- Próximo follow-up.

### Billing preparado

- Tabelas de planos e assinaturas.
- Status da assinatura: trial, active, past_due, canceled, blocked.
- Limites por plano.
- Sem cobrança real no MVP inicial.

### Dashboard inicial

- Total de conversas.
- Novos contatos.
- Leads qualificados.
- Uso de IA.
- Conversas aguardando humano.

## Fora do escopo inicial

- Envio real via WhatsApp Cloud API.
- Integração real com Mercado Pago.
- Integração com Google Calendar.
- Campanhas em massa.
- Aplicativo mobile nativo.
- Voice bot.
- Múltiplos canais além de WhatsApp.
- Treinamento com arquivos grandes ou base vetorial complexa.
- Automação financeira completa.

## Fluxos principais

### Onboarding

1. Usuário cria conta.
2. Usuário cria organização.
3. Usuário preenche perfil do negócio.
4. Usuário configura instruções da IA.
5. Usuário cria ou importa contatos manualmente.
6. Usuário testa uma conversa simulada.

### Atendimento

1. Uma conversa é criada para um contato.
2. O sistema carrega contexto da organização e histórico do contato.
3. A IA sugere uma resposta.
4. O atendente aprova, edita ou rejeita.
5. A mensagem fica registrada no histórico.
6. O status do contato pode ser atualizado.

### Follow-up

1. O usuário define próximo contato.
2. O dashboard exibe follow-ups pendentes.
3. A IA sugere uma mensagem.
4. O usuário aprova manualmente.

## Critérios de aceite do MVP

- Um usuário autenticado só acessa dados das organizações onde possui membership.
- Toda entidade de negócio relevante contém `organization_id`.
- Conversas e contatos são isolados por organização.
- A IA nunca recebe dados de outra organização no contexto.
- O uso da OpenAI é registrado por organização.
- O sistema consegue bloquear uso com base no status do plano.
- O dashboard inicial permite entender se a ferramenta gera valor operacional.

## Estratégia de entrega

O MVP deve ser entregue em ciclos curtos:

- Ciclo 1: autenticação, organizações e isolamento.
- Ciclo 2: contatos, conversas e mensagens.
- Ciclo 3: configuração da IA e geração de respostas.
- Ciclo 4: dashboard, limites de uso e billing preparado.
- Ciclo 5: testes com usuários reais e ajustes de produto.

