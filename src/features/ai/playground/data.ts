import type { AiConversationMessageRole } from "@/lib/ai/types";

export type PlaygroundFakeConversation = {
  customer: {
    email?: string;
    name: string;
    phone?: string;
  };
  defaultCustomerMessage: string;
  description: string;
  id: "lead-produto" | "agendamento-servico" | "objecao-preco";
  label: string;
  seedMessages: Array<{
    content: string;
    role: AiConversationMessageRole;
  }>;
};

export const fakePlaygroundConversations = [
  {
    customer: {
      name: "Marina Costa",
      phone: "+55 11 99999-0001",
    },
    defaultCustomerMessage: "Gostei desse servico. Qual o valor e como faco para agendar?",
    description: "Lead quente perguntando preco e proximo passo.",
    id: "agendamento-servico",
    label: "Lead para agendamento",
    seedMessages: [
      {
        content: "Oi, vi voces pelo Instagram e queria saber se fazem atendimento esta semana.",
        role: "customer",
      },
      {
        content: "Fazemos sim. Me conta qual servico voce procura para eu te orientar melhor.",
        role: "ai",
      },
    ],
  },
  {
    customer: {
      email: "rafael.teste@example.com",
      name: "Rafael Lima",
    },
    defaultCustomerMessage: "Esse produto tem pronta entrega? Se tiver, quero entender as formas de compra.",
    description: "Cliente avaliando um produto do catalogo.",
    id: "lead-produto",
    label: "Interesse em produto",
    seedMessages: [
      {
        content: "Boa tarde. Estou pesquisando um produto para comprar ainda hoje.",
        role: "customer",
      },
      {
        content: "Boa tarde. Posso te ajudar a escolher a melhor opcao.",
        role: "ai",
      },
    ],
  },
  {
    customer: {
      name: "Bianca Alves",
      phone: "+55 21 98888-0002",
    },
    defaultCustomerMessage: "Achei um pouco caro. Tem algum motivo para valer esse preco?",
    description: "Cliente com objecao comercial antes de fechar.",
    id: "objecao-preco",
    label: "Objecao de preco",
    seedMessages: [
      {
        content: "Eu gostei, mas estou comparando com outras opcoes.",
        role: "customer",
      },
      {
        content: "Claro. Posso te explicar os diferenciais para voce comparar com seguranca.",
        role: "ai",
      },
    ],
  },
] as const satisfies readonly PlaygroundFakeConversation[];

export type PlaygroundFakeConversationId =
  (typeof fakePlaygroundConversations)[number]["id"];

export const defaultPlaygroundFakeConversationId =
  fakePlaygroundConversations[0].id;

export const playgroundFakeConversationIds = fakePlaygroundConversations.map(
  (conversation) => conversation.id,
) as [PlaygroundFakeConversationId, ...PlaygroundFakeConversationId[]];

export function getFakePlaygroundConversation(id: string | null | undefined) {
  return (
    fakePlaygroundConversations.find((conversation) => conversation.id === id) ??
    fakePlaygroundConversations[0]
  );
}

export function getPlaygroundExternalThreadId(
  organizationId: string,
  fakeConversationId: PlaygroundFakeConversationId,
) {
  return `ai-playground:${organizationId}:${fakeConversationId}`;
}
