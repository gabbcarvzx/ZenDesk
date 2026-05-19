import { createHmac, timingSafeEqual } from "crypto";
import type {
  CreatePaymentProviderChargeInput,
  CreatePaymentProviderChargeResult,
  PaymentProvider,
  PaymentProviderChargeStatus,
} from "@/lib/billing/payment-provider";

const MERCADOPAGO_API_BASE_URL = "https://api.mercadopago.com";

export type MercadoPagoPaymentStatus =
  | "accredited"
  | "approved"
  | "authorized"
  | "cancelled"
  | "charged_back"
  | "expired"
  | "in_mediation"
  | "in_process"
  | "pending"
  | "refunded"
  | "rejected";

export type MercadoPagoPaymentResponse = {
  date_approved?: string | null;
  date_created?: string | null;
  date_last_updated?: string | null;
  date_of_expiration?: string | null;
  external_reference?: string | null;
  id?: number | string;
  payment_method_id?: string | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string | null;
      qr_code_base64?: string | null;
      ticket_url?: string | null;
    };
  };
  status?: MercadoPagoPaymentStatus | string | null;
  status_detail?: string | null;
  transaction_amount?: number | null;
};

export type MercadoPagoWebhookPayload = {
  action?: string;
  api_version?: string;
  data?: {
    id?: string | number;
  };
  date_created?: string;
  id?: string | number;
  live_mode?: boolean;
  type?: string;
  user_id?: string | number;
};

export type MercadoPagoWebhookVerificationInput = {
  dataId: string | null;
  requestId: string | null;
  secret?: string;
  signatureHeader: string | null;
};

export class MercadoPagoConfigurationError extends Error {
  constructor(message = "Mercado Pago is not configured.") {
    super(message);
    this.name = "MercadoPagoConfigurationError";
  }
}

export class MercadoPagoRequestError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor({
    code,
    message,
    status,
  }: {
    code?: string;
    message: string;
    status: number;
  }) {
    super(message);
    this.code = code;
    this.name = "MercadoPagoRequestError";
    this.status = status;
  }
}

export class MercadoPagoPixPaymentProvider implements PaymentProvider {
  readonly name = "mercado_pago";

  async createCharge(
    input: CreatePaymentProviderChargeInput,
  ): Promise<CreatePaymentProviderChargeResult> {
    if (input.method !== "pix") {
      throw new MercadoPagoRequestError({
        message: "Mercado Pago initial integration only supports Pix.",
        status: 400,
      });
    }

    const accessToken = getMercadoPagoAccessToken();
    const metadata = normalizeMetadata(input.metadata);
    const idempotencyKey = getStringMetadata(metadata, "idempotencyKey");
    const payerEmail = getStringMetadata(metadata, "payerEmail");

    if (!idempotencyKey || !payerEmail) {
      throw new MercadoPagoRequestError({
        message: "Pix charge requires payer email and idempotency key.",
        status: 400,
      });
    }

    const payment = await mercadoPagoFetch<MercadoPagoPaymentResponse>({
      accessToken,
      body: {
        date_of_expiration: input.dueAt ?? undefined,
        description: input.description,
        external_reference: getStringMetadata(metadata, "externalReference") ?? undefined,
        notification_url: getWebhookUrl(),
        payer: {
          email: payerEmail,
          first_name: getStringMetadata(metadata, "payerName") ?? undefined,
        },
        payment_method_id: "pix",
        transaction_amount: centsToAmount(input.amountCents),
      },
      idempotencyKey,
      method: "POST",
      path: "/v1/payments",
    });
    const transactionData = payment.point_of_interaction?.transaction_data;

    return {
      checkoutUrl: transactionData?.ticket_url ?? null,
      expiresAt: payment.date_of_expiration ?? input.dueAt ?? null,
      metadata: {
        dateCreated: payment.date_created ?? null,
        paymentMethodId: payment.payment_method_id ?? null,
        providerStatus: payment.status ?? null,
        qrCodeBase64: transactionData?.qr_code_base64 ?? null,
        statusDetail: payment.status_detail ?? null,
        ticketUrl: transactionData?.ticket_url ?? null,
      },
      provider: this.name,
      providerPaymentId: payment.id ? String(payment.id) : null,
      qrCode: transactionData?.qr_code ?? null,
      status: mapMercadoPagoProviderStatus(payment.status),
    };
  }
}

