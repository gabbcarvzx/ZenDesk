import { routes } from "@/lib/routes";
import type {
  DemoModeData,
  HelpArticle,
  HelpCategory,
  OnboardingStep,
  OnboardingStepId,
  TourArea,
  TourStep,
} from "@/features/training/types";

export const onboardingSteps: readonly OnboardingStep[] = [
  {
    businessImpact:
      "Alinha a expectativa do cliente e reduz abandono antes da primeira configuracao.",
    description:
      "Uma abertura simples para explicar que o sistema sera configurado em etapas curtas.",
    fields: [],
    id: "welcome",
    nextLabel: "Comecar configuracao",
    number: 1,
    title: "Bem-vindo",
  },
  {
    businessImpact:
      "A IA precisa saber quem e a empresa para responder com contexto e passar confianca.",
    description:
      "Informe nome e uma descricao clara do negocio. Escreva como voce explicaria para um cliente novo.",
    fields: [
      {
        example:
          "Clinica Vida Leve. Atendemos estetica facial, limpeza de pele e botox para clientes de Sao Paulo.",
        help: "Use o nome comercial que seus clientes reconhecem no WhatsApp.",
        label: "Nome da empresa",
        name: "businessName",
        placeholder: "Clinica Vida Leve",
        required: true,
        type: "text",
      },
      {
        example:
          "Somos uma clinica de estetica que agenda avaliacoes, tira duvidas sobre procedimentos e envia orientacoes antes da consulta.",
        help: "Explique o que vende, para quem atende e quais diferenciais a IA deve lembrar.",
        label: "Resumo do negocio",
        name: "businessDescription",
        placeholder: "Explique em linguagem simples o que sua empresa faz.",
        required: true,
        type: "textarea",
      },
    ],
    id: "business",
    nextLabel: "Salvar empresa",
    number: 2,
    title: "Dados da empresa",
  },
  {
    businessImpact:
      "Segmento bem definido melhora perguntas, ofertas e exemplos usados pela IA.",
    description:
      "Escolha o nicho principal do negocio para adaptar linguagem, intencoes e proximos passos.",
    fields: [
      {
        example: "Clinica de estetica, consultorio odontologico, escola de idiomas ou loja de roupas.",
        help: "O nicho ajuda a IA a entender o tipo de atendimento esperado.",
        label: "Nicho do negocio",
        name: "niche",
        placeholder: "Ex.: estetica, saude, educacao, servicos locais",
        required: true,
        type: "text",
      },
    ],
    id: "niche",
    nextLabel: "Salvar nicho",
    number: 3,
    title: "Nicho do negocio",
  },
  {
    businessImpact:
      "Evita promessas erradas de atendimento, entrega ou agendamento fora de horario.",
    description:
      "Defina os horarios em texto simples. A IA usara isso para orientar clientes e sugerir proximos contatos.",
    fields: [
      {
        example: "Segunda a sexta, 08:00 as 18:00. Sabado, 08:00 as 12:00.",
        help: "Inclua feriados, almoco ou regras especiais quando existirem.",
        label: "Horario de funcionamento",
        name: "businessHours",
        placeholder: "Segunda a sexta, 08:00 as 18:00.",
        required: true,
        type: "textarea",
      },
    ],
    id: "hours",
    nextLabel: "Salvar horarios",
    number: 4,
    title: "Horario de funcionamento",
  },
  {
    businessImpact:
      "Produtos e servicos claros aumentam conversao e reduzem perguntas repetidas.",
    description:
      "Liste os principais itens vendidos. Depois, cadastre tudo no catalogo para a IA usar os dados estruturados.",
    fields: [
      {
        example:
          "Limpeza de pele - R$ 180 - 60 min. Botox - a partir de R$ 750. Avaliacao inicial gratuita.",
        help: "Inclua nome, preco aproximado, duracao e regras importantes.",
        label: "Produtos ou servicos principais",
        name: "catalogSummary",
        placeholder: "Liste os itens mais vendidos com preco, duracao e observacoes.",
        required: true,
        type: "textarea",
      },
    ],
    id: "catalog",
    nextLabel: "Salvar catalogo inicial",
    number: 5,
    title: "Produtos e servicos",
  },
  {
    businessImpact:
      "Define personalidade, limites e mensagens padrao para atendimento consistente.",
    description:
      "Configure como a IA deve conversar, iniciar atendimento e transferir para humano.",
    fields: [
      {
        example: "Profissional para saude; amigavel para servicos locais; vendedor para ecommerce.",
        help: "Define como a IA conversa com seus clientes. Exemplo: profissional, amigavel ou vendedor.",
        label: "Tom de voz da IA",
        name: "toneOfVoice",
        options: [
          { label: "Profissional", value: "profissional" },
          { label: "Amigavel", value: "amigavel" },
          { label: "Vendedor", value: "vendedor" },
          { label: "Informal", value: "informal" },
        ],
        placeholder: "Selecione um tom",
        required: true,
        type: "select",
      },
      {
        example: "Ola! Sou a assistente virtual da Clinica Vida Leve. Como posso ajudar hoje?",
        help: "Primeira mensagem usada para receber o cliente sem parecer tecnico.",
        label: "Mensagem de boas-vindas",
        name: "welcomeMessage",
        placeholder: "Escreva uma saudacao curta e clara.",
        required: true,
        type: "textarea",
      },
      {
        example: "Vou chamar uma pessoa da equipe para continuar seu atendimento.",
        help: "Mensagem usada quando a conversa precisa passar para um atendente humano.",
        label: "Mensagem para atendimento humano",
        name: "humanHandoffMessage",
        placeholder: "Explique que uma pessoa vai assumir.",
        required: true,
        type: "textarea",
      },
      {
        example: "Nunca prometer desconto sem aprovacao. Sempre confirmar disponibilidade antes de agendar.",
        help: "Regras reduzem respostas arriscadas e protegem a operacao.",
        label: "Regras importantes",
        name: "importantRules",
        placeholder: "Liste o que a IA nunca deve fazer ou sempre deve conferir.",
        type: "textarea",
      },
    ],
    id: "ai",
    nextLabel: "Salvar IA",
    number: 6,
    title: "Configuracao da IA",
  },
  {
    businessImpact:
      "Sem WhatsApp conectado, o produto nao entra no canal onde o cliente realmente compra.",
    description:
      "Registre o identificador do numero da WhatsApp Cloud API. A conexao completa depende das variaveis seguras do servidor.",
    fields: [
      {
        example: "123456789012345",
        help: "ID do numero no Meta Business. Nao e o telefone formatado; e o phone_number_id da Cloud API.",
        label: "WhatsApp phone number ID",
        name: "whatsappPhoneNumberId",
        placeholder: "Cole o phone_number_id do Meta Business",
        required: true,
        type: "text",
      },
    ],
    id: "whatsapp",
    nextLabel: "Salvar WhatsApp",
    number: 7,
    title: "Conectar WhatsApp",
  },
  {
    businessImpact:
      "Pix reduz friccao de pagamento e permite transformar atendimento em receita imediata.",
    description:
      "Defina como a cobranca Pix sera usada. Em producao, o Mercado Pago deve estar configurado por ambiente.",
    fields: [
      {
        example: "Mercado Pago para QR Code automatico ou manual para chave Pix simples.",
        help: "Mercado Pago gera Pix rastreavel; manual serve para implantacao inicial com conferencia humana.",
        label: "Como o Pix sera usado",
        name: "pixProvider",
        options: [
          { label: "Mercado Pago", value: "mercado_pago" },
          { label: "Manual com chave Pix", value: "manual" },
        ],
        placeholder: "Selecione o provedor",
        required: true,
        type: "select",
      },
      {
        example: "financeiro@suaempresa.com.br ou CNPJ da empresa.",
        help: "Evite expor dados sensiveis desnecessarios. Use a chave oficial da empresa.",
        label: "Chave Pix ou referencia interna",
        name: "pixKey",
        placeholder: "Informe a chave Pix ou observacao para o financeiro.",
        required: true,
        type: "text",
      },
      {
        example: "Enviar Pix somente depois de confirmar valor, cliente e servico contratado.",
        help: "Instrucao operacional para evitar cobrancas erradas.",
        label: "Regra de cobranca",
        name: "pixInstructions",
        placeholder: "Explique quando a equipe ou IA deve enviar a cobranca.",
        required: true,
        type: "textarea",
      },
    ],
    id: "pix",
    nextLabel: "Salvar Pix",
    number: 8,
    title: "Configurar Pix",
  },
  {
    businessImpact:
      "Teste antes do WhatsApp real reduz risco de resposta errada para clientes reais.",
    description:
      "Crie um cenario de teste com pergunta real de cliente e a resposta esperada.",
    fields: [
      {
        example: "Cliente pergunta: voces atendem sabado e quanto custa limpeza de pele?",
        help: "Use uma pergunta que voce recebe com frequencia no WhatsApp.",
        label: "Pergunta de teste",
        name: "aiTestScenario",
        placeholder: "Digite uma pergunta real que a IA deve responder.",
        required: true,
        type: "textarea",
      },
      {
        example:
          "Responder horarios de sabado, informar preco da limpeza de pele e oferecer agendamento.",
        help: "Descreva o que uma boa resposta precisa conter.",
        label: "Resposta esperada",
        name: "aiTestExpectedAnswer",
        placeholder: "Liste os pontos que a resposta ideal deve cobrir.",
        required: true,
        type: "textarea",
      },
    ],
    id: "ai-test",
    nextLabel: "Registrar teste",
    number: 9,
    title: "Testar atendimento IA",
  },
  {
    businessImpact:
      "Fecha a implantacao com proximos passos claros e evita que o cliente pare antes do go-live.",
    description:
      "Revise o checklist e siga para treinamento, conversas e metricas.",
    fields: [],
    id: "finish",
    nextLabel: "Concluir onboarding",
    number: 10,
    title: "Finalizacao",
  },
];

