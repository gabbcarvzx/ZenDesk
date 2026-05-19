import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import {
  buildMercadoPagoSignatureManifest,
  mapMercadoPagoDatabaseStatus,
  verifyMercadoPagoWebhookSignature,
} from "./mercadopago";

describe("mapMercadoPagoDatabaseStatus", () => {
  it("maps Mercado Pago payment statuses to local database statuses", () => {
    expect(mapMercadoPagoDatabaseStatus("approved")).toBe("paid");
    expect(mapMercadoPagoDatabaseStatus("expired")).toBe("overdue");
    expect(mapMercadoPagoDatabaseStatus("cancelled")).toBe("canceled");
    expect(mapMercadoPagoDatabaseStatus("rejected")).toBe("failed");
    expect(mapMercadoPagoDatabaseStatus("pending")).toBe("pending");
  });
});

describe("verifyMercadoPagoWebhookSignature", () => {
  it("validates Mercado Pago webhook signatures", () => {
    const secret = "webhook-secret";
    const manifest = buildMercadoPagoSignatureManifest({
      dataId: "123456789",
      requestId: "request-id",
      ts: "1742505638683",
    });
    const signature = createHmac("sha256", secret).update(manifest).digest("hex");

    expect(
      verifyMercadoPagoWebhookSignature({
        dataId: "123456789",
        requestId: "request-id",
        secret,
        signatureHeader: `ts=1742505638683,v1=${signature}`,
      }),
    ).toBe(true);
  });

  it("rejects invalid signatures", () => {
    expect(
      verifyMercadoPagoWebhookSignature({
        dataId: "123456789",
        requestId: "request-id",
        secret: "webhook-secret",
        signatureHeader: "ts=1742505638683,v1=invalid",
      }),
    ).toBe(false);
  });
});
