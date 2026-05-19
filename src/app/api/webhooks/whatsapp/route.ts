import { NextRequest, NextResponse } from "next/server";
import { respondToCustomer } from "@/lib/ai/respond";
import type {
  AiBusinessContext,
  AiConversationMessage,
  AiCustomerContext,
  AiKnowledgeBaseContext,
  AiProductContext,
  AiServiceContext,
} from "@/lib/ai/types";
import {
  applyRateLimit,
  buildRateLimitKey,
  getRateLimitHeaders,
} from "@/lib/rate-limit";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/service-role";
import { parseWhatsAppMessages } from "@/lib/whatsapp/parse-message";
import { sendWhatsAppTextMessage, WhatsAppSendMessageError } from "@/lib/whatsapp/send-message";
import type { ParsedWhatsAppMessage, WhatsAppWebhookPayload } from "@/lib/whatsapp/types";
import {
  verifyWhatsAppRequestSignature,
  verifyWhatsAppWebhook,
} from "@/lib/whatsapp/verify-webhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_WEBHOOK_BODY_LENGTH = 512_000;
const WEBHOOK_GET_RATE_LIMIT = 60;
const WEBHOOK_POST_RATE_LIMIT = 120;
const WEBHOOK_RATE_LIMIT_WINDOW_MS = 60_000;
const HISTORY_LIMIT = 16;

type SupabaseServiceRoleClient = ReturnType<typeof createSupabaseServiceRoleClient>;

type BusinessSettingsRow = {
  address: string | null;
  business_description: string | null;
  business_hours: string | null;
  business_name: string | null;
  cancellation_policy: string | null;
  default_language: string | null;
  google_maps_url: string | null;
  human_handoff_message: string | null;
  important_rules: string | null;
  industry: string | null;
  instagram_url: string | null;
  organization_id: string;
  tone_of_voice: AiBusinessContext["toneOfVoice"] | null;
  welcome_message: string | null;
  whatsapp_phone_number_id: string | null;
};

type CustomerRow = {
  email: string | null;
  id: string;
  name: string;
  phone: string | null;
};

type ConversationRow = {
  customer_id: string | null;
  id: string;
  status: "open" | "waiting_customer" | "waiting_human" | "closed";
};

type MessageRow = {
  body: string;
  created_at: string;
  id?: string;
  sender_type: "customer" | "user" | "ai" | "system";
};

type ProductRow = {
  category: string | null;
  currency: string | null;
  description: string | null;
  id: string;
  name: string;
  price_cents: number | null;
  status: AiProductContext["status"] | null;
  stock_quantity: number | null;
};

type ServiceRow = {
  category: string | null;
  currency: string | null;
  description: string | null;
  duration_minutes: number | null;
  id: string;
  name: string;
  price_cents: number | null;
  status: AiServiceContext["status"] | null;
};

type KnowledgeBaseRow = {
  category: string | null;
  content: string;
  priority: number | null;
  status: AiKnowledgeBaseContext["status"] | null;
  title: string;
};

