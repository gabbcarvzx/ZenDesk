export const proofMetrics = [
  {
    value: "24h",
    label: "Atendimento automático para captar oportunidades fora do horário.",
  },
  {
    value: "3x",
    label: "Mais chances de resposta quando o lead recebe retorno imediato.",
  },
  {
    value: "0",
    label: "Dependência de WhatsApp conectado para testar a IA no playground.",
  },
] as const;

export const problemPoints = [
  "Cliente chama no WhatsApp e espera resposta rápida.",
  "A equipe perde pedido, orçamento e horário disponível no meio da conversa.",
  "Mensagem fora do expediente vira venda perdida no dia seguinte.",
  "O dono não sabe quais leads precisam de follow-up.",
] as const;

export const solutionPoints = [
  "IA responde com base nos dados reais do negócio.",
  "Agenda, pagamentos e histórico ficam no mesmo painel.",
  "Atendente humano assume quando a IA não deve decidir sozinha.",
  "Cada conversa avança para venda, agendamento ou captura de contato.",
] as const;

export const benefits = [
  {
    title: "Respostas em segundos",
    description:
      "A IA atende perguntas comuns, explica produtos e serviços e reduz o tempo até o primeiro retorno.",
  },
  {
    title: "Mais agendamentos",
    description:
      "O fluxo já nasce preparado para criar agendamentos com cliente e serviço vinculados.",
  },
  {
    title: "Cobrança no contexto",
    description:
      "Pagamentos ficam ligados ao cliente e à conversa, com estrutura pronta para Pix via Mercado Pago.",
  },
  {
    title: "Handoff humano",
    description:
      "Quando a conversa exige cuidado, a IA solicita atendimento humano sem expor instruções internas.",
  },
  {
    title: "Base de conhecimento",
    description:
      "O negócio cadastra regras, horários, políticas e respostas para a IA não inventar informação.",
  },
  {
    title: "Operação multi-tenant",
    description:
      "Cada empresa opera isolada por organização, com RLS, tenantId e controles de produção.",
  },
] as const;

export const howItWorks = [
  {
    title: "Configure o negócio",
    description:
      "Cadastre tom de voz, horários, regras, serviços, produtos e conhecimento essencial.",
  },
  {
    title: "Teste no playground",
    description:
      "Simule mensagens de clientes e veja a resposta da IA antes de conectar o WhatsApp real.",
  },
  {
    title: "Conecte o canal",
    description:
      "O webhook do WhatsApp recebe mensagens, identifica o tenant e salva tudo no histórico.",
  },
  {
    title: "Venda com controle",
    description:
      "A IA responde, agenda, pede contato, cria handoff e prepara cobranças quando houver confirmação.",
  },
] as const;

export const niches = [
  "Clínicas e estética",
  "Barbearias e salões",
  "Oficinas e assistência técnica",
  "Escolas e cursos livres",
  "Consultórios",
  "Restaurantes e delivery",
  "Imobiliárias locais",
  "Prestadores de serviço",
] as const;

export const faqItems = [
  {
    question: "A IA pode inventar preço ou horário?",
    answer:
      "Não deve. O motor foi desenhado para usar apenas o contexto cadastrado e pedir humano quando faltar informação.",
  },
  {
    question: "Preciso conectar o WhatsApp para testar?",
    answer:
      "Não. O playground permite simular conversas e validar o comportamento da IA antes da conexão real.",
  },
  {
    question: "Serve para negócios com equipe pequena?",
    answer:
      "Sim. O foco é justamente reduzir atraso, organizar conversas e ajudar o dono a não perder oportunidade.",
  },
  {
    question: "O atendente humano continua no controle?",
    answer:
      "Sim. Conversas podem ser assumidas por humano e devolvidas para a IA quando fizer sentido.",
  },
  {
    question: "Os dados de uma empresa podem vazar para outra?",
    answer:
      "A arquitetura é multi-tenant, com organization_id nas entidades de negócio e políticas de RLS no banco.",
  },
] as const;