export const onboardingStepById = new Map(onboardingSteps.map((step) => [step.id, step]));

export const helpCategories: readonly HelpCategory[] = [
  {
    description: "Caminho recomendado para sair da conta nova ate o primeiro teste.",
    id: "getting-started",
    title: "Primeiros passos",
  },
  {
    description: "Nome, nicho, horarios e contexto que a IA usa para responder.",
    id: "business-settings",
    title: "Configuracao da empresa",
  },
  {
    description: "Tom de voz, regras, mensagens e testes antes do atendimento real.",
    id: "ai-settings",
    title: "Configuracao da IA",
  },
  {
    description: "Conexao com Cloud API, webhook e cuidados para go-live.",
    id: "whatsapp",
    title: "WhatsApp",
  },
  {
    description: "Pix, cobrancas, status e conciliacao com Mercado Pago.",
    id: "payments",
    title: "Pagamentos",
  },
  {
    description: "Como ler conversas, filtros e historico de atendimento.",
    id: "conversations",
    title: "Conversas",
  },
  {
    description: "Quando uma pessoa assume e como devolver qualidade ao atendimento.",
    id: "human-handoff",
    title: "Atendimento humano",
  },
  {
    description: "Erros frequentes de implantacao e como corrigir sem suporte.",
    id: "common-issues",
    title: "Problemas comuns",
  },
  {
    description: "Acesso, tenants, dados sensiveis e boas praticas operacionais.",
    id: "security",
    title: "Seguranca",
  },
  {
    description: "Limites por plano, billing e preparacao para recorrencia.",
    id: "plans-billing",
    title: "Planos e billing",
  },
];

