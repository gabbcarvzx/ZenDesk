import type {
  WhatsAppSendTextMessageInput,
  WhatsAppSendTextMessageResult,
} from "@/lib/whatsapp/types";

const DEFAULT_GRAPH_API_VERSION = "v25.0";
const MAX_TEXT_LENGTH = 4000;

type WhatsAppMessagesResponse = {
  contacts?: Array<{
    input?: string;
    wa_id?: string;
  }>;
  messages?: Array<{
    id?: string;
  }>;
};

type WhatsAppErrorResponse = {
  error?: {
    code?: number;
    message?: string;
    type?: string;
  };
};

export class WhatsAppSendMessageError extends Error {
  readonly code?: number;
  readonly status: number;
  readonly type?: string;

  constructor({
    code,
    message,
    status,
    type,
  }: {
    code?: number;
    message: string;
    status: number;
    type?: string;
  }) {
    super(message);
    this.code = code;
    this.name = "WhatsAppSendMessageError";
    this.status = status;
    this.type = type;
  }
}

export async function sendWhatsAppTextMessage(
  input: WhatsAppSendTextMessageInput,
): Promise<WhatsAppSendTextMessageResult> {
  const accessToken = input.accessToken ?? process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = input.phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion =
    input.apiVersion ?? process.env.WHATSAPP_GRAPH_API_VERSION ?? DEFAULT_GRAPH_API_VERSION;

  if (!accessToken || !phoneNumberId) {
    throw new WhatsAppSendMessageError({
      message: "WhatsApp Cloud API is not configured.",
      status: 500,
    });
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${encodeURIComponent(phoneNumberId)}/messages`,
    {
      body: JSON.stringify({
        context: input.replyToMessageId
          ? {
              message_id: input.replyToMessageId,
            }
          : undefined,
        messaging_product: "whatsapp",
        recipient_type: "individual",
        text: {
          body: truncateText(input.text),
          preview_url: input.previewUrl ?? false,
        },
        to: input.to,
        type: "text",
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    const error = (responseBody ?? {}) as WhatsAppErrorResponse;

    throw new WhatsAppSendMessageError({
      code: error.error?.code,
      message: error.error?.message ?? "WhatsApp Cloud API request failed.",
      status: response.status,
      type: error.error?.type,
    });
  }

  const result = responseBody as WhatsAppMessagesResponse;

  return {
    contactWaId: result.contacts?.[0]?.wa_id ?? null,
    messageId: result.messages?.[0]?.id ?? null,
  };
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const body = await response.text();

  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function truncateText(text: string) {
  const normalized = text.trim();

  if (normalized.length <= MAX_TEXT_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_TEXT_LENGTH - 3).trim()}...`;
}
