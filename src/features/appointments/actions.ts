"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { createAppointment } from "@/lib/appointments/create-appointment";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrganizationRole } from "@/lib/tenant.server";
import {
  parseAppointmentForm,
  parseAppointmentIdForm,
  parseAppointmentUpdateForm,
  type AppointmentActionState,
} from "@/features/appointments/schema";

const appointmentsPath = "/app/appointments";

export async function createAppointmentAction(
  _previousState: AppointmentActionState,
  formData: FormData,
): Promise<AppointmentActionState> {
  const parsed = parseAppointmentForm(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revise os dados do agendamento.",
      status: "error",
    };
  }

  return saveAppointmentMutation(async () => {
    const profile = await requireOrganizationRole(["owner", "admin", "agent"]);
    const supabase = await createSupabaseServerClient();
    const values = parsed.data;

    await createAppointment(
      {
        customerId: values.customerId,
        notes: values.notes,
        organizationId: profile.organizationId,
        scheduledEndAt: values.scheduledEndAt,
        scheduledStartAt: values.scheduledStartAt,
        serviceId: values.serviceId || null,
        status: values.status === "confirmed" ? "confirmed" : "scheduled",
      },
      { supabase },
    );

    return "Agendamento criado com sucesso.";
  });
}

export async function updateAppointmentAction(
  _previousState: AppointmentActionState,
  formData: FormData,
): Promise<AppointmentActionState> {
  const parsed = parseAppointmentUpdateForm(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revise os dados do agendamento.",
      status: "error",
    };
  }

  return saveAppointmentMutation(async () => {
    const profile = await requireOrganizationRole(["owner", "admin", "agent"]);
    const supabase = await createSupabaseServerClient();
    const values = parsed.data;
    const serviceId = values.serviceId || null;

    await assertCustomerBelongsToTenant(supabase, profile.organizationId, values.customerId);

    if (serviceId) {
      await assertServiceBelongsToTenant(supabase, profile.organizationId, serviceId);
    }

    const { error } = await supabase
      .from("appointments")
      .update({
        customer_id: values.customerId,
        notes: values.notes || null,
        scheduled_end_at: values.scheduledEndAt,
        scheduled_start_at: values.scheduledStartAt,
        service_id: serviceId,
        status: values.status,
      })
      .eq("organization_id", profile.organizationId)
      .eq("id", values.id);

    if (error) {
      throw error;
    }

    await supabase
      .from("customers")
      .update({ next_follow_up_at: values.scheduledStartAt })
      .eq("organization_id", profile.organizationId)
      .eq("id", values.customerId);

    return "Agendamento atualizado com sucesso.";
  });
}

export async function cancelAppointmentAction(formData: FormData): Promise<void> {
  const parsed = parseAppointmentIdForm(formData);

  if (!parsed.success || !isSupabaseConfigured()) {
    return;
  }

  try {
    const profile = await requireOrganizationRole(["owner", "admin", "agent"]);
    const supabase = await createSupabaseServerClient();

    await supabase
      .from("appointments")
      .update({ status: "canceled" })
      .eq("organization_id", profile.organizationId)
      .eq("id", parsed.data.id);

    revalidatePath(appointmentsPath);
  } catch {
    // The UI remains unchanged when authorization or cancellation fails.
  }
}

async function saveAppointmentMutation(
  mutation: () => Promise<string>,
): Promise<AppointmentActionState> {
  if (!isSupabaseConfigured()) {
    return {
      message: "Supabase nao esta configurado neste ambiente.",
      status: "error",
    };
  }

  try {
    const message = await mutation();
    revalidatePath(appointmentsPath);

    return {
      message,
      status: "success",
    };
  } catch {
    return {
      message:
        "Nao foi possivel salvar o agendamento. Verifique cliente, servico, horario e permissao.",
      status: "error",
    };
  }
}

async function assertCustomerBelongsToTenant(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
  customerId: string,
) {
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", customerId)
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Customer not found");
  }
}

async function assertServiceBelongsToTenant(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
  serviceId: string,
) {
  const { data, error } = await supabase
    .from("services")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", serviceId)
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Service not found");
  }
}