export const helpArticles: readonly HelpArticle[] = [
  {
    categoryId: "getting-started",
    example:
      "Uma clinica nova deve configurar empresa, cadastrar dois servicos, testar a IA e so depois conectar o WhatsApp real.",
    id: "first-setup",
    readMinutes: 4,
    steps: [
      "Abra o onboarding e avance uma etapa por vez.",
      "Preencha empresa, nicho e horario com textos simples.",
      "Cadastre pelo menos um produto ou servico real no catalogo.",
      "Teste a IA com uma pergunta que seus clientes fazem no WhatsApp.",
      "Use o checklist de implantacao para confirmar o que falta antes do go-live.",
    ],
    summary: "O caminho mais seguro para configurar a conta sem depender do suporte.",
    title: "Como configurar sua conta pela primeira vez",
  },
  {
    categoryId: "business-settings",
    example:
      "Em vez de escrever 'vendemos tratamentos', escreva 'vendemos limpeza de pele, botox e avaliacao facial para adultos em Sao Paulo'.",
    id: "business-description",
    readMinutes: 3,
    steps: [
      "Use o nome comercial que aparece para clientes.",
      "Explique o que a empresa vende e para quem atende.",
      "Inclua diferenciais que a IA deve mencionar.",
      "Evite abreviacoes internas que o cliente nao conhece.",
    ],
    summary: "Como escrever um contexto que ajuda a IA a responder melhor.",
    title: "Como preencher os dados da empresa",
  },
  {
    categoryId: "ai-settings",
    example:
      "Tom profissional: respostas objetivas e cuidadosas. Tom vendedor: respostas com oferta e proximo passo.",
    id: "tone-of-voice",
    readMinutes: 3,
    steps: [
      "Escolha profissional para negocios com maior risco de informacao sensivel.",
      "Escolha amigavel para atendimento local e relacionamento.",
      "Escolha vendedor quando o foco for conversao e oferta.",
      "Revise as mensagens de boas-vindas e transferencia humana.",
    ],
    summary: "O tom de voz define como a IA conversa com seus clientes.",
    title: "Escolhendo o tom de voz da IA",
  },
  {
    categoryId: "ai-settings",
    example:
      "Regra segura: 'nunca confirmar horario sem consultar disponibilidade' ou 'nunca prometer desconto sem autorizacao'.",
    id: "ai-rules",
    readMinutes: 4,
    steps: [
      "Liste o que a IA nunca deve prometer.",
      "Liste informacoes que precisam de confirmacao humana.",
      "Adicione regras comerciais, de prazo, garantia e cancelamento.",
      "Teste com perguntas que tentam quebrar essas regras.",
    ],
    summary: "Regras reduzem respostas arriscadas e protegem a operacao.",
    title: "Como criar regras seguras para a IA",
  },
  {
    categoryId: "whatsapp",
    example:
      "O phone_number_id e um numero interno da Meta, diferente do telefone exibido para o cliente.",
    id: "connect-whatsapp",
    readMinutes: 5,
    steps: [
      "Confirme que a empresa possui acesso ao Meta Business.",
      "Copie o phone_number_id do numero conectado na Cloud API.",
      "Configure as variaveis seguras do WhatsApp no ambiente de producao.",
      "Envie uma mensagem de teste antes de divulgar o numero.",
    ],
    summary: "Passos para conectar o canal sem misturar dados de tenants.",
    title: "Como conectar o WhatsApp Cloud API",
  },
  {
    categoryId: "payments",
    example:
      "Para um servico de R$ 180, crie uma cobranca Pix vinculada ao cliente e acompanhe o status no painel.",
    id: "pix-payments",
    readMinutes: 4,
    steps: [
      "Confirme que seu plano permite pagamentos Pix.",
      "Cadastre o cliente antes de criar a cobranca.",
      "Use descricao clara do produto ou servico cobrado.",
      "Acompanhe status pendente, pago, vencido ou falho.",
    ],
    summary: "Como usar Pix sem perder controle financeiro.",
    title: "Como configurar e usar cobrancas Pix",
  },
  {
    categoryId: "conversations",
    example:
      "Uma conversa em 'Aguardando humano' precisa ser assumida por alguem da equipe antes de voltar para a IA.",
    id: "conversation-status",
    readMinutes: 3,
    steps: [
      "Use filtros para separar abertas, humanas e finalizadas.",
      "Leia a ultima mensagem antes de responder.",
      "Verifique se a IA ou humano esta responsavel.",
      "Finalize conversas resolvidas para manter o painel limpo.",
    ],
    summary: "Entenda os status e priorize atendimento.",
    title: "Como interpretar a tela de conversas",
  },
  {
    categoryId: "human-handoff",
    example:
      "Quando o cliente pede desconto especial, a IA pode transferir para humano com uma mensagem clara.",
    id: "handoff",
    readMinutes: 3,
    steps: [
      "Defina casos em que humano precisa assumir.",
      "Use uma mensagem curta para avisar o cliente.",
      "Responda pelo painel de conversas.",
      "Registre aprendizados na base de conhecimento depois.",
    ],
    summary: "Como assumir atendimento sem deixar o cliente perdido.",
    title: "Quando e como assumir atendimento humano",
  },
  {
    categoryId: "common-issues",
    example:
      "Se a IA responde generico demais, normalmente falta descricao do negocio, catalogo ou regras importantes.",
    id: "weak-ai-answer",
    readMinutes: 4,
    steps: [
      "Revise dados da empresa.",
      "Cadastre produtos e servicos reais.",
      "Adicione perguntas frequentes na base de conhecimento.",
      "Teste novamente no playground da IA.",
    ],
    summary: "O que fazer quando a IA parece vaga ou incompleta.",
    title: "A IA esta respondendo generico demais",
  },
  {
    categoryId: "security",
    example:
      "Nunca envie token do WhatsApp ou Mercado Pago em conversas, prints ou campos de texto da IA.",
    id: "sensitive-data",
    readMinutes: 3,
    steps: [
      "Mantenha tokens apenas em variaveis de ambiente.",
      "Nao cole segredos na base de conhecimento.",
      "Dê acesso administrativo apenas a pessoas confiaveis.",
      "Revise membros quando alguem sair da empresa.",
    ],
    summary: "Cuidados simples para proteger dados de clientes e da empresa.",
    title: "Como proteger dados sensiveis",
  },
  {
    categoryId: "plans-billing",
    example:
      "Planos maiores podem liberar CRM, handoff humano e Pix conforme a politica comercial.",
    id: "plan-limits",
    readMinutes: 3,
    steps: [
      "Verifique o plano ativo no topo do sistema.",
      "Confirme recursos liberados antes de prometer a operacao.",
      "Acompanhe inadimplencia e status de assinatura.",
      "Planeje upgrades quando o uso crescer.",
    ],
    summary: "Como relacionar recursos do produto com plano comercial.",
    title: "Entendendo planos e limites",
  },
];

