import { z } from "zod";
import {
  defaultPlaygroundFakeConversationId,
  playgroundFakeConversationIds,
  type PlaygroundFakeConversationId,
} from "@/features/ai/playground/data";

export const playgroundGenerateSchema = z.object({
  customerMessage: z
    .string()
    .trim()
    .min(2, "Digite uma mensagem do cliente.")
    .max(2000, "Use no maximo 2000 caracteres."),
  fakeConversationId: z.enum(playgroundFakeConversationIds, {
    error: "Selecione uma conversa fake valida.",
  }),
});

export type PlaygroundGenerateValues = z.infer<typeof playgroundGenerateSchema>;

export type PlaygroundFieldErrors = Partial<
  Record<keyof PlaygroundGenerateValues, string[]>
>;

export type PlaygroundDebugContext = {
  business: {
    businessHours: string | null;
    name: string;
    niche: string | null;
    toneOfVoice: string | null;
  };
  conversation: {
    fakeConversationId: PlaygroundFakeConversationId;
    persistedConversationId?: string;
    seedScenario: string;
  };
  currentCustomerMessage: string;
  history: Array<{
    content: string;
    createdAt?: string | null;
    role: string;
  }>;
  knowledgeBase: Array<{
    category: string | null;
    priority: number | null;
    title: string;
  }>;
  products: Array<{
    category: string | null;
    name: string;
    priceCents: number | null;
    status: string | null;
  }>;
  promptMetadata?: {
    activeKnowledgeItems: number;
    activeProducts: number;
    activeServices: number;
    historyMessages: number;
  };
  services: Array<{
    category: string | null;
    durationMinutes: number | null;
    name: string;
    priceCents: number | null;
    status: string | null;
  }>;
};

export type PlaygroundActionState = {
  debug?: PlaygroundDebugContext;
  fieldErrors?: PlaygroundFieldErrors;
  message?: string;
  response?: {
    finishReason?: string;
    handoffReason?: string;
    model: string;
    status: "generated" | "handoff";
    text: string;
  };
  selectedFakeConversationId: PlaygroundFakeConversationId;
  status: "idle" | "success" | "error";
};

export const initialPlaygroundActionState: PlaygroundActionState = {
  selectedFakeConversationId: defaultPlaygroundFakeConversationId,
  status: "idle",
};

export function getPlaygroundFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function parsePlaygroundGenerateForm(formData: FormData) {
  return playgroundGenerateSchema.safeParse({
    customerMessage: getPlaygroundFormString(formData, "customerMessage"),
    fakeConversationId: getPlaygroundFormString(formData, "fakeConversationId"),
  });
}
