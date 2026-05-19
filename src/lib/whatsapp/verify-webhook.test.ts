import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import {
  verifyWhatsAppRequestSignature,
  verifyWhatsAppWebhook,
} from "./verify-webhook";

describe("verifyWhatsAppWebhook", () => {
  it("accepts the Meta challenge when token and mode match", () => {
    const result = verifyWhatsAppWebhook(
      {
        challenge: "challenge-value",
        mode: "subscribe",
        verifyToken: "secret-token",
      },
      "secret-token",
    );

    expect(result).toEqual({
      challenge: "challenge-value",
      ok: true,
    });
  });

  it("rejects an invalid verification token", () => {
    const result = verifyWhatsAppWebhook(
      {
        challenge: "challenge-value",
        mode: "subscribe",
        verifyToken: "wrong-token",
      },
      "secret-token",
    );

    expect(result).toEqual({
      ok: false,
      reason: "invalid_token",
    });
  });
});

describe("verifyWhatsAppRequestSignature", () => {
  it("validates the x-hub-signature-256 header", () => {
    const rawBody = JSON.stringify({ object: "whatsapp_business_account" });
    const appSecret = "app-secret";
    const signature = `sha256=${createHmac("sha256", appSecret)
      .update(rawBody, "utf8")
      .digest("hex")}`;

    expect(
      verifyWhatsAppRequestSignature({
        appSecret,
        rawBody,
        signatureHeader: signature,
      }),
    ).toBe(true);
  });

  it("rejects a missing signature", () => {
    expect(
      verifyWhatsAppRequestSignature({
        appSecret: "app-secret",
        rawBody: "{}",
        signatureHeader: null,
      }),
    ).toBe(false);
  });
});
