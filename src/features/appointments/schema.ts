import { z } from "zod";
import type { AppointmentStatus, AppointmentViewMode } from "@/features/appointments/types";

export const appointmentStatusOptions = [
  { label: "Marcado", value: "scheduled" },
  { label: "Confirmado", value: "confirmed" },
  { label: "Cancelado", value: "canceled" },
  { label: "Concluido", value: "completed" },
] as const;

export const appointmentViewOptions = [
  { label: "Dia", value: "day" },
  { label: "Semana", value: "week" },
] as const;

const uuidSchema = z.string().uuid("Registro invalido.");

const statusSchema = z.enum(["scheduled", "confirmed", "canceled", "completed"], {
  error: "Selecione um status valido.",
});

const dateTimeSchema = z
  .string()
  .trim()
  .min(1, "Informe data e horario.")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Informe uma data valida.")
  .transform((value) => new Date(value).toISOString());

const optionalEndDateTimeSchema = z
  .string()
  .trim()
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
    message: "Informe uma data valida.",
  })
  .transform((value) => (value ? new Date(value).toISOString() : null));

export const appointmentFormSchema = z
  .object({
    customerId: uuidSchema,
    notes: z.string().trim().max(2000, "Use no maximo 2000 caracteres.").default(""),
    scheduledEndAt: optionalEndDateTimeSchema,
    scheduledStartAt: dateTimeSchema,
    serviceId: z.string().trim().optional().default(""),
    status: statusSchema,
  })
  .refine(
    (values) =>
      !values.scheduledEndAt ||
      new Date(values.scheduledEndAt).getTime() >
        new Date(values.scheduledStartAt).getTime(),
    {
      message: "O fim deve ser depois do inicio.",
      path: ["scheduledEndAt"],
    },
  );

export const appointmentUpdateSchema = appointmentFormSchema.extend({
  id: uuidSchema,
});

export const appointmentIdSchema = z.object({
  id: uuidSchema,
});

export type AppointmentActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status: "idle" | "success" | "error";
};

export const initialAppointmentActionState: AppointmentActionState = {
  status: "idle",
};

export function parseAppointmentView(value: string | undefined): AppointmentViewMode {
  return value === "week" ? "week" : "day";
}

export function parseAppointmentDate(value: string | undefined) {
  if (!value) {
    return toDateInputValue(new Date());
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return toDateInputValue(new Date());
  }

  return value;
}

export function getAppointmentFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function parseAppointmentForm(formData: FormData) {
  return appointmentFormSchema.safeParse({
    customerId: getAppointmentFormString(formData, "customerId"),
    notes: getAppointmentFormString(formData, "notes"),
    scheduledEndAt: getAppointmentFormString(formData, "scheduledEndAt"),
    scheduledStartAt: getAppointmentFormString(formData, "scheduledStartAt"),
    serviceId: getAppointmentFormString(formData, "serviceId"),
    status: getAppointmentFormString(formData, "status"),
  });
}

export function parseAppointmentUpdateForm(formData: FormData) {
  return appointmentUpdateSchema.safeParse({
    customerId: getAppointmentFormString(formData, "customerId"),
    id: getAppointmentFormString(formData, "id"),
    notes: getAppointmentFormString(formData, "notes"),
    scheduledEndAt: getAppointmentFormString(formData, "scheduledEndAt"),
    scheduledStartAt: getAppointmentFormString(formData, "scheduledStartAt"),
    serviceId: getAppointmentFormString(formData, "serviceId"),
    status: getAppointmentFormString(formData, "status"),
  });
}

export function parseAppointmentIdForm(formData: FormData) {
  return appointmentIdSchema.safeParse({
    id: getAppointmentFormString(formData, "id"),
  });
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

export function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 10);
}

export function formatAppointmentStatus(status: AppointmentStatus) {
  const labels = {
    canceled: "Cancelado",
    completed: "Concluido",
    confirmed: "Confirmado",
    scheduled: "Marcado",
  } as const;

  return labels[status];
}
