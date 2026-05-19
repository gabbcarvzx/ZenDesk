import type {
  ParsedWhatsAppMessage,
  WhatsAppMessageType,
  WhatsAppWebhookContact,
  WhatsAppWebhookMessage,
  WhatsAppWebhookPayload,
} from "@/lib/whatsapp/types";

const supportedTypes: WhatsAppMessageType[] = [
  "audio",
  "button",
  "document",
  "image",
  "interactive",
  "location",
  "sticker",
  "text",
  "video",
];

export function parseWhatsAppMessages(
  payload: WhatsAppWebhookPayload,
): ParsedWhatsAppMessage[] {
  if (payload.object !== "whatsapp_business_account") {
    return [];
  }

  const parsedMessages: ParsedWhatsAppMessage[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;

      if (!value || !phoneNumberId || !value.messages?.length) {
        continue;
      }

      for (const message of value.messages) {
        const parsed = parseSingleMessage({
          contact: findContact(value.contacts ?? [], message.from),
          displayPhoneNumber: value.metadata?.display_phone_number ?? null,
          message,
          phoneNumberId,
        });

        if (parsed) {
          parsedMessages.push(parsed);
        }
      }
    }
  }

  return parsedMessages;
}

function parseSingleMessage({
  contact,
  displayPhoneNumber,
  message,
  phoneNumberId,
}: {
  contact: WhatsAppWebhookContact | null;
  displayPhoneNumber: string | null;
  message: WhatsAppWebhookMessage;
  phoneNumberId: string;
}): ParsedWhatsAppMessage | null {
  if (!message.from || !message.id) {
    return null;
  }

  const type = normalizeMessageType(message.type);
  const body = extractMessageBody(message, type);

  return {
    body: body.text,
    customerName: normalizeText(contact?.profile?.name) || null,
    displayPhoneNumber,
    from: message.from,
    isSupportedText: body.isSupportedText,
    messageId: message.id,
    phoneNumberId,
    receivedAt: parseTimestamp(message.timestamp),
    type,
  };
}

function findContact(contacts: WhatsAppWebhookContact[], from: string | undefined) {
  if (!from) {
    return null;
  }

  return contacts.find((contact) => contact.wa_id === from) ?? null;
}

function normalizeMessageType(type: string | undefined): WhatsAppMessageType {
  if (!type) {
    return "unknown";
  }

  return supportedTypes.includes(type as WhatsAppMessageType)
    ? (type as WhatsAppMessageType)
    : "unknown";
}

function extractMessageBody(
  message: WhatsAppWebhookMessage,
  type: WhatsAppMessageType,
): { isSupportedText: boolean; text: string } {
  if (type === "text") {
    return {
      isSupportedText: true,
      text: normalizeText(message.text?.body) || "[Mensagem de texto vazia]",
    };
  }

  if (type === "button") {
    return {
      isSupportedText: true,
      text: normalizeText(message.button?.text) || normalizeText(message.button?.payload) || "Botao selecionado",
    };
  }

  if (type === "interactive") {
    return {
      isSupportedText: true,
      text:
        normalizeText(message.interactive?.button_reply?.title) ||
        normalizeText(message.interactive?.list_reply?.title) ||
        "Opcao interativa selecionada",
    };
  }

  const caption =
    normalizeText(message.image?.caption) ||
    normalizeText(message.video?.caption) ||
    normalizeText(message.document?.caption) ||
    normalizeText(message.location?.name) ||
    normalizeText(message.location?.address);

  if (caption) {
    return {
      isSupportedText: true,
      text: caption,
    };
  }

  return {
    isSupportedText: false,
    text: `[Mensagem do tipo ${type} recebida. Atendimento humano recomendado.]`,
  };
}

function parseTimestamp(timestamp: string | undefined) {
  const seconds = Number(timestamp);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return new Date().toISOString();
  }

  return new Date(seconds * 1000).toISOString();
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}