export async function getMercadoPagoPayment(
  paymentId: string,
  accessToken = getMercadoPagoAccessToken(),
) {
  return mercadoPagoFetch<MercadoPagoPaymentResponse>({
    accessToken,
    method: "GET",
    path: `/v1/payments/${encodeURIComponent(paymentId)}`,
  });
}

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

export function isMercadoPagoWebhookSecretConfigured() {
  return Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET);
}

export function mapMercadoPagoProviderStatus(
  status: MercadoPagoPaymentResponse["status"],
): PaymentProviderChargeStatus {
  if (status === "approved" || status === "accredited") {
    return "paid";
  }

  if (status === "cancelled" || status === "charged_back" || status === "rejected") {
    return "canceled";
  }

  if (status === "expired") {
    return "expired";
  }

  return "pending";
}

export function mapMercadoPagoDatabaseStatus(status: MercadoPagoPaymentResponse["status"]) {
  if (status === "approved" || status === "accredited") {
    return "paid";
  }

  if (status === "expired") {
    return "overdue";
  }

  if (status === "cancelled" || status === "charged_back") {
    return "canceled";
  }

  if (status === "refunded") {
    return "refunded";
  }

  if (status === "rejected") {
    return "failed";
  }

  return "pending";
}

export function verifyMercadoPagoWebhookSignature({
  dataId,
  requestId,
  secret = process.env.MERCADOPAGO_WEBHOOK_SECRET,
  signatureHeader,
}: MercadoPagoWebhookVerificationInput) {
  if (!secret || !signatureHeader || !requestId) {
    return false;
  }

  const parsedSignature = parseMercadoPagoSignature(signatureHeader);

  if (!parsedSignature.ts || !parsedSignature.v1) {
    return false;
  }

  const manifest = buildMercadoPagoSignatureManifest({
    dataId,
    requestId,
    ts: parsedSignature.ts,
  });
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  return safeEqual(expected, parsedSignature.v1);
}

export function buildMercadoPagoSignatureManifest({
  dataId,
  requestId,
  ts,
}: {
  dataId: string | null;
  requestId: string;
  ts: string;
}) {
  const normalizedDataId = dataId?.trim().toLowerCase();
  const parts = [];

  if (normalizedDataId) {
    parts.push(`id:${normalizedDataId};`);
  }

  parts.push(`request-id:${requestId};`);
  parts.push(`ts:${ts};`);

  return parts.join("");
}

function parseMercadoPagoSignature(signatureHeader: string) {
  return signatureHeader.split(",").reduce<Record<string, string>>((accumulator, part) => {
    const [key, value] = part.split("=");

    if (key && value) {
      accumulator[key.trim()] = value.trim();
    }

    return accumulator;
  }, {});
}

async function mercadoPagoFetch<T>({
  accessToken,
  body,
  idempotencyKey,
  method,
  path,
}: {
  accessToken: string;
  body?: Record<string, unknown>;
  idempotencyKey?: string;
  method: "GET" | "POST";
  path: string;
}): Promise<T> {
  const response = await fetch(`${MERCADOPAGO_API_BASE_URL}${path}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
    },
    method,
  });
  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    const error = normalizeMercadoPagoError(responseBody);

    throw new MercadoPagoRequestError({
      code: error.code,
      message: error.message,
      status: response.status,
    });
  }

  return responseBody as T;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeMercadoPagoError(responseBody: unknown) {
  if (isRecord(responseBody)) {
    return {
      code: typeof responseBody.error === "string" ? responseBody.error : undefined,
      message:
        typeof responseBody.message === "string"
          ? responseBody.message
          : "Mercado Pago request failed.",
    };
  }

  return {
    code: undefined,
    message: "Mercado Pago request failed.",
  };
}

function getMercadoPagoAccessToken() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new MercadoPagoConfigurationError();
  }

  return accessToken;
}

function getWebhookUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!appUrl) {
    return undefined;
  }

  return `${appUrl.replace(/\/$/, "")}/api/webhooks/mercadopago`;
}

function centsToAmount(amountCents: number) {
  return Number((amountCents / 100).toFixed(2));
}

function normalizeMetadata(metadata: Record<string, unknown> | undefined) {
  return metadata ?? {};
}

function getStringMetadata(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function safeEqual(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return timingSafeEqual(firstBuffer, secondBuffer);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