export const defaultDemoData: Omit<DemoModeData, "enabled"> = {
  aiMessages: [
    {
      body: "Oi, queria saber se voces atendem sabado e quanto custa limpeza de pele.",
      sender: "Cliente",
    },
    {
      body: "Atendemos sabado das 08:00 as 12:00. A limpeza de pele custa R$ 180 e dura cerca de 60 minutos. Posso te ajudar a escolher um horario?",
      sender: "IA",
    },
    {
      body: "Pode ser sabado de manha.",
      sender: "Cliente",
    },
    {
      body: "Perfeito. Vou confirmar disponibilidade e, se precisar, chamo uma pessoa da equipe para finalizar seu agendamento.",
      sender: "IA",
    },
  ],
  conversations: [
    {
      customer: "Marina Souza",
      lastMessage: "Quero agendar avaliacao facial para sexta.",
      nextAction: "Confirmar horario",
      status: "IA atendendo",
    },
    {
      customer: "Rafael Lima",
      lastMessage: "Consegue desconto se eu fechar hoje?",
      nextAction: "Handoff humano",
      status: "Aguardando humano",
    },
    {
      customer: "Ana Paula",
      lastMessage: "Pode me enviar o Pix da limpeza de pele?",
      nextAction: "Criar cobranca",
      status: "Venda quente",
    },
  ],
  customers: [
    { interest: "Limpeza de pele", name: "Marina Souza", stage: "Lead qualificado" },
    { interest: "Botox", name: "Rafael Lima", stage: "Negociacao" },
    { interest: "Pacote mensal", name: "Ana Paula", stage: "Cliente" },
  ],
  payments: [
    { amount: "R$ 180,00", customer: "Ana Paula", status: "Pix pendente" },
    { amount: "R$ 750,00", customer: "Rafael Lima", status: "Aguardando aprovacao" },
  ],
};

