export const pricingPlans = [
  {
    name: "Starter",
    slug: "starter",
    price: "R$ 97",
    description: "Para validar atendimento com IA em um unico negocio.",
    highlighted: false,
    features: [
      "1 organizacao",
      "Ate 500 mensagens com IA por mes",
      "2 usuarios internos",
      "Contatos e conversas essenciais",
    ],
  },
  {
    name: "Pro",
    slug: "pro",
    price: "R$ 197",
    description: "Para operacoes que querem vender e recuperar clientes.",
    highlighted: true,
    features: [
      "Ate 2.500 mensagens com IA por mes",
      "5 usuarios internos",
      "Follow-up e funil comercial",
      "Dashboard de uso e conversao",
    ],
  },
  {
    name: "Business",
    slug: "business",
    price: "R$ 397",
    description: "Para maior volume, atendimento assistido e controles avancados.",
    highlighted: false,
    features: [
      "Ate 10.000 mensagens com IA por mes",
      "Usuarios internos ampliados",
      "Limites por canal e organizacao",
      "Preparado para integracoes premium",
    ],
  },
] as const;