export async function GET(request: NextRequest) {
  const rateLimit = applyRateLimit({
    key: buildRateLimitKey("whatsapp-webhook:get", request),
    limit: WEBHOOK_GET_RATE_LIMIT,
    windowMs: WEBHOOK_RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    logWarn("webhook_verification_rate_limited");

    return NextResponse.json(
      { error: "Too many requests." },
      {
        headers: getRateLimitHeaders(rateLimit),
        status: 429,
      },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const verification = verifyWhatsAppWebhook({
    challenge: searchParams.get("hub.challenge"),
    mode: searchParams.get("hub.mode"),
    verifyToken: searchParams.get("hub.verify_token"),
  });

  if (verification.ok) {
    logInfo("webhook_verification_success", {
      mode: searchParams.get("hub.mode"),
    });

    return new NextResponse(verification.challenge, {
      headers: {
        "Content-Type": "text/plain",
      },
      status: 200,
    });
  }

  logWarn("webhook_verification_failed", {
    reason: verification.reason,
  });

  return NextResponse.json(
    {
      error: "Webhook verification failed.",
    },
    { status: verification.reason === "missing_token" ? 500 : 403 },
  );
}

export async function POST(request: NextRequest) {
  const rateLimit = applyRateLimit({
    key: buildRateLimitKey("whatsapp-webhook:post", request),
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

  if (!process.env.WHATSAPP_APP_SECRET) {
    logError("webhook_app_secret_not_configured");

    return NextResponse.json(
      { error: "Webhook signature validation is not configured." },
      { status: 503 },
    );
  }

  if (
    !verifyWhatsAppRequestSignature({
      rawBody,
      signatureHeader: request.headers.get("x-hub-signature-256"),
    })
  ) {
    logWarn("webhook_signature_invalid", {
      hasSignature: Boolean(request.headers.get("x-hub-signature-256")),
    });

    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  if (!isSupabaseServiceRoleConfigured()) {
    logError("webhook_supabase_not_configured");

    return NextResponse.json({ error: "Webhook storage is not configured." }, { status: 500 });
  }

  const payload = parseJson(rawBody);

  if (!payload) {
    logWarn("webhook_invalid_json");

    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const messages = parseWhatsAppMessages(payload);

  if (!messages.length) {
    logInfo("webhook_no_messages");

    return NextResponse.json({ ok: true, received: 0 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const results = [];

  for (const message of messages) {
    results.push(await processInboundMessage({ message, supabase }));
  }

  return NextResponse.json({
    ok: true,
    processed: results.filter((result) => result === "processed").length,
    received: messages.length,
    skipped: results.filter((result) => result !== "processed").length,
  });
}

async function processInboundMessage({
  message,
  supabase,
}: {
  message: ParsedWhatsAppMessage;
  supabase: SupabaseServiceRoleClient;
}) {
  try {
    if (!isExpectedPhoneNumber(message.phoneNumberId)) {
      logWarn("webhook_unexpected_phone_number", {
        phoneNumberId: message.phoneNumberId,
      });

      return "unexpected_phone_number";
    }

    const settings = await getBusinessSettingsByPhoneNumber(supabase, message.phoneNumberId);

    if (!settings) {
      logWarn("webhook_phone_number_without_tenant", {
        phoneNumberId: message.phoneNumberId,
      });

      return "missing_tenant_mapping";
    }

    const duplicate = await findExistingMessageByExternalId({
      externalMessageId: message.messageId,
      organizationId: settings.organization_id,
      supabase,
    });

    if (duplicate) {
      logInfo("webhook_duplicate_message_ignored", {
        messageId: message.messageId,
        organizationId: settings.organization_id,
      });

      return "duplicate";
    }

    const customer = await ensureWhatsAppCustomer({
      message,
      organizationId: settings.organization_id,
      supabase,
    });
    const conversation = await ensureWhatsAppConversation({
      customerId: customer.id,
      message,
      organizationId: settings.organization_id,
      supabase,
    });
    const history = await getConversationHistory({
      conversationId: conversation.id,
      organizationId: settings.organization_id,
      supabase,
    });
    const inboundMessageId = await saveInboundMessage({
      conversationId: conversation.id,
      customerId: customer.id,
      message,
      organizationId: settings.organization_id,
      supabase,
    });

    if (conversation.status === "waiting_human") {
      await touchConversation({
        conversationId: conversation.id,
        organizationId: settings.organization_id,
        status: "waiting_human",
        supabase,
      });
      logInfo("webhook_ai_skipped_human_owner", {
        conversationId: conversation.id,
        organizationId: settings.organization_id,
      });

      return "waiting_human";
    }

    const aiContext = await loadAiContext({
      customer,
      currentCustomerMessage: message.body,
      history,
      settings,
      supabase,
    });
    const aiResult = await respondToCustomer({
      business: aiContext.business,
      conversationHistory: history,
      currentCustomerMessage: message.body,
      customer: aiContext.customer,
      knowledgeBase: aiContext.knowledgeBase,
      products: aiContext.products,
      services: aiContext.services,
      tenantId: settings.organization_id,
    }, {
      toolContext: {
        conversationId: conversation.id,
        customerId: customer.id,
        organizationId: settings.organization_id,
        requestedByMessageId: inboundMessageId,
        source: "whatsapp_cloud_api_ai",
        supabase,
      },
    });
    const outboundMessageId = await saveAiMessage({
      body: aiResult.text,
      conversationId: conversation.id,
      customerId: customer.id,
      inboundMessageId,
      organizationId: settings.organization_id,
      responseStatus: aiResult.status,
      supabase,
    });

    try {
      const sendResult = await sendWhatsAppTextMessage({
        phoneNumberId: message.phoneNumberId,
        replyToMessageId: message.messageId,
        text: aiResult.text,
        to: message.from,
      });

      await updateAiMessageAfterSend({
        externalMessageId: sendResult.messageId,
        messageId: outboundMessageId,
        organizationId: settings.organization_id,
        status: "sent",
        supabase,
      });
    } catch (error) {
      await updateAiMessageAfterSend({
        messageId: outboundMessageId,
        organizationId: settings.organization_id,
        status: "failed",
        supabase,
      });
      logWhatsAppSendError(error, {
        conversationId: conversation.id,
        organizationId: settings.organization_id,
      });
    }

    if (aiResult.status === "handoff") {
      await ensureOpenHandoff({
        conversationId: conversation.id,
        customerId: customer.id,
        organizationId: settings.organization_id,
        requestedByMessageId: inboundMessageId,
        supabase,
      });
    }

    await touchConversation({
      conversationId: conversation.id,
      organizationId: settings.organization_id,
      status: aiResult.status === "handoff" ? "waiting_human" : "waiting_customer",
      supabase,
    });

    logInfo("webhook_message_processed", {
      aiStatus: aiResult.status,
      conversationId: conversation.id,
      organizationId: settings.organization_id,
    });

    return "processed";
  } catch (error) {
    logError("webhook_message_processing_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      messageId: message.messageId,
      phone: maskPhone(message.from),
    });

    return "failed";
  }
}

async function getBusinessSettingsByPhoneNumber(
  supabase: SupabaseServiceRoleClient,
  phoneNumberId: string,
) {
  const { data, error } = await supabase
    .from("business_settings")
    .select(
      [
        "address",
        "business_description",
        "business_hours",
        "business_name",
        "cancellation_policy",
        "default_language",
        "google_maps_url",
        "human_handoff_message",
        "important_rules",
        "industry",
        "instagram_url",
        "organization_id",
        "tone_of_voice",
        "welcome_message",
        "whatsapp_phone_number_id",
      ].join(","),
    )
    .eq("whatsapp_phone_number_id", phoneNumberId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as BusinessSettingsRow | null) ?? null;
}

async function ensureWhatsAppCustomer({
  message,
  organizationId,
  supabase,
}: {
  message: ParsedWhatsAppMessage;
  organizationId: string;
  supabase: SupabaseServiceRoleClient;
}) {
  const phone = formatWhatsAppPhone(message.from);
  const { data: existingData, error: existingError } = await supabase
    .from("customers")
    .select("id,name,phone,email")
    .eq("organization_id", organizationId)
    .in("phone", [phone, message.from])
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingData) {
    const customer = existingData as CustomerRow;
    await supabase
      .from("customers")
      .update({
        last_interaction_at: message.receivedAt,
      })
      .eq("organization_id", organizationId)
      .eq("id", customer.id);

    return customer;
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      last_interaction_at: message.receivedAt,
      lifecycle_status: "new",
      metadata: {
        source: "whatsapp_cloud_api",
        whatsappWaId: message.from,
      },
      name: message.customerName || `Cliente WhatsApp ${message.from.slice(-4)}`,
      organization_id: organizationId,
      phone,
      source: "whatsapp",
      tags: ["whatsapp"],
    })
    .select("id,name,phone,email")
    .single();

  if (error) {
    const recovered = await findCustomerByPhone({
      organizationId,
      phone,
      supabase,
      whatsappId: message.from,
    });

    if (recovered) {
      return recovered;
    }

    throw error;
  }

  return data as CustomerRow;
}

async function findCustomerByPhone({
  organizationId,
  phone,
  supabase,
  whatsappId,
}: {
  organizationId: string;
  phone: string;
  supabase: SupabaseServiceRoleClient;
  whatsappId: string;
}) {
  const { data, error } = await supabase
    .from("customers")
    .select("id,name,phone,email")
    .eq("organization_id", organizationId)
    .in("phone", [phone, whatsappId])
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as CustomerRow | null) ?? null;
}

async function ensureWhatsAppConversation({
  customerId,
  message,
  organizationId,
  supabase,
}: {
  customerId: string;
  message: ParsedWhatsAppMessage;
  organizationId: string;
  supabase: SupabaseServiceRoleClient;
}) {
  const externalThreadId = getWhatsAppExternalThreadId(message);
  const { data: existingData, error: existingError } = await supabase
    .from("conversations")
    .select("id,customer_id,status")
    .eq("organization_id", organizationId)
    .eq("channel", "whatsapp")
    .eq("external_thread_id", externalThreadId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingData) {
    const conversation = existingData as ConversationRow;
    const nextStatus =
      conversation.status === "waiting_human" ? "waiting_human" : "open";

    await supabase
      .from("conversations")
      .update({
        customer_id: conversation.customer_id ?? customerId,
        last_message_at: message.receivedAt,
        status: nextStatus,
      })
      .eq("organization_id", organizationId)
      .eq("id", conversation.id);

    return {
      ...conversation,
      customer_id: conversation.customer_id ?? customerId,
      status: nextStatus,
    };
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      channel: "whatsapp",
      customer_id: customerId,
      external_thread_id: externalThreadId,
      last_message_at: message.receivedAt,
      metadata: {
        displayPhoneNumber: message.displayPhoneNumber,
        phoneNumberId: message.phoneNumberId,
        source: "whatsapp_cloud_api",
        whatsappFrom: message.from,
      },
      organization_id: organizationId,
      status: "open",
    })
    .select("id,customer_id,status")
    .single();

  if (error) {
    throw error;
  }

  return data as ConversationRow;
}

async function findExistingMessageByExternalId({
  externalMessageId,
  organizationId,
  supabase,
}: {
  externalMessageId: string;
  organizationId: string;
  supabase: SupabaseServiceRoleClient;
}) {
  const { data, error } = await supabase
    .from("messages")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("external_message_id", externalMessageId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function saveInboundMessage({
  conversationId,
  customerId,
  message,
  organizationId,
  supabase,
}: {
  conversationId: string;
  customerId: string;
  message: ParsedWhatsAppMessage;
  organizationId: string;
  supabase: SupabaseServiceRoleClient;
}) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      body: message.body,
      conversation_id: conversationId,
      created_at: message.receivedAt,
      customer_id: customerId,
      direction: "inbound",
      external_message_id: message.messageId,
      metadata: {
        isSupportedText: message.isSupportedText,
        phoneNumberId: message.phoneNumberId,
        source: "whatsapp_cloud_api",
        type: message.type,
        whatsappFrom: message.from,
      },
      organization_id: organizationId,
      sender_type: "customer",
      status: "delivered",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return (data as { id: string }).id;
}

async function saveAiMessage({
  body,
  conversationId,
  customerId,
  inboundMessageId,
  organizationId,
  responseStatus,
  supabase,
}: {
  body: string;
  conversationId: string;
  customerId: string;
  inboundMessageId: string;
  organizationId: string;
  responseStatus: string;
  supabase: SupabaseServiceRoleClient;
}) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      body,
      conversation_id: conversationId,
      customer_id: customerId,
      direction: "outbound",
      metadata: {
        inboundMessageId,
        responseStatus,
        source: "whatsapp_cloud_api_ai",
      },
      organization_id: organizationId,
      sender_type: "ai",
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return (data as { id: string }).id;
}

async function updateAiMessageAfterSend({
  externalMessageId,
  messageId,
  organizationId,
  status,
  supabase,
}: {
  externalMessageId?: string | null;
  messageId: string;
  organizationId: string;
  status: "failed" | "sent";
  supabase: SupabaseServiceRoleClient;
}) {
  const { error } = await supabase
    .from("messages")
    .update({
      external_message_id: externalMessageId ?? null,
      status,
    })
    .eq("organization_id", organizationId)
    .eq("id", messageId);

  if (error) {
    throw error;
  }
}

async function getConversationHistory({
  conversationId,
  organizationId,
  supabase,
}: {
  conversationId: string;
  organizationId: string;
  supabase: SupabaseServiceRoleClient;
}): Promise<AiConversationMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("body,created_at,sender_type")
    .eq("organization_id", organizationId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    throw error;
  }

  return ((data ?? []) as MessageRow[]).reverse().map((row) => ({
    content: row.body,
    createdAt: row.created_at,
    role: mapSenderTypeToRole(row.sender_type),
    tenantId: organizationId,
  }));
}

async function loadAiContext({
  customer,
  settings,
  supabase,
}: {
  currentCustomerMessage: string;
  customer: CustomerRow;
  history: AiConversationMessage[];
  settings: BusinessSettingsRow;
  supabase: SupabaseServiceRoleClient;
}) {
  const [products, services, knowledgeBase] = await Promise.all([
    getProductsContext(supabase, settings.organization_id),
    getServicesContext(supabase, settings.organization_id),
    getKnowledgeBaseContext(supabase, settings.organization_id),
  ]);
  const business: AiBusinessContext = {
    address: settings.address,
    businessHours: settings.business_hours,
    cancellationPolicy: settings.cancellation_policy,
    description: settings.business_description,
    googleMapsUrl: settings.google_maps_url,
    humanHandoffMessage: settings.human_handoff_message,
    importantRules: settings.important_rules,
    instagramUrl: settings.instagram_url,
    name: settings.business_name || "Negocio",
    niche: settings.industry,
    primaryLanguage: settings.default_language ?? "pt-BR",
    tenantId: settings.organization_id,
    toneOfVoice: settings.tone_of_voice ?? "profissional",
    welcomeMessage: settings.welcome_message,
  };
  const aiCustomer: AiCustomerContext = {
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    tenantId: settings.organization_id,
  };

  return {
    business,
    customer: aiCustomer,
    knowledgeBase,
    products,
    services,
  };
}

async function getProductsContext(
  supabase: SupabaseServiceRoleClient,
  organizationId: string,
): Promise<AiProductContext[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,description,price_cents,currency,stock_quantity,category,status")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProductRow[]).map((row) => ({
    category: row.category,
    currency: row.currency ?? "BRL",
    description: row.description,
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
    status: row.status,
    stockQuantity: row.stock_quantity,
    tenantId: organizationId,
  }));
}

async function getServicesContext(
  supabase: SupabaseServiceRoleClient,
  organizationId: string,
): Promise<AiServiceContext[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id,name,description,price_cents,currency,duration_minutes,category,status")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ServiceRow[]).map((row) => ({
    category: row.category,
    currency: row.currency ?? "BRL",
    description: row.description,
    durationMinutes: row.duration_minutes,
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
    status: row.status,
    tenantId: organizationId,
  }));
}

