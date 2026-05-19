import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  isMercadoPagoConfigured,
  mapMercadoPagoDatabaseStatus,
  MercadoPagoConfigurationError,
  MercadoPagoPixPaymentProvider,
  MercadoPagoRequestError,
} from "@/lib/billing/mercadopago";
import {
  BillingPolicyError,
  assertCanUseFeature,
  getBillingPolicyMessage,
} from "@/lib/billing/policy";
import {
  buildRateLimitKey,
  enforceRateLimit,
  getRateLimitHeaders,
} from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  OrganizationAccessDeniedError,
  OrganizationRequiredError,
  requireOrganizationRole,
} from "@/lib/tenant.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_CREATE_PIX_BODY_LENGTH = 64_000;
const CREATE_PIX_RATE_LIMIT = 30;
const CREATE_PIX_RATE_LIMIT_WINDOW_MS = 60_000;

const createPixPaymentSchema = z.object({
  amountCents: z.number().int().positive().max(10_000_000),
  conversationId: z.string().uuid().nullable().optional(),
  customerId: z.string().uuid(),
  description: z.string().trim().min(2).max(500),
  dueAt: z
    .string()
    .trim()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "Invalid dueAt.",
    })
    .transform((value) => (value ? new Date(value).toISOString() : null))
    .nullable()
    .optional(),
  idempotencyKey: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9._:-]+$/)
    .optional(),
  payerEmail: z.string().trim().email().optional(),
});

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type CustomerRow = {
  email: string | null;
  id: string;
  name: string;
};

type ConversationRow = {
  customer_id: string | null;
  id: string;
};

type PaymentRow = {
  amount_cents: number;
  conversation_id: string | null;
  currency: string;
  customer_id: string;
  description: string | null;
  due_at: string | null;
  id: string;
  metadata: unknown;
  paid_at: string | null;
  provider: string;
  provider_payment_id: string | null;
  status: string;
};

