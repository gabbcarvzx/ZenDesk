import { z } from "zod";
import type { KnowledgeBaseStatus } from "@/features/ai/knowledge-base/types";

export const knowledgeBaseStatusOptions = [
  { label: "Ativo", value: "active" },
  { label: "Inativo", value: "inactive" },
] as const;

const statusSchema = z.enum(["active", "inactive"], {
  error: "Selecione um status valido.",
});

const uuidSchema = z.string().uuid("Registro invalido.");

const categorySchema = z.string().trim().max(120, "Use no maximo 120 caracteres.");

const prioritySchema = z
  .string()
  .trim()
  .min(1, "Informe a prioridade.")
  .refine((value) => Number.isInteger(Number(value)), {
    message: "A prioridade deve ser um numero inteiro.",
  })
  .transform((value) => Number(value))
  .refine((value) => value >= 1 && value <= 10, {
    message: "Use uma prioridade entre 1 e 10.",
  });

export const knowledgeBaseFormSchema = z.object({
  category: categorySchema.default(""),
  content: z
    .string()
    .trim()
    .min(10, "Descreva o conteudo com pelo menos 10 caracteres.")
    .max(5000, "Use no maximo 5000 caracteres."),
  priority: prioritySchema,
  status: statusSchema,
  title: z
    .string()
    .trim()
    .min(2, "Informe o titulo.")
    .max(160, "Use no maximo 160 caracteres."),
});

export const knowledgeBaseUpdateSchema = knowledgeBaseFormSchema.extend({
  id: uuidSchema,
});

export const knowledgeBaseIdSchema = z.object({
  id: uuidSchema,
});

export const knowledgeBaseStatusUpdateSchema = z.object({
  id: uuidSchema,
  status: statusSchema,
});

export type KnowledgeBaseFormValues = z.input<typeof knowledgeBaseFormSchema> & {
  status: KnowledgeBaseStatus;
};

export type KnowledgeBaseFormFieldErrors = Record<string, string[] | undefined>;

export type KnowledgeBaseActionState = {
  fieldErrors?: KnowledgeBaseFormFieldErrors;
  message?: string;
  status: "idle" | "success" | "error";
};

export const initialKnowledgeBaseActionState: KnowledgeBaseActionState = {
  status: "idle",
};

export function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function parseKnowledgeBaseForm(formData: FormData) {
  return knowledgeBaseFormSchema.safeParse({
    category: getFormString(formData, "category"),
    content: getFormString(formData, "content"),
    priority: getFormString(formData, "priority"),
    status: getFormString(formData, "status"),
    title: getFormString(formData, "title"),
  });
}

export function parseKnowledgeBaseUpdateForm(formData: FormData) {
  return knowledgeBaseUpdateSchema.safeParse({
    category: getFormString(formData, "category"),
    content: getFormString(formData, "content"),
    id: getFormString(formData, "id"),
    priority: getFormString(formData, "priority"),
    status: getFormString(formData, "status"),
    title: getFormString(formData, "title"),
  });
}

export function parseKnowledgeBaseIdForm(formData: FormData) {
  return knowledgeBaseIdSchema.safeParse({
    id: getFormString(formData, "id"),
  });
}

export function parseKnowledgeBaseStatusUpdateForm(formData: FormData) {
  return knowledgeBaseStatusUpdateSchema.safeParse({
    id: getFormString(formData, "id"),
    status: getFormString(formData, "status"),
  });
}
