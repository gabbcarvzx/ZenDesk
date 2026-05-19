import { describe, expect, it } from "vitest";
import {
  classifyIntentHeuristically,
  hasClearCustomerConfirmation,
} from "./intent-classifier";
import type { BuildAiPromptInput } from "./types";

const tenantId = "tenant-a";

function createInput(overrides: Partial<BuildAiPromptInput> = {}): BuildAiPromptInput {
  return {
    business: {
      name: "Clinica Aurora",
      tenantId,
    },
    currentCustomerMessage: "Quero pagar por pix R$ 120,00",
    tenantId,
    ...overrides,
  };
}

describe("classifyIntentHeuristically", () => {
  it("detects payment requests and amount", () => {
    const result = classifyIntentHeuristically(
      createInput({
        currentCustomerMessage: "Pode gerar o pix de R$ 120,00",
      }),
    );

    expect(result.intent).toBe("payment_request");
    expect(result.entities.payment?.amountCents).toBe(12000);
    expect(result.clearCustomerConfirmation).toBe(true);
  });

  it("detects customer updates from contact data", () => {
    const result = classifyIntentHeuristically(
      createInput({
        currentCustomerMessage: "Meu email correto e maria@example.com",
      }),
    );

    expect(result.intent).toBe("customer_update");
    expect(result.entities.customerUpdate?.email).toBe("maria@example.com");
  });
});

describe("hasClearCustomerConfirmation", () => {
  it("accepts short confirmation only when recent assistant asked for confirmation", () => {
    expect(
      hasClearCustomerConfirmation(
        createInput({
          conversationHistory: [
            {
              content: "Posso gerar a cobranca Pix de R$ 120,00?",
              role: "ai",
              tenantId,
            },
          ],
          currentCustomerMessage: "sim",
        }),
      ),
    ).toBe(true);
  });

  it("does not treat isolated yes as clear confirmation", () => {
    expect(
      hasClearCustomerConfirmation(
        createInput({
          currentCustomerMessage: "sim",
        }),
      ),
    ).toBe(false);
  });
});
