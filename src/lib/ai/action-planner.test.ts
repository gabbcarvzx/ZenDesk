import { describe, expect, it } from "vitest";
import { decideAiAction } from "./action-planner";
import type { AiIntentClassification, BuildAiPromptInput } from "./types";

const tenantId = "tenant-a";
const baseInput: BuildAiPromptInput = {
  business: {
    name: "Clinica Aurora",
    tenantId,
  },
  currentCustomerMessage: "Pode agendar",
  services: [
    {
      id: "service-a",
      name: "Limpeza de pele",
      tenantId,
    },
  ],
  tenantId,
};

function classification(
  overrides: Partial<AiIntentClassification>,
): AiIntentClassification {
  return {
    clearCustomerConfirmation: false,
    confidence: 0.8,
    entities: {},
    intent: "unknown",
    ...overrides,
  };
}

describe("decideAiAction", () => {
  it("blocks appointment creation without clear customer confirmation", () => {
    const decision = decideAiAction({
      classification: classification({
        entities: {
          appointment: {
            scheduledStartAt: new Date(Date.now() + 86_400_000).toISOString(),
            serviceName: "Limpeza de pele",
          },
        },
        intent: "appointment_request",
      }),
      input: baseInput,
      toolContext: {
        conversationId: "conversation-a",
        customerId: "customer-a",
        organizationId: tenantId,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.tool).toBe("create_appointment");
  });

  it("approves appointment creation with confirmation and future date", () => {
    const decision = decideAiAction({
      classification: classification({
        clearCustomerConfirmation: true,
        entities: {
          appointment: {
            scheduledStartAt: new Date(Date.now() + 86_400_000).toISOString(),
            serviceName: "Limpeza de pele",
          },
        },
        intent: "appointment_request",
      }),
      input: baseInput,
      toolContext: {
        conversationId: "conversation-a",
        customerId: "customer-a",
        organizationId: tenantId,
      },
    });

    expect(decision.status).toBe("approved");
    expect(decision.tool).toBe("create_appointment");
    expect(decision.input).toMatchObject({
      customerId: "customer-a",
      serviceId: "service-a",
    });
  });

  it("blocks payment creation without clear customer confirmation", () => {
    const decision = decideAiAction({
      classification: classification({
        entities: {
          payment: {
            amountCents: 12000,
            description: "Servico",
            method: "pix",
          },
        },
        intent: "payment_request",
      }),
      input: baseInput,
      toolContext: {
        customerId: "customer-a",
        organizationId: tenantId,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.tool).toBe("create_payment");
  });

  it("approves safe customer updates", () => {
    const decision = decideAiAction({
      classification: classification({
        entities: {
          customerUpdate: {
            email: "cliente@example.com",
          },
        },
        intent: "customer_update",
      }),
      input: baseInput,
      toolContext: {
        customerId: "customer-a",
        organizationId: tenantId,
      },
    });

    expect(decision.status).toBe("approved");
    expect(decision.tool).toBe("update_customer");
  });
});
