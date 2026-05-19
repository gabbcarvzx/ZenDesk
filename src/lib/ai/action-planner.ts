import type {
  AiActionDecision,
  AiCreateAppointmentToolInput,
  AiCreatePaymentToolInput,
  AiIntentClassification,
  AiToolExecutionContext,
  BuildAiPromptInput,
} from "@/lib/ai/types";

export function decideAiAction({
  classification,
  input,
  toolContext,
}: {
  classification: AiIntentClassification;
  input: BuildAiPromptInput;
  toolContext?: AiToolExecutionContext;
}): AiActionDecision {
  if (!toolContext) {
    return {
      reason: "No internal tool context was provided.",
      status: "not_applicable",
      tool: "none",
    };
  }

  if (classification.intent === "human_handoff") {
    return decideHumanHandoff(classification, toolContext);
  }

  if (classification.intent === "appointment_request") {
    return decideAppointmentCreation({ classification, input, toolContext });
  }

  if (classification.intent === "payment_request") {
    return decidePaymentCreation({ classification, toolContext });
  }

  if (classification.intent === "customer_update") {
    return decideCustomerUpdate({ classification, toolContext });
  }

  return {
    reason: "No internal action is needed for this intent.",
    status: "not_applicable",
    tool: "none",
  };
}

function decideAppointmentCreation({
  classification,
  input,
  toolContext,
}: {
  classification: AiIntentClassification;
  input: BuildAiPromptInput;
  toolContext: AiToolExecutionContext;
}): AiActionDecision {
  if (toolContext.allowAppointmentCreation === false) {
    return blocked("create_appointment", "Appointment creation is disabled.");
  }

  if (!classification.clearCustomerConfirmation) {
    return blocked(
      "create_appointment",
      "A clear customer confirmation is required before creating an appointment.",
    );
  }

  if (!toolContext.customerId) {
    return blocked("create_appointment", "Missing customer id.");
  }

  const appointment = classification.entities.appointment;
  const scheduledStartAt = appointment?.scheduledStartAt;

  if (!scheduledStartAt) {
    return blocked("create_appointment", "Missing appointment date and time.");
  }

  if (!isFutureDate(scheduledStartAt)) {
    return blocked("create_appointment", "Appointment date must be in the future.");
  }

  const serviceId = resolveServiceId(appointment?.serviceName, input.services ?? []);
  const toolInput: AiCreateAppointmentToolInput = {
    conversationId: toolContext.conversationId ?? null,
    customerId: toolContext.customerId,
    notes: appointment?.notes ?? null,
    scheduledEndAt: appointment?.scheduledEndAt ?? null,
    scheduledStartAt,
    serviceId,
  };

  return {
    input: toolInput,
    reason: "Customer clearly confirmed an appointment with a valid future date.",
    status: "approved",
    tool: "create_appointment",
  };
}

function decidePaymentCreation({
  classification,
  toolContext,
}: {
  classification: AiIntentClassification;
  toolContext: AiToolExecutionContext;
}): AiActionDecision {
  if (toolContext.allowPaymentCreation === false) {
    return blocked("create_payment", "Payment creation is disabled.");
  }

  if (!classification.clearCustomerConfirmation) {
    return blocked(
      "create_payment",
      "A clear customer confirmation is required before creating a payment.",
    );
  }

  if (!toolContext.customerId) {
    return blocked("create_payment", "Missing customer id.");
  }

  const payment = classification.entities.payment;

  if (!payment?.amountCents || payment.amountCents <= 0) {
    return blocked("create_payment", "Missing payment amount.");
  }

  const toolInput: AiCreatePaymentToolInput = {
    amountCents: payment.amountCents,
    conversationId: toolContext.conversationId ?? null,
    customerId: toolContext.customerId,
    description: payment.description || "Cobranca solicitada pelo cliente",
    method: payment.method ?? "pix",
  };

  return {
    input: toolInput,
    reason: "Customer clearly confirmed a payment with a valid amount.",
    status: "approved",
    tool: "create_payment",
  };
}

function decideCustomerUpdate({
  classification,
  toolContext,
}: {
  classification: AiIntentClassification;
  toolContext: AiToolExecutionContext;
}): AiActionDecision {
  if (toolContext.allowCustomerUpdate === false) {
    return blocked("update_customer", "Customer update is disabled.");
  }

  if (!toolContext.customerId) {
    return blocked("update_customer", "Missing customer id.");
  }

  const update = classification.entities.customerUpdate;
  const hasAllowedUpdate = Boolean(update?.email || update?.name || update?.phone || update?.notes);

  if (!hasAllowedUpdate) {
    return blocked("update_customer", "No safe customer fields were detected.");
  }

  return {
    input: {
      customerId: toolContext.customerId,
      email: update?.email ?? null,
      name: update?.name ?? null,
      notes: update?.notes ?? null,
      phone: update?.phone ?? null,
    },
    reason: "Customer provided safe profile fields to update.",
    status: "approved",
    tool: "update_customer",
  };
}

function decideHumanHandoff(
  classification: AiIntentClassification,
  toolContext: AiToolExecutionContext,
): AiActionDecision {
  if (toolContext.allowHumanHandoff === false) {
    return blocked("request_human", "Human handoff is disabled.");
  }

  if (!toolContext.conversationId) {
    return blocked("request_human", "Missing conversation id.");
  }

  return {
    input: {
      conversationId: toolContext.conversationId,
      customerId: toolContext.customerId ?? null,
      reason: classification.reason || "Cliente solicitou atendimento humano.",
      requestedByMessageId: toolContext.requestedByMessageId ?? null,
    },
    reason: "Customer requested human assistance.",
    status: "approved",
    tool: "request_human",
  };
}

function blocked(tool: AiActionDecision["tool"], reason: string): AiActionDecision {
  return {
    reason,
    status: "blocked",
    tool,
  };
}

function resolveServiceId(
  serviceName: string | null | undefined,
  services: Array<{ id?: string | null; name: string }>,
) {
  if (!serviceName) {
    return null;
  }

  const normalizedServiceName = normalize(serviceName);
  const service = services.find((item) => normalize(item.name) === normalizedServiceName);

  return service?.id ?? null;
}

function isFutureDate(value: string) {
  const date = new Date(value);

  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
