import { createAppointment } from "@/lib/appointments/create-appointment";
import { ManualPaymentProvider } from "@/lib/billing/payment-provider";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  AiActionDecision,
  AiCreateAppointmentToolInput,
  AiCreatePaymentToolInput,
  AiRequestHumanToolInput,
  AiToolExecutionContext,
  AiToolResult,
  AiUpdateCustomerToolInput,
} from "@/lib/ai/types";

type SupabaseAiClient =
  | Awaited<ReturnType<typeof createSupabaseServerClient>>
  | ReturnType<typeof createSupabaseServiceRoleClient>;

export async function executeAiActionDecision(
  decision: AiActionDecision,
  context?: AiToolExecutionContext,
): Promise<AiToolResult[]> {
  if (decision.status !== "approved" || decision.tool === "none") {
    return [
      {
        message: decision.reason,
        status: "skipped",
        tool: decision.tool,
      },
    ];
  }

  if (!context?.supabase) {
    return [
      {
        message: "Internal database client is missing.",
        status: "failed",
        tool: decision.tool,
      },
    ];
  }

  const supabase = context.supabase as SupabaseAiClient;

  try {
    if (decision.tool === "create_appointment") {
      return [
        await createAppointmentTool({
          context,
          input: decision.input as AiCreateAppointmentToolInput,
          supabase,
        }),
      ];
    }

    if (decision.tool === "create_payment") {
      return [
        await createPaymentTool({
          context,
          input: decision.input as AiCreatePaymentToolInput,
          supabase,
        }),
      ];
    }

    if (decision.tool === "update_customer") {
      return [
        await updateCustomerTool({
          context,
          input: decision.input as AiUpdateCustomerToolInput,
          supabase,
        }),
      ];
    }

    if (decision.tool === "request_human") {
      return [
        await requestHumanTool({
          context,
          input: decision.input as AiRequestHumanToolInput,
          supabase,
        }),
      ];
    }

    return [
      {
        message: "Unknown tool.",
        status: "skipped",
        tool: decision.tool,
      },
    ];
  } catch (error) {
    return [
      {
        data: {
          errorName: error instanceof Error ? error.name : "UnknownError",
        },
        message: "Internal tool execution failed.",
        status: "failed",
        tool: decision.tool,
      },
    ];
  }
}

async function createAppointmentTool({
  context,
  input,
  supabase,
}: {
  context: AiToolExecutionContext;
  input: AiCreateAppointmentToolInput;
  supabase: SupabaseAiClient;
}): Promise<AiToolResult> {
  assertSameCustomer(context, input.customerId);
  assertSameConversation(context, input.conversationId ?? null);

  const result = await createAppointment(
    {
      conversationId: input.conversationId ?? null,
      customerId: input.customerId,
      metadata: {
        source: context.source ?? "ai_internal_tool",
      },
      notes: input.notes ?? null,
      organizationId: context.organizationId,
      scheduledEndAt: input.scheduledEndAt ?? null,
      scheduledStartAt: input.scheduledStartAt,
      serviceId: input.serviceId ?? null,
      status: "scheduled",
    },
    { supabase: supabase as Awaited<ReturnType<typeof createSupabaseServerClient>> },
  );

  return {
    data: {
      appointmentId: result.appointment.id,
      scheduledStartAt: result.appointment.scheduledStartAt,
    },
    message: "Appointment created.",
    status: "executed",
    tool: "create_appointment",
  };
}