export async function POST(request: NextRequest) {
  const rateLimit = await enforceRateLimit({
    key: buildRateLimitKey("mercadopago-create:post", request),
    limit: CREATE_PIX_RATE_LIMIT,
    windowMs: CREATE_PIX_RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    logWarn("create_pix_rate_limited");

    return NextResponse.json(
      { error: "Too many requests." },
      {
        headers: getRateLimitHeaders(rateLimit),
        status: 429,
      },
    );
  }

  if (isContentLengthTooLarge(request)) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  let body: unknown;

  try {
    const rawBody = await request.text();

    if (rawBody.length > MAX_CREATE_PIX_BODY_LENGTH) {
      return NextResponse.json({ error: "Payload too large." }, { status: 413 });
    }

    body = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = createPixPaymentSchema.safeParse({
    ...(isRecord(body) ? body : {}),
    idempotencyKey:
      request.headers.get("idempotency-key") ??
      request.headers.get("x-idempotency-key") ??
      (isRecord(body) ? body.idempotencyKey : undefined),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid Pix payment payload.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const profile = await requireOrganizationRole(["owner", "admin"]);
    const supabase = await createSupabaseServerClient();
    const values = parsed.data;

    await assertCanUseFeature({
      feature: "pixPayments",
      organizationId: profile.organizationId,
      planSlug: profile.organization.planSlug,
      supabase,
    });

    if (!isMercadoPagoConfigured()) {
      logWarn("create_pix_missing_access_token", {
        organizationId: profile.organizationId,
      });

      return NextResponse.json(
        { error: "Mercado Pago is not configured." },
        { status: 503 },
      );
    }

    const idempotencyKey = values.idempotencyKey ?? randomUUID();
    const existingPayment = await findPaymentByIdempotencyKey({
      idempotencyKey,
      organizationId: profile.organizationId,
      supabase,
    });

    if (existingPayment) {
      logInfo("create_pix_idempotent_replay", {
        organizationId: profile.organizationId,
        paymentId: existingPayment.id,
      });

      return NextResponse.json({
        idempotencyKey,
        payment: toPixPaymentResponse(existingPayment),
      });
    }

    const customer = await getCustomer({
      customerId: values.customerId,
      organizationId: profile.organizationId,
      supabase,
    });
    const payerEmail = values.payerEmail ?? customer.email;

    if (!payerEmail) {
      return NextResponse.json(
        { error: "payerEmail is required when the customer has no email." },
        { status: 400 },
      );
    }

    if (values.conversationId) {
      await assertConversationBelongsToCustomer({
        conversationId: values.conversationId,
        customerId: customer.id,
        organizationId: profile.organizationId,
        supabase,
      });
    }

    const localPayment = await insertLocalPendingPayment({
      createdByProfileId: profile.id,
      idempotencyKey,
      organizationId: profile.organizationId,
      payerEmail,
      payerName: customer.name,
      supabase,
      values: {
        amountCents: values.amountCents,
        conversationId: values.conversationId ?? null,
        customerId: customer.id,
        description: values.description,
        dueAt: values.dueAt ?? null,
      },
    });
    const provider = new MercadoPagoPixPaymentProvider();

    try {
      const providerResult = await provider.createCharge({
        amountCents: values.amountCents,
        conversationId: values.conversationId ?? null,
        currency: "BRL",
        customerId: customer.id,
        description: values.description,
        dueAt: values.dueAt ?? null,
        metadata: {
          externalReference: localPayment.id,
          idempotencyKey,
          payerEmail,
          payerName: customer.name,
        },
        method: "pix",
        organizationId: profile.organizationId,
      });
      const updatedPayment = await updateLocalPaymentAfterProviderCreate({
        localPayment,
        organizationId: profile.organizationId,
        providerResult,
        supabase,
      });

      logInfo("create_pix_success", {
        organizationId: profile.organizationId,
        paymentId: updatedPayment.id,
      });

      return NextResponse.json(
        {
          idempotencyKey,
          payment: toPixPaymentResponse(updatedPayment),
        },
        { status: 201 },
      );
    } catch (error) {
      await markLocalPaymentAsFailed({
        error,
        localPayment,
        organizationId: profile.organizationId,
        supabase,
      });
      logProviderError(error, {
        event: "create_pix_provider_failed",
        organizationId: profile.organizationId,
        paymentId: localPayment.id,
      });

      return NextResponse.json(
        { error: "Could not create Pix charge with Mercado Pago." },
        { status: getProviderErrorStatus(error) },
      );
    }
  } catch (error) {
    if (error instanceof OrganizationRequiredError) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (error instanceof OrganizationAccessDeniedError) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    if (error instanceof BillingPolicyError) {
      return NextResponse.json(
        {
          error: getBillingPolicyMessage(error),
        },
        { status: 402 },
      );
    }

    logError("create_pix_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json({ error: "Could not create Pix charge." }, { status: 500 });
  }
}

async function getCustomer({
  customerId,
  organizationId,
  supabase,
}: {
  customerId: string;
  organizationId: string;
  supabase: SupabaseServerClient;
}) {
  const { data, error } = await supabase
    .from("customers")
    .select("id,name,email")
    .eq("organization_id", organizationId)
    .eq("id", customerId)
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Customer not found.");
  }

  return data as CustomerRow;
}

async function assertConversationBelongsToCustomer({
  conversationId,
  customerId,
  organizationId,
  supabase,
}: {
  conversationId: string;
  customerId: string;
  organizationId: string;
  supabase: SupabaseServerClient;
}) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id,customer_id")
    .eq("organization_id", organizationId)
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Conversation not found.");
  }

  const conversation = data as ConversationRow;

  if (conversation.customer_id && conversation.customer_id !== customerId) {
    throw new Error("Conversation belongs to another customer.");
  }
}

async function findPaymentByIdempotencyKey({
  idempotencyKey,
  organizationId,
  supabase,
}: {
  idempotencyKey: string;
  organizationId: string;
  supabase: SupabaseServerClient;
}) {
  const { data, error } = await supabase
    .from("payments")
    .select(
      "id,customer_id,conversation_id,amount_cents,currency,status,provider,provider_payment_id,description,due_at,paid_at,metadata",
    )
    .eq("organization_id", organizationId)
    .eq("provider", "mercado_pago")
    .filter("metadata->>idempotencyKey", "eq", idempotencyKey)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as PaymentRow | null) ?? null;
}

async function insertLocalPendingPayment({
  createdByProfileId,
  idempotencyKey,
  organizationId,
  payerEmail,
  payerName,
  supabase,
  values,
}: {
  createdByProfileId: string;
  idempotencyKey: string;
  organizationId: string;
  payerEmail: string;
  payerName: string;
  supabase: SupabaseServerClient;
  values: {
    amountCents: number;
    conversationId: string | null;
    customerId: string;
    description: string;
    dueAt: string | null;
  };
}) {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      amount_cents: values.amountCents,
      conversation_id: values.conversationId,
      currency: "BRL",
      customer_id: values.customerId,
      description: values.description,
      due_at: values.dueAt,
      metadata: {
        createdByProfileId,
        idempotencyKey,
        method: "pix",
        payerEmail,
        payerName,
        source: "mercado_pago_pix",
      },
      organization_id: organizationId,
      paid_at: null,
      provider: "mercado_pago",
      provider_payment_id: null,
      status: "pending",
    })
    .select(
      "id,customer_id,conversation_id,amount_cents,currency,status,provider,provider_payment_id,description,due_at,paid_at,metadata",
    )
    .single();

  if (error) {
    const replay = await findPaymentByIdempotencyKey({
      idempotencyKey,
      organizationId,
      supabase,
    });

    if (replay) {
      return replay;
    }

    throw error;
  }

  return data as PaymentRow;
}

