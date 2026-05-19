import { createHmac, timingSafeEqual } from "crypto";
import type { WhatsAppWebhookVerificationParams } from "@/lib/whatsapp/types";

export type VerifyWhatsAppWebhookResult =
  | {
      challenge: string;
      ok: true;
    }
  | {
      ok: false;
      reason: "invalid_mode" | "invalid_token" | "missing_challenge" | "missing_token";
    };

export function verifyWhatsAppWebhook(
  params: WhatsAppWebhookVerificationParams,
  expectedVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN,
): VerifyWhatsAppWebhookResult {
  if (!expectedVerifyToken) {
    return { ok: false, reason: "missing_token" };
  }

  if (params.mode !== "subscribe") {
    return { ok: false, reason: "invalid_mode" };
  }

  if (!params.challenge) {
    return { ok: false, reason: "missing_challenge" };
  }

  if (!safeEqual(params.verifyToken ?? "", expectedVerifyToken)) {
    return { ok: false, reason: "invalid_token" };
  }

  return {
    challenge: params.challenge,
    ok: true,
  };
}

export function verifyWhatsAppRequestSignature({
  appSecret = process.env.WHATSAPP_APP_SECRET,
  rawBody,
  signatureHeader,
}: {
  appSecret?: string;
  rawBody: string;
  signatureHeader: string | null;
}) {
  if (!appSecret || !signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = `sha256=${createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex")}`;

  return safeEqual(signatureHeader, expectedSignature);
}

function safeEqual(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return timingSafeEqual(firstBuffer, secondBuffer);
}
