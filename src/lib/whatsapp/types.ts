export type WhatsAppMessageType =
  | "audio"
  | "button"
  | "document"
  | "image"
  | "interactive"
  | "location"
  | "sticker"
  | "text"
  | "unknown"
  | "video";

export type WhatsAppWebhookPayload = {
  entry?: WhatsAppWebhookEntry[];
  object?: string;
};

export type WhatsAppWebhookEntry = {
  changes?: WhatsAppWebhookChange[];
  id?: string;
};

export type WhatsAppWebhookChange = {
  field?: string;
  value?: WhatsAppWebhookValue;
};

export type WhatsAppWebhookValue = {
  contacts?: WhatsAppWebhookContact[];
  messaging_product?: "whatsapp";
  messages?: WhatsAppWebhookMessage[];
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };
  statuses?: WhatsAppWebhookStatus[];
};

export type WhatsAppWebhookContact = {
  profile?: {
    name?: string;
  };
  wa_id?: string;
};

export type WhatsAppWebhookStatus = {
  id?: string;
  recipient_id?: string;
  status?: string;
  timestamp?: string;
};

export type WhatsAppWebhookMessage = {
  audio?: unknown;
  button?: {
    payload?: string;
    text?: string;
  };
  document?: {
    caption?: string;
    filename?: string;
  };
  from?: string;
  id?: string;
  image?: {
    caption?: string;
  };
  interactive?: {
    button_reply?: {
      id?: string;
      title?: string;
    };
    list_reply?: {
      id?: string;
      title?: string;
    };
    type?: string;
  };
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    name?: string;
  };
  sticker?: unknown;
  text?: {
    body?: string;
  };
  timestamp?: string;
  type?: WhatsAppMessageType | string;
  video?: {
    caption?: string;
  };
};

export type ParsedWhatsAppMessage = {
  body: string;
  customerName: string | null;
  displayPhoneNumber: string | null;
  from: string;
  isSupportedText: boolean;
  messageId: string;
  phoneNumberId: string;
  receivedAt: string;
  type: WhatsAppMessageType;
};

export type WhatsAppWebhookVerificationParams = {
  challenge: string | null;
  mode: string | null;
  verifyToken: string | null;
};

export type WhatsAppSendTextMessageInput = {
  accessToken?: string;
  apiVersion?: string;
  phoneNumberId?: string;
  previewUrl?: boolean;
  replyToMessageId?: string | null;
  text: string;
  to: string;
};

export type WhatsAppSendTextMessageResult = {
  contactWaId: string | null;
  messageId: string | null;
};