export const routeTourSteps: Record<TourArea, readonly TourStep[]> = {
  ai: [
    {
      body: "Use o playground para testar respostas antes de deixar a IA falar com clientes reais.",
      targetId: "nav-ai",
      title: "Teste antes do go-live",
    },
    {
      body: "Depois de testar, alimente a base de conhecimento com regras, FAQ e detalhes de servicos.",
      targetId: "nav-ai",
      title: "Base de conhecimento",
    },
  ],
  conversations: [
    {
      body: "Aqui voce acompanha quem esta falando: IA ou humano. Use isso para nao deixar cliente sem resposta.",
      targetId: "nav-conversations",
      title: "Fila de atendimento",
    },
    {
      body: "Quando uma conversa pedir humano, assuma pelo painel e registre o aprendizado para treinar a IA.",
      targetId: "nav-conversations",
      title: "Assumir atendimento",
    },
  ],
  customers: [
    {
      body: "Clientes concentram historico, interesses e proximos follow-ups. Isso vira CRM do negocio.",
      targetId: "nav-customers",
      title: "CRM simples",
    },
    {
      body: "Use busca e tags para encontrar oportunidades sem depender de planilhas paralelas.",
      targetId: "nav-customers",
      title: "Organizacao comercial",
    },
  ],
  dashboard: [
    {
      body: "O dashboard mostra demanda, receita pendente e sinais de atendimento humano.",
      targetId: "nav-dashboard",
      title: "Saude da operacao",
    },
    {
      body: "Volte aqui depois do go-live para decidir se precisa melhorar catalogo, IA ou equipe.",
      targetId: "nav-training",
      title: "Checklist sempre perto",
    },
  ],
  payments: [
    {
      body: "Cobrancas devem estar vinculadas a cliente e conversa para manter rastreabilidade.",
      targetId: "nav-payments",
      title: "Pix com contexto",
    },
    {
      body: "Acompanhe pendentes, pagos e vencidos para transformar atendimento em receita previsivel.",
      targetId: "nav-payments",
      title: "Controle financeiro",
    },
  ],
  settings: [
    {
      body: "Configuracoes do negocio sao a fonte de verdade para horario, tom da IA e regras.",
      targetId: "nav-settings",
      title: "Fonte de verdade",
    },
    {
      body: "Sempre atualize esta area quando mudar horario, politica ou mensagem padrao.",
      targetId: "nav-settings",
      title: "Manutencao continua",
    },
  ],
};

export const trainingQuickLinks = [
  { href: routes.onboarding, label: "Continuar onboarding" },
  { href: routes.helpCenter, label: "Abrir central de ajuda" },
  { href: routes.settings, label: "Configurar empresa" },
  { href: routes.aiPlayground, label: "Testar IA" },
] as const;

export function getOnboardingStep(id: OnboardingStepId) {
  return onboardingStepById.get(id) ?? onboardingSteps[0];
}

export function getNextOnboardingStepId(stepId: OnboardingStepId): OnboardingStepId {
  const index = onboardingSteps.findIndex((step) => step.id === stepId);
  const nextStep = onboardingSteps[index + 1];

  return nextStep?.id ?? "finish";
}
