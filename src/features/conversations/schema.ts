import { z } from "zod";
import type { ConversationFilter } from "@/features/conversations/types";

export const conversationFilterOptions = [
  { label: "Abertas", value: "open" },
  { label: "Aguardando humano", value: "human" },
  { label: "Finalizadas", value: "closed" },
] as const;

export const conversationFilters = conversationFilterOptions.map(
  (option) => option.value,
) as [ConversationFilter, ...ConversationFilter[]];

const uuidSchema = z.string().uuid("Conversa invalida.");

export const createTestConversationSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Informe o nome do cliente.")
    .max(160, "Use no maximo 160 caracteres."),
  customerPhone: z
    .string()
    .trim()
    .max(40, "Use no maximo 40 caracteres.")
    .default(""),
  firstMessage: z
    .string()
    .trim()
    .min(2, "Digite a primeira mensagem.")
    .max(2000, "Use no maximo 2000 caracteres."),
});

export const manualReplySchema = z.object({
  conversationId: uuidSchema,
  message: z
    .string()
    .trim()
    .min(1, "Digite uma resposta.")
    .max(3000, "Use no maximo 3000 caracteres."),
});

export const conversationIdSchema = z.object({
  conversationId: uuidSchema,
});

export type ConversationActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status: "idle" | "success" | "error";
};

export const initialConversationActionState: ConversationActionState = {
  status: "idle",
};

export function parseConversationFilter(value: string | undefined): ConversationFilter {
  return conversationFilters.includes(value as ConversationFilter)
    ? (value as ConversationFilter)
    : "open";
}

export function getConversationFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function parseCreateTestConversationForm(formData: FormData) {
  return createTestConversationSchema.safeParse({
    customerName: getConversationFormString(formData, "customerName"),
    customerPhone: getConversationFormString(formData, "customerPhone"),
    firstMessage: getConversationFormString(formData, "firstMessage"),
  });
}

export function parseManualReplyForm(formData: FormData) {
  return manualReplySchema.safeParse({
    conversationId: getConversationFormString(formData, "conversationId"),
    message: getConversationFormString(formData, "message"),
  });
}

export function parseConversationIdForm(formData: FormData) {
  return conversationIdSchema.safeParse({
    conversationId: getConversationFormString(formData, "conversationId"),
  });
}