async function getKnowledgeBaseContext(
  supabase: SupabaseServiceRoleClient,
  organizationId: string,
): Promise<AiKnowledgeBaseContext[]> {
  const { data, error } = await supabase
    .from("ai_knowledge_base")
    .select("title,content,category,priority,status")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    throw error;
  }

  return ((data ?? []) as KnowledgeBaseRow[]).map((row) => ({
    category: row.category,
    content: row.content,
    priority: row.priority,
    status: row.status,
    tenantId: organizationId,
    title: row.title,
  }));
}

async function touchConversation({
  conversationId,
  organizationId,
  status,
  supabase,
}: {
  conversationId: string;
  organizationId: string;
  status: ConversationRow["status"];
  supabase: SupabaseServiceRoleClient;
}) {
  const { error } = await supabase
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      status,
    })
    .eq("organization_id", organizationId)
    .eq("id", conversationId);

  if (error) {
    throw error;
  }
}

async function ensureOpenHandoff({
  conversationId,
  customerId,
  organizationId,
  requestedByMessageId,
  supabase,
}: {
  conversationId: string;
  customerId: string;
  organizationId: string;
  requestedByMessageId: string;
  supabase: SupabaseServiceRoleClient;
}) {
  const { data, error } = await supabase
    .from("human_handoffs")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("conversation_id", conversationId)
    .in("status", ["open", "assigned"])
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return;
  }

  const { error: insertError } = await supabase.from("human_handoffs").insert({
    conversation_id: conversationId,
    customer_id: customerId,
    metadata: {
      source: "whatsapp_cloud_api_ai",
    },
    organization_id: organizationId,
    reason: "A IA solicitou transferencia para humano.",
    requested_by_message_id: requestedByMessageId,
    status: "open",
  });

  if (insertError) {
    throw insertError;
  }
}

