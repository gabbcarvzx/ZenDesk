import { z } from "zod";
import type {
  PaymentDatabaseStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/features/payments/types";

export const paymentStatusOptions = [
  { label: "Pendente", value: "pending" },
  { label: "Pago", value: "paid" },
  { label: "Cancelado", value: "canceled" },
  { label: "Expirado", value: "expired" },
] as const;

export const paymentMethodOptions = [
  { label: "Pix", value: "pix" },
  { label: "Cartao", value: "card" },
  { label: "Dinheiro", value: "cash" },
  { label: "Outro", value: "other" },
] as const;

const paymentStatuses = paymentStatusOptions.map((option) => option.value) as [
  PaymentStatus,
  ...PaymentStatus[],
];

const paymentMethods = paymentMethodOptions.map((option) => option.value) as [
  PaymentMethod,
  ...PaymentMethod[],
];

const uuidSchema = z.string().uuid("Registro invalido.");

const optionalUuidSchema = z
  .string()
  .trim()
  .refine((value) => !value || z.string().uuid().safeParse(value).success, {
    message: "Registro invalido.",
  })
  .transform((value) => value || null);

const amountSchema = z
  .string()
  .trim()
  .min(1, "Informe o valor.")
  .refine((value) => parseAmountToCents(value) !== null, "Informe um valor valido.")
  .transform((value) => parseAmountToCents(value) ?? 0)
  .refine((value) => value > 0, "O valor deve ser maior que zero.");

const dueAtSchema = z
  .string()
  .trim()
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
    message: "Informe uma data valida.",
  })
  .transform((value) => (value ? new Date(value).toISOString() : null));

const statusSchema = z.enum(paymentStatuses, {
  error: "Selecione um status valido.",
});

const methodSchema = z.enum(paymentMethods, {
  error: "Selecione um metodo valido.",
});

export const paymentFormSchema = z.object({
  amountCents: amountSchema,
  conversationId: optionalUuidSchema,
  customerId: uuidSchema,
  description: z
    .string()
    .trim()
    .min(2, "Informe uma descricao.")
    .max(500, "Use no maximo 500 caracteres."),
  dueAt: dueAtSchema,
  method: methodSchema,
  status: statusSchema,
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export type PaymentActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status: "idle" | "success" | "error";
};

export const initialPaymentActionState: PaymentActionState = {
  status: "idle",
};

export function parsePaymentForm(formData: FormData) {
  return paymentFormSchema.safeParse({
    amountCents: getPaymentFormString(formData, "amount"),
    conversationId: getPaymentFormString(formData, "conversationId"),
    customerId: getPaymentFormString(formData, "customerId"),
    description: getPaymentFormString(formData, "description"),
    dueAt: getPaymentFormString(formData, "dueAt"),
    method: getPaymentFormString(formData, "method"),
    status: getPaymentFormString(formData, "status"),
  });
}

export function getPaymentFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function mapPaymentStatusToRow(status: PaymentStatus): PaymentDatabaseStatus {
  if (status === "expired") {
    return "overdue";
  }

  return status;
}

export function mapPaymentStatusFromRow(status: PaymentDatabaseStatus): PaymentStatus {
  if (status === "overdue") {
    return "expired";
  }

  if (status === "refunded" || status === "failed") {
    return "canceled";
  }

  return status;
}

export function formatPaymentStatus(status: PaymentStatus) {
  const labels = {
    canceled: "Cancelado",
    expired: "Expirado",
    paid: "Pago",
    pending: "Pendente",
  } as const;

  return labels[status];
}

export function formatPaymentMethod(method: PaymentMethod) {
  const labels = {
    card: "Cartao",
    cash: "Dinheiro",
    other: "Outro",
    pix: "Pix",
  } as const;

  return labels[method];
}

export function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(amountCents / 100);
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

function parseAmountToCents(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100);
}
