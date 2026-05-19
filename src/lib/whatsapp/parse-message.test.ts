import { describe, expect, it } from "vitest";
import { parseWhatsAppMessages } from "./parse-message";
import type { WhatsAppWebhookPayload } from "./types";

describe("parseWhatsAppMessages", () => {
  it("extracts inbound text messages", () => {
    const payload: WhatsAppWebhookPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                contacts: [
                  {
                    profile: {
                      name: "Maria",
                    },
                    wa_id: "5511999999999",
                  },
                ],
                messages: [
                  {
                    from: "5511999999999",
                    id: "wamid.test",
                    text: {
                      body: "Oi, quero agendar",
                    },
                    timestamp: "1779130000",
                    type: "text",
                  },
                ],
                metadata: {
                  display_phone_number: "+55 11 3333-3333",
                  phone_number_id: "123456789",
                },
                messaging_product: "whatsapp",
              },
            },
          ],
          id: "waba-id",
        },
      ],
      object: "whatsapp_business_account",
    };

    expect(parseWhatsAppMessages(payload)).toEqual([
      {
        body: "Oi, quero agendar",
        customerName: "Maria",
        displayPhoneNumber: "+55 11 3333-3333",
        from: "5511999999999",
        isSupportedText: true,
        messageId: "wamid.test",
        phoneNumberId: "123456789",
        receivedAt: new Date(1779130000 * 1000).toISOString(),
        type: "text",
      },
    ]);
  });

  it("ignores status-only webhooks", () => {
    const payload: WhatsAppWebhookPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: {
                  phone_number_id: "123456789",
                },
                statuses: [
                  {
                    id: "wamid.sent",
                    status: "delivered",
                  },
                ],
              },
            },
          ],
        },
      ],
      object: "whatsapp_business_account",
    };

    expect(parseWhatsAppMessages(payload)).toEqual([]);
  });
});
