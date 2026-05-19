import { z } from "zod";
import type { CatalogStatus } from "@/features/catalog/types";

export const catalogStatusOptions = [
  { label: "Ativo", value: "active" },
  { label: "Inativo", value: "inactive" },
] as const;

const statusSchema = z.enum(["active", "inactive"], {
  error: "Selecione um status valido.",
});

const uuidSchema = z.string().uuid("Registro invalido.");

const optionalText = z.string().trim().max(1000, "Use no maximo 1000 caracteres.");

const categorySchema = z.string().trim().max(120, "Use no maximo 120 caracteres.");

const priceSchema = z
  .string()
  .trim()
  .min(1, "Informe o preco.")
  .refine((value) => parsePriceToCents(value) !== null, "Informe um preco valido.")
  .transform((value) => parsePriceToCents(value) ?? 0)
  .refine((value) => value >= 0, "O preco nao pode ser negativo.");

const optionalStockSchema = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) {
      return true;
    }

    return Number.isInteger(Number(value)) && Number(value) >= 0;
  }, "Informe um estoque inteiro maior ou igual a zero.")
  .transform((value) => (value ? Number(value) : null));

const durationSchema = z
  .string()
  .trim()
  .min(1, "Informe a duracao.")
  .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, {
    message: "A duracao deve ser um numero inteiro maior que zero.",
  })
  .transform((value) => Number(value));

export const productFormSchema = z.object({
  category: categorySchema.default(""),
  description: optionalText.default(""),
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome do produto.")
    .max(160, "Use no maximo 160 caracteres."),
  priceCents: priceSchema,
  status: statusSchema,
  stockQuantity: optionalStockSchema,
});

export const productUpdateSchema = productFormSchema.extend({
  id: uuidSchema,
});

export const serviceFormSchema = z.object({
  category: categorySchema.default(""),
  description: optionalText.default(""),
  durationMinutes: durationSchema,
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome do servico.")
    .max(160, "Use no maximo 160 caracteres."),
  priceCents: priceSchema,
  status: statusSchema,
});

export const serviceUpdateSchema = serviceFormSchema.extend({
  id: uuidSchema,
});

export const deleteCatalogItemSchema = z.object({
  id: uuidSchema,
});

export type ProductFormValues = z.input<typeof productFormSchema> & {
  status: CatalogStatus;
};

export type ServiceFormValues = z.input<typeof serviceFormSchema> & {
  status: CatalogStatus;
};

export type CatalogFormFieldErrors = Record<string, string[] | undefined>;

export type CatalogActionState = {
  fieldErrors?: CatalogFormFieldErrors;
  message?: string;
  status: "idle" | "success" | "error";
};

export const initialCatalogActionState: CatalogActionState = {
  status: "idle",
};

export function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function parseProductForm(formData: FormData) {
  return productFormSchema.safeParse({
    category: getFormString(formData, "category"),
    description: getFormString(formData, "description"),
    name: getFormString(formData, "name"),
    priceCents: getFormString(formData, "price"),
    status: getFormString(formData, "status"),
    stockQuantity: getFormString(formData, "stockQuantity"),
  });
}

export function parseProductUpdateForm(formData: FormData) {
  return productUpdateSchema.safeParse({
    category: getFormString(formData, "category"),
    description: getFormString(formData, "description"),
    id: getFormString(formData, "id"),
    name: getFormString(formData, "name"),
    priceCents: getFormString(formData, "price"),
    status: getFormString(formData, "status"),
    stockQuantity: getFormString(formData, "stockQuantity"),
  });
}

export function parseServiceForm(formData: FormData) {
  return serviceFormSchema.safeParse({
    category: getFormString(formData, "category"),
    description: getFormString(formData, "description"),
    durationMinutes: getFormString(formData, "durationMinutes"),
    name: getFormString(formData, "name"),
    priceCents: getFormString(formData, "price"),
    status: getFormString(formData, "status"),
  });
}

export function parseServiceUpdateForm(formData: FormData) {
  return serviceUpdateSchema.safeParse({
    category: getFormString(formData, "category"),
    description: getFormString(formData, "description"),
    durationMinutes: getFormString(formData, "durationMinutes"),
    id: getFormString(formData, "id"),
    name: getFormString(formData, "name"),
    priceCents: getFormString(formData, "price"),
    status: getFormString(formData, "status"),
  });
}

export function parseDeleteCatalogItemForm(formData: FormData) {
  return deleteCatalogItemSchema.safeParse({
    id: getFormString(formData, "id"),
  });
}

export function formatPriceInput(priceCents: number) {
  return (priceCents / 100).toFixed(2).replace(".", ",");
}

export function formatCurrency(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(priceCents / 100);
}

function parsePriceToCents(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const price = Number(normalized);

  if (!Number.isFinite(price)) {
    return null;
  }

  return Math.round(price * 100);
}
