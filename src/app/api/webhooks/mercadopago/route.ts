import { NextRequest, NextResponse } from "next/server";
import {
  getMercadoPagoPayment,
  isMercadoPagoConfigured,
  isMercadoPagoWebhookSecretConfigured,
  mapMercadoPagoDatabaseStatus,
  type MercadoPagoPaymentResponse,
  type MercadoPagoWebhookPayload,
  verifyMercadoPagoWebhookSignature,
} from "@/lib/billing/mercadopago";
import {
  buildRateLimitKey,
  enforceRateLimit,
  getRateLimitHeaders,
} from "@/lib/rate-limit";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_WEBHOOK_BODY_LENGTH = 256_000;
const WEBHOOK_POST_RATE_LIMIT = 120;
const WEBHOOK_RATE_LIMIT_WINDOW_MS = 60_000;

type SupabaseServiceRoleClient = ReturnType<typeof createSupabaseServiceRoleClient>;

type PaymentRow = {
  id: string;
  metadata: unknown;
  organization_id: string;
  provider_payment_id: string | null;
};

export async function POST(request: NextRequest) {
  const rateLimit = await enforceRateLimit({
    key: buildRateLimitKey("mercadopago-webhook:post", request),
    limit: WEBHOOK_POST_RATE_LIMIT,
    windowMs: WEBHOOK_RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    logWarn("webhook_rate_limited");

    return NextResponse.json(
      { error: "Too many requests." },
      {
        headers: getRateLimitHeaders(rateLimit),
        status: 429,
      },
    );
  }

  if (isContentLengthTooLarge(request)) {
    logWarn("webhook_payload_too_large", {
      source: "content_length",
    });

    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const rawBody = await request.text();

  if (rawBody.length > MAX_WEBHOOK_BODY_LENGTH) {
    logWarn("webhook_payload_too_large", {
      bytes: rawBody.length,
    });

    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const payload = parseJson(rawBody);

  if (!payload) {
    logWarn("webhook_invalid_json");

    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const dataId = getWebhookDataId(request, payload);

  if (
    !isMercadoPagoWebhookSecretConfigured() ||
    !verifyMercadoPagoWebhookSignature({
      dataId,
      requestId: request.headers.get("x-request-id"),
      signatureHeader: request.headers.get("x-signature"),
    })
  ) {
    logWarn("webhook_signature_invalid", {
      hasRequestId: Boolean(request.headers.get("x-request-id")),
      hasSignature: Boolean(request.headers.get("x-signature")),
      hasWebhookSecret: isMercadoPagoWebhookSecretConfigured(),
    });

    return NextResponse.json(
      { error: "Invalid Mercado Pago webhook signature." },
      { status: isMercadoPagoWebhookSecretConfigured() ? 401 : 503 },
    );
  }

  if (!isMercadoPagoConfigured() || !isSupabaseServiceRoleConfigured()) {
    logWarn("webhook_integration_not_configured", {
      hasMercadoPagoToken: isMercadoPagoConfigured(),
      hasSupabaseServiceRole: isSupabaseServiceRoleConfigured(),
    });

    return NextResponse.json({ error: "Webhook integration is not configured." }, { status: 503 });
  }

  if (!dataId || !isPaymentNotification(payload, request)) {
    logInfo("webhook_ignored", {
      type: payload.type ?? request.nextUrl.searchParams.get("type"),
    });

    return NextResponse.json({ ignored: true, ok: true });
  }

  try {
    const mercadoPagoPayment = await getMercadoPagoPayment(dataId);
    const providerPaymentId = mercadoPagoPayment.id
      ? String(mercadoPagoPayment.id)
      : dataId;
    const supabase = createSupabaseServiceRoleClient();
    const localPayment = await findLocalPayment({
      mercadoPagoPayment,
      providerPaymentId,
      supabase,
    });

    if (!localPayment) {
      logWarn("webhook_payment_not_found", {
        providerPaymentId,
      });

      return NextResponse.json({ ok: true, unresolved: true });
    }

    await updateLocalPaymentFromWebhook({
      mercadoPagoPayment,
      payload,
      requestId: request.headers.get("x-request-id"),
      supabase,
      payment: localPayment,
      providerPaymentId,
    });

    logInfo("webhook_payment_updated", {
      organizationId: localPayment.organization_id,
      paymentId: localPayment.id,
      providerPaymentId,
      status: mercadoPagoPayment.status,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logError("webhook_processing_failed", {
      dataId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json({ error: "Could not process webhook." }, { status: 500 });
  }
}

async function findLocalPayment({
  mercadoPagoPayment,
  providerPaymentId,
  supabase,
}: {
  mercadoPagoPayment: MercadoPagoPaymentResponse;
  providerPaymentId: string;
  supabase: SupabaseServiceRoleClient;
}) {
  const { data, error } = await supabase
    .from("payments")
    .select("id,organization_id,provider_payment_id,metadata")
    .eq("provider", "mercado_pago")
    .eq("provider_payment_id", providerPaymentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data as PaymentRow;
  }

  const externalReference = mercadoPagoPayment.external_reference;

  if (!externalReference) {
    return null;
  }

  const { data: referenceData, error: referenceError } = await supabase
    .from("payments")
    .select("id,organization_id,provider_payment_id,metadata")
    .eq("provider", "mercado_pago")
    .eq("id", externalReference)
    .maybeSingle();

  if (referenceError) {
    throw referenceError;
  }

  return (referenceData as PaymentRow | null) ?? null;
}

async function updateLocalPaymentFromWebhook({
  mercadoPagoPayment,
  payload,
  payment,
  providerPaymentId,
  requestId,
  supabase,
}: {
  mercadoPagoPayment: MercadoPagoPaymentResponse;
  payload: MercadoPagoWebhookPayload;
  payment: PaymentRow;
  providerPaymentId: string;
  requestId: string | null;
  supabase: SupabaseServiceRoleClient;
}) {
  const metadata = normalizeMetadata(payment.metadata);
  const { error } = await supabase
    .from("payments")
    .update({
      due_at: mercadoPagoPayment.date_of_expiration ?? undefined,
      metadata: {
        ...metadata,
        mercadoPago: {
          ...normalizeMetadata(metadata.mercadoPago),
          latestWebhook: {
            action: payload.action ?? null,
            processedAt: new Date().toISOString(),
            requestId,
            status: mercadoPagoPayment.status ?? null,
            statusDetail: mercadoPagoPayment.status_detail ?? null,
            type: payload.type ?? null,
          },
          providerPaymentId,
        },
      },
      paid_at:
        mercadoPagoPayment.status === "approved" || mercadoPagoPayment.status === "accredited"
          ? mercadoPagoPayment.date_approved ?? new Date().toISOString()
          : null,
      provider_payment_id: providerPaymentId,
      status: mapMercadoPagoDatabaseStatus(mercadoPagoPayment.status),
    })
    .eq("organization_id", payment.organization_id)
    .eq("id", payment.id);

  if (error) {
    throw error;
  }
}

function parseJson(rawBody: string): MercadoPagoWebhookPayload | null {
  try {
    return JSON.parse(rawBody) as MercadoPagoWebhookPayload;
  } catch {
    return null;
  }
}

function isContentLengthTooLarge(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length"));

  return Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BODY_LENGTH;
}

function getWebhookDataId(request: NextRequest, payload: MercadoPagoWebhookPayload) {
  const queryValue =
    request.nextUrl.searchParams.get("data.id") ??
    request.nextUrl.searchParams.get("id");

  return queryValue ?? (payload.data?.id ? String(payload.data.id) : null);
}

function isPaymentNotification(payload: MercadoPagoWebhookPayload, request: NextRequest) {
  const type = payload.type ?? request.nextUrl.searchParams.get("type");
  const topic = request.nextUrl.searchParams.get("topic");

  return type === "payment" || topic === "payment";
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function logInfo(event: string, data: Record<string, unknown> = {}) {
  console.info("[mercadopago-webhook]", event, data);
}

function logWarn(event: string, data: Record<string, unknown> = {}) {
  console.warn("[mercadopago-webhook]", event, data);
}

function logError(event: string, data: Record<string, unknown> = {}) {
  console.error("[mercadopago-webhook]", event, data);
}