async function updateLocalPaymentAfterProviderCreate({
  localPayment,
  organizationId,
  providerResult,
  supabase,
}: {
  localPayment: PaymentRow;
  organizationId: string;
  providerResult: Awaited<ReturnType<MercadoPagoPixPaymentProvider["createCharge"]>>;
  supabase: SupabaseServerClient;
}) {
  const metadata = normalizeMetadata(localPayment.metadata);
  const providerStatus = getStringMetadata(providerResult.metadata, "providerStatus");
  const { data, error } = await supabase
    .from("payments")
    .update({
      due_at: providerResult.expiresAt ?? localPayment.due_at,
      metadata: {
        ...metadata,
        mercadoPago: {
          checkoutUrl: providerResult.checkoutUrl ?? null,
          expiresAt: providerResult.expiresAt ?? null,
          providerPaymentId: providerResult.providerPaymentId ?? null,
          qrCode: providerResult.qrCode ?? null,
          qrCodeBase64: providerResult.metadata?.qrCodeBase64 ?? null,
          status: providerStatus,
          statusDetail: providerResult.metadata?.statusDetail ?? null,
        },
      },
      provider_payment_id: providerResult.providerPaymentId,
      status: mapMercadoPagoDatabaseStatus(providerStatus),
    })
    .eq("organization_id", organizationId)
    .eq("id", localPayment.id)
    .select(
      "id,customer_id,conversation_id,amount_cents,currency,status,provider,provider_payment_id,description,due_at,paid_at,metadata",
    )
    .single();

  if (error) {
    throw error;
  }

  return data as PaymentRow;
}

async function markLocalPaymentAsFailed({
  error,
  localPayment,
  organizationId,
  supabase,
}: {
  error: unknown;
  localPayment: PaymentRow;
  organizationId: string;
  supabase: SupabaseServerClient;
}) {
  const metadata = normalizeMetadata(localPayment.metadata);
  await supabase
    .from("payments")
    .update({
      metadata: {
        ...metadata,
        mercadoPago: {
          errorName: error instanceof Error ? error.name : "UnknownError",
          status: "create_failed",
        },
      },
      status: "failed",
    })
    .eq("organization_id", organizationId)
    .eq("id", localPayment.id);
}

function toPixPaymentResponse(payment: PaymentRow) {
  const metadata = normalizeMetadata(payment.metadata);
  const mercadoPago = normalizeMetadata(metadata.mercadoPago);

  return {
    amountCents: payment.amount_cents,
    checkoutUrl: getStringMetadata(mercadoPago, "checkoutUrl"),
    currency: payment.currency,
    description: payment.description,
    dueAt: payment.due_at,
    id: payment.id,
    paidAt: payment.paid_at,
    provider: payment.provider,
    providerPaymentId: payment.provider_payment_id,
    qrCode: getStringMetadata(mercadoPago, "qrCode"),
    qrCodeBase64: getStringMetadata(mercadoPago, "qrCodeBase64"),
    status: payment.status,
  };
}

function getProviderErrorStatus(error: unknown) {
  if (error instanceof MercadoPagoConfigurationError) {
    return 503;
  }

  if (error instanceof MercadoPagoRequestError) {
    return error.status >= 400 && error.status < 500 ? 400 : 502;
  }

  return 502;
}

function logProviderError(
  error: unknown,
  context: { event: string; organizationId: string; paymentId: string },
) {
  if (error instanceof MercadoPagoRequestError) {
    logError(context.event, {
      code: error.code,
      organizationId: context.organizationId,
      paymentId: context.paymentId,
      status: error.status,
    });

    return;
  }

  logError(context.event, {
    errorName: error instanceof Error ? error.name : "UnknownError",
    organizationId: context.organizationId,
    paymentId: context.paymentId,
  });
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function getStringMetadata(metadata: unknown, key: string) {
  const record = normalizeMetadata(metadata);
  const value = record[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isContentLengthTooLarge(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length"));

  return Number.isFinite(contentLength) && contentLength > MAX_CREATE_PIX_BODY_LENGTH;
}

function logInfo(event: string, data: Record<string, unknown> = {}) {
  console.info("[mercadopago-create]", event, data);
}

function logWarn(event: string, data: Record<string, unknown> = {}) {
  console.warn("[mercadopago-create]", event, data);
}

function logError(event: string, data: Record<string, unknown> = {}) {
  console.error("[mercadopago-create]", event, data);
}