async function createPaymentTool({
  context,
  input,
  supabase,
}: {
  context: AiToolExecutionContext;
  input: AiCreatePaymentToolInput;
  supabase: SupabaseAiClient;
}): Promise<AiToolResult> {
  assertSameCustomer(context, input.customerId);
  assertSameConversation(context, input.conversationId ?? null);

  const provider = new ManualPaymentProvider();
  const providerResult = await provider.createCharge({
    amountCents: input.amountCents,
    conversationId: input.conversationId ?? null,
    currency: "BRL",
    customerId: input.customerId,
    description: input.description,
    dueAt: input.dueAt ?? null,
    method: input.method,
    organizationId: context.organizationId,
  });
  const { data, error } = await supabase
    .from("payments")
    .insert({
      amount_cents: input.amountCents,
      conversation_id: input.conversationId ?? null,
      currency: "BRL",
      customer_id: input.customerId,
      description: input.description,
      due_at: input.dueAt ?? null,
      metadata: {
        method: input.method,
        providerResult: {
          expiresAt: providerResult.expiresAt ?? null,
          status: providerResult.status,
        },
        source: context.source ?? "ai_internal_tool",
      },
      organization_id: context.organizationId,
      paid_at: null,
      provider: providerResult.provider,
      provider_payment_id: providerResult.providerPaymentId ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return {
    data: {
      amountCents: input.amountCents,
      paymentId: (data as { id: string }).id,
    },
    message: "Payment created.",
    status: "executed",
    tool: "create_payment",
  };
}

async function updateCustomerTool({
  context,
  input,
  supabase,
}: {
  context: AiToolExecutionContext;
  input: AiUpdateCustomerToolInput;
  supabase: SupabaseAiClient;
}): Promise<AiToolResult> {
  assertSameCustomer(context, input.customerId);

  const update = removeEmptyValues({
    email: input.email,
    last_interaction_at: new Date().toISOString(),
    name: input.name,
    notes: input.notes,
    phone: input.phone,
  });

  if (!Object.keys(update).length) {
    return {
      message: "No safe customer fields to update.",
      status: "skipped",
      tool: "update_customer",
    };
  }

  const { error } = await supabase
    .from("customers")
    .update(update)
    .eq("organization_id", context.organizationId)
    .eq("id", input.customerId);

  if (error) {
    throw error;
  }

  return {
    data: {
      updatedFields: Object.keys(update).filter((field) => field !== "last_interaction_at"),
    },
    message: "Customer updated.",
    status: "executed",
    tool: "update_customer",
  };
}

async function requestHumanTool({
  context,
  input,
  supabase,
}: {
  context: AiToolExecutionContext;
  input: AiRequestHumanToolInput;
  supabase: SupabaseAiClient;
}): Promise<AiToolResult> {
  assertSameConversation(context, input.conversationId);

  const { data, error } = await supabase
    .from("human_handoffs")
    .select("id")
    .eq("organization_id", context.organizationId)
    .eq("conversation_id", input.conversationId)
    .in("status", ["open", "assigned"])
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return {
      data: {
        handoffId: (data as { id: string }).id,
      },
      message: "Human handoff already exists.",
      status: "executed",
      tool: "request_human",
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("human_handoffs")
    .insert({
      conversation_id: input.conversationId,
      customer_id: input.customerId ?? null,
      metadata: {
        source: context.source ?? "ai_internal_tool",
      },
      organization_id: context.organizationId,
      reason: input.reason,
      requested_by_message_id: input.requestedByMessageId ?? null,
      status: "open",
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return {
    data: {
      handoffId: (inserted as { id: string }).id,
    },
    message: "Human handoff requested.",
    status: "executed",
    tool: "request_human",
  };
}

function assertSameCustomer(context: AiToolExecutionContext, customerId: string) {
  if (!context.customerId || context.customerId !== customerId) {
    throw new Error("Customer mismatch in AI tool execution.");
  }
}

function assertSameConversation(
  context: AiToolExecutionContext,
  conversationId: string | null,
) {
  if (!conversationId) {
    return;
  }

  if (!context.conversationId || context.conversationId !== conversationId) {
    throw new Error("Conversation mismatch in AI tool execution.");
  }
}

function removeEmptyValues(values: Record<string, string | null | undefined>) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => typeof value === "string" && value.trim()),
  );
}
