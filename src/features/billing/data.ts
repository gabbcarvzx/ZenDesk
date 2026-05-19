import { billingPlans } from "@/lib/billing/policy";

export const pricingPlans = [
  {
    description:
      "Para pequenos negocios que querem comecar com IA no WhatsApp sem complicacao.",
    features: [
      "500 mensagens/mes",
      "1 numero WhatsApp",
      "IA basica",
      "Produtos e servicos",
      "Playground de IA",
    ],
    highlighted: false,
    name: billingPlans.starter.name,
    price: "R$79",
    slug: billingPlans.starter.slug,
  },
  {
    description: "Para operacoes que querem vender, agendar, cobrar e atender melhor.",
    features: [
      "3.000 mensagens/mes",
      "IA avancada",
      "Agendamentos",
      "Pagamentos Pix",
      "CRM",
      "Handoff humano",
    ],
    highlighted: true,
    name: billingPlans.pro.name,
    price: "R$199",
    slug: billingPlans.pro.slug,
  },
  {
    description:
      "Para negocios com mais volume, equipe e recuperacao ativa de clientes.",
    features: [
      "15.000 mensagens/mes",
      "Multiplos atendentes",
      "Analytics avancado",
      "Automacoes de recuperacao",
      "Suporte prioritario",
    ],
    highlighted: false,
    name: billingPlans.business.name,
    price: "R$499",
    slug: billingPlans.business.slug,
  },
] as const;

export const planComparisonRows = [
  {
    business: "15.000/mes",
    feature: "Mensagens incluidas",
    pro: "3.000/mes",
    starter: "500/mes",
  },
  {
    business: "3 numeros",
    feature: "Numero WhatsApp",
    pro: "1 numero",
    starter: "1 numero",
  },
  {
    business: "Avancada com automacoes",
    feature: "IA",
    pro: "Avancada",
    starter: "Basica",
  },
  {
    business: "Incluido",
    feature: "Produtos e servicos",
    pro: "Incluido",
    starter: "Incluido",
  },
  {
    business: "Incluido",
    feature: "Playground de IA",
    pro: "Incluido",
    starter: "Incluido",
  },
  {
    business: "Incluido",
    feature: "Agendamentos",
    pro: "Incluido",
    starter: "Nao incluido",
  },
  {
    business: "Incluido",
    feature: "Pagamentos Pix",
    pro: "Incluido",
    starter: "Nao incluido",
  },
  {
    business: "Incluido",
    feature: "CRM",
    pro: "Incluido",
    starter: "Nao incluido",
  },
  {
    business: "Incluido",
    feature: "Handoff humano",
    pro: "Incluido",
    starter: "Nao incluido",
  },
  {
    business: "Incluido",
    feature: "Analytics avancado",
    pro: "Nao incluido",
    starter: "Nao incluido",
  },
  {
    business: "Incluido",
    feature: "Automacoes de recuperacao",
    pro: "Nao incluido",
    starter: "Nao incluido",
  },
  {
    business: "Incluido",
    feature: "Suporte prioritario",
    pro: "Nao incluido",
    starter: "Nao incluido",
  },
] as const;
