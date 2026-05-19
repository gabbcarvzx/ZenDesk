import { z } from "zod";
import type {
  CustomerLifecycleStatusRow,
  CustomerStatus,
} from "@/features/customers/types";

export const customerStatusOptions = [
  { label: "Lead", value: "lead" },
  { label: "Cliente", value: "customer" },
  { label: "Inativo", value: "inactive" },
] as const;

export const customerSourceOptions = [
  { label: "Manual", value: "manual" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Web", value: "web" },
  { label: "Instagram", value: "instagram" },
  { label: "Indicacao", value: "indicacao" },
] as const;

const uuidSchema = z.string().uuid("Cliente invalido.");

const optionalEmail = z
  .string()
  .trim()
  .max(180, "Use no maximo 180 caracteres.")
  .refine((value) => !value || z.email().safeParse(value).success, {
    message: "Informe um email valido.",
  });

const optionalPhone = z
  .string()
  .trim()
  .max(40, "Use no maximo 40 caracteres.");

const tagsSchema = z
  .string()
  .trim()
  .max(500, "Use no maximo 500 caracteres em tags.")
  .transform(parseTags);

const lastContactSchema = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) {
      return true;
    }

    return !Number.isNaN(new Date(value).getTime());
  }, "Informe uma data valida.")
  .transform((value) => (value ? new Date(value).toISOString() : null));

export const customerFormSchema = z.object({
  email: optionalEmail.default(""),
  lastContactAt: lastContactSchema,
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome do cliente.")
    .max(160, "Use no maximo 160 caracteres."),
  notes: z.string().trim().max(3000, "Use no maximo 3000 caracteres.").default(""),
  phone: optionalPhone.default(""),
  source: z.string().trim().min(2, "Informe a origem.").max(80, "Use no maximo 80 caracteres."),
  status: z.enum(["lead", "customer", "inactive"], {
    error: "Selecione um status valido.",
  }),
  tags: tagsSchema,
});

export const customerUpdateSchema = customerFormSchema.extend({
  id: uuidSchema,
});

export type CustomerFormValues = z.input<typeof customerFormSchema> & {
  status: CustomerStatus;
};

export type CustomerFormFieldErrors = Record<string, string[] | undefined>;

export type CustomerActionState = {
  fieldErrors?: CustomerFormFieldErrors;
  message?: string;
  status: "idle" | "success" | "error";
};

export const initialCustomerActionState: CustomerActionState = {
  status: "idle",
};

export function getCustomerFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function parseCustomerForm(formData: FormData) {
  return customerFormSchema.safeParse({
    email: getCustomerFormString(formData, "email"),
    lastContactAt: getCustomerFormString(formData, "lastContactAt"),
    name: getCustomerFormString(formData, "name"),
    notes: getCustomerFormString(formData, "notes"),
    phone: getCustomerFormString(formData, "phone"),
    source: getCustomerFormString(formData, "source"),
    status: getCustomerFormString(formData, "status"),
    tags: getCustomerFormString(formData, "tags"),
  });
}

export function parseCustomerUpdateForm(formData: FormData) {
  return customerUpdateSchema.safeParse({
    email: getCustomerFormString(formData, "email"),
    id: getCustomerFormString(formData, "id"),
    lastContactAt: getCustomerFormString(formData, "lastContactAt"),
    name: getCustomerFormString(formData, "name"),
    notes: getCustomerFormString(formData, "notes"),
    phone: getCustomerFormString(formData, "phone"),
    source: getCustomerFormString(formData, "source"),
    status: getCustomerFormString(formData, "status"),
    tags: getCustomerFormString(formData, "tags"),
  });
}

export function mapCustomerStatusToRow(status: CustomerStatus): CustomerLifecycleStatusRow {
  if (status === "customer") {
    return "customer";
  }

  if (status === "inactive") {
    return "inactive";
  }

  return "new";
}

export function mapCustomerStatusFromRow(
  status: CustomerLifecycleStatusRow,
): CustomerStatus {
  if (status === "customer") {
    return "customer";
  }

  if (status === "inactive") {
    return "inactive";
  }

  return "lead";
}

export function formatTagsInput(tags: string[]) {
  return tags.join(", ");
}

export function formatDateTimeInput(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, 40)),
    ),
  ).slice(0, 12);
}
