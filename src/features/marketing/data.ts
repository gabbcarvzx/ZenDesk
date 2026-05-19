export const proofMetrics = [
  {
    value: "24/7",
    label: "Atendimento inicial mesmo fora do horario comercial.",
  },
  {
    value: "1 tenant",
    label: "Cada organizacao opera com dados e limites isolados.",
  },
  {
    value: "MVP",
    label: "Fluxo preparado para validar pagamento antes de escalar integracoes.",
  },
] as const;

export const operatingPillars = [
  {
    title: "Multi-tenant",
    description: "Modelo orientado a organizacoes, memberships e isolamento por organization_id.",
    impact: "Evita vazamento entre clientes.",
  },
  {
    title: "Atendimento",
    description: "Conversas, mensagens, status e handoff humano como nucleo operacional.",
    impact: "Organiza o canal de maior receita.",
  },
  {
    title: "IA assistida",
    description: "Preparado para respostas com contexto da organizacao e revisao humana.",
    impact: "Controla qualidade e custo.",
  },
  {
    title: "Billing",
    description: "Planos, limites e status de assinatura entram na arquitetura desde o inicio.",
    impact: "Transforma uso em receita recorrente.",
  },
] as const;