function parseJson(rawBody: string): WhatsAppWebhookPayload | null {
  try {
    return JSON.parse(rawBody) as WhatsAppWebhookPayload;
  } catch {
    return null;
  }
}

function isContentLengthTooLarge(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length"));

  return Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BODY_LENGTH;
}

function isExpectedPhoneNumber(phoneNumberId: string) {
  const expectedPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  return !expectedPhoneNumberId || expectedPhoneNumberId === phoneNumberId;
}

function getWhatsAppExternalThreadId(message: ParsedWhatsAppMessage) {
  return `${message.phoneNumberId}:${message.from}`;
}

function formatWhatsAppPhone(value: string) {
  return value.startsWith("+") ? value : `+${value}`;
}

function mapSenderTypeToRole(senderType: MessageRow["sender_type"]) {
  if (senderType === "ai") {
    return "ai";
  }

  if (senderType === "user") {
    return "human";
  }

  return "customer";
}

function logWhatsAppSendError(
  error: unknown,
  context: { conversationId: string; organizationId: string },
) {
  if (error instanceof WhatsAppSendMessageError) {
    logError("webhook_whatsapp_send_failed", {
      code: error.code,
      conversationId: context.conversationId,
      organizationId: context.organizationId,
      status: error.status,
      type: error.type,
    });

    return;
  }

  logError("webhook_whatsapp_send_failed", {
    conversationId: context.conversationId,
    errorName: error instanceof Error ? error.name : "UnknownError",
    organizationId: context.organizationId,
  });
}

function logInfo(event: string, data: Record<string, unknown> = {}) {
  console.info("[whatsapp-webhook]", event, data);
}

function logWarn(event: string, data: Record<string, unknown> = {}) {
  console.warn("[whatsapp-webhook]", event, data);
}

function logError(event: string, data: Record<string, unknown> = {}) {
  console.error("[whatsapp-webhook]", event, data);
}

function maskPhone(phone: string) {
  return phone.length <= 4 ? "****" : `***${phone.slice(-4)}`;
}
