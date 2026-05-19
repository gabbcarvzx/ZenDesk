import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type CreateAppointmentStatus = "scheduled" | "confirmed";

export type CreateAppointmentInput = {
  conversationId?: string | null;
  customerId: string;
  metadata?: Record<string, unknown>;
  notes?: string | null;
  organizationId: string;
  scheduledEndAt?: string | null;
  scheduledStartAt: string;
  serviceId?: string | null;
  status?: CreateAppointmentStatus;
};

export type CreateAppointmentResult = {
  appointment: {
    conversationId: string | null;
    customerId: string;
    id: string;
    scheduledEndAt: string | null;
    scheduledStartAt: string;
    serviceId: string | null;
    status: CreateAppointmentStatus;
  };
};

type ServiceRow = {
  duration_minutes: number | null;
  id: string;
};

type InsertedAppointmentRow = {
  conversation_id: string | null;
  customer_id: string;
  id: string;
  scheduled_end_at: string | null;
  scheduled_start_at: string;
  service_id: string | null;
  status: CreateAppointmentStatus;
};

export class AppointmentCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppointmentCreationError";
  }
}

export async function createAppointment(
  input: CreateAppointmentInput,
  options: { supabase?: SupabaseServerClient } = {},
): Promise<CreateAppointmentResult> {
  const supabase = options.supabase ?? (await createSupabaseServerClient());
  const organizationId = normalizeRequired(input.organizationId, "organizationId");
  const customerId = normalizeRequired(input.customerId, "customerId");
  const serviceId = normalizeOptional(input.serviceId);
  const conversationId = normalizeOptional(input.conversationId);
  const scheduledStartAt = normalizeDate(input.scheduledStartAt, "scheduledStartAt");

  await assertCustomerBelongsToTenant(supabase, organizationId, customerId);

  const service = serviceId
    ? await assertServiceBelongsToTenant(supabase, organizationId, serviceId)
    : null;

  if (conversationId) {
    await assertConversationBelongsToTenant(supabase, organizationId, conversationId);
  }

  const scheduledEndAt = resolveScheduledEndAt({
    explicitEndAt: input.scheduledEndAt,
    scheduledStartAt,
    serviceDurationMinutes: service?.duration_minutes ?? null,
  });

  if (scheduledEndAt && new Date(scheduledEndAt).getTime() <= new Date(scheduledStartAt).getTime()) {
    throw new AppointmentCreationError("scheduledEndAt must be after scheduledStartAt.");
  }

  const status = input.status ?? "scheduled";
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      conversation_id: conversationId,
      customer_id: customerId,
      metadata: {
        source: "internal_create_appointment",
        ...(input.metadata ?? {}),
      },
      notes: normalizeOptional(input.notes),
      organization_id: organizationId,
      scheduled_end_at: scheduledEndAt,
      scheduled_start_at: scheduledStartAt,
      service_id: serviceId,
      status,
    })
    .select("id,customer_id,service_id,conversation_id,scheduled_start_at,scheduled_end_at,status")
    .single();

  if (error) {
    throw new AppointmentCreationError("Could not create appointment.");
  }

  const appointment = data as InsertedAppointmentRow;

  await supabase
    .from("customers")
    .update({ next_follow_up_at: appointment.scheduled_start_at })
    .eq("organization_id", organizationId)
    .eq("id", customerId);

  return {
    appointment: {
      conversationId: appointment.conversation_id,
      customerId: appointment.customer_id,
      id: appointment.id,
      scheduledEndAt: appointment.scheduled_end_at,
      scheduledStartAt: appointment.scheduled_start_at,
      serviceId: appointment.service_id,
      status: appointment.status,
    },
  };
}

async function assertCustomerBelongsToTenant(
  supabase: SupabaseServerClient,
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
    throw new AppointmentCreationError("Customer does not belong to this tenant.");
  }
}

async function assertServiceBelongsToTenant(
  supabase: SupabaseServerClient,
  organizationId: string,
  serviceId: string,
) {
  const { data, error } = await supabase
    .from("services")
    .select("id,duration_minutes")
    .eq("organization_id", organizationId)
    .eq("id", serviceId)
    .maybeSingle();

  if (error || !data) {
    throw new AppointmentCreationError("Service does not belong to this tenant.");
  }

  return data as ServiceRow;
}

async function assertConversationBelongsToTenant(
  supabase: SupabaseServerClient,
  organizationId: string,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) {
    throw new AppointmentCreationError("Conversation does not belong to this tenant.");
  }
}

function resolveScheduledEndAt({
  explicitEndAt,
  scheduledStartAt,
  serviceDurationMinutes,
}: {
  explicitEndAt?: string | null;
  scheduledStartAt: string;
  serviceDurationMinutes: number | null;
}) {
  if (explicitEndAt) {
    return normalizeDate(explicitEndAt, "scheduledEndAt");
  }

  if (!serviceDurationMinutes || serviceDurationMinutes <= 0) {
    return null;
  }

  return new Date(
    new Date(scheduledStartAt).getTime() + serviceDurationMinutes * 60_000,
  ).toISOString();
}

function normalizeRequired(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new AppointmentCreationError(`${label} is required.`);
  }

  return normalized;
}

function normalizeOptional(value: string | null | undefined) {
  const normalized = (value ?? "").trim();

  return normalized || null;
}

function normalizeDate(value: string, label: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppointmentCreationError(`${label} must be a valid date.`);
  }

  return date.toISOString();
}
