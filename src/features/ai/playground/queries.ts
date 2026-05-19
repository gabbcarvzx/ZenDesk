import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrganizationRole, type CurrentTenantProfile } from "@/lib/tenant.server";
import type {
  AiBusinessContext,
  AiConversationMessage,
  AiCustomerContext,
  AiKnowledgeBaseContext,
  AiProductContext,
  AiServiceContext,
} from "@/lib/ai/types";
import {
  fakePlaygroundConversations,
  getFakePlaygroundConversation,
  getPlaygroundExternalThreadId,
  type PlaygroundFakeConversation,
  type PlaygroundFakeConversationId,
} from "@/features/ai/playground/data";
import type { PlaygroundDebugContext } from "@/features/ai/playground/schema";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

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
  tone_of_voice: AiBusinessContext["toneOfVoice"] | null;
  welcome_message: string | null;
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

type ConversationRow = {
  id: string;
};

type MessageRow = {
  body: string;
  created_at: string;
  sender_type: "customer" | "user" | "ai" | "system";
};

export type PlaygroundMessagePreview = {
  content: string;
  createdAt?: string | null;
  persisted: boolean;
  role: AiConversationMessage["role"];
};

export type PlaygroundPageData = {
  canUse: boolean;
  fakeConversations: typeof fakePlaygroundConversations;
  initialDebug?: PlaygroundDebugContext;
  initialMessages: PlaygroundMessagePreview[];
  loadError?: string;
  selectedFakeConversationId: PlaygroundFakeConversationId;
};

export type PlaygroundAiContext = {
  business: AiBusinessContext;
  customer: AiCustomerContext;
  debug: PlaygroundDebugContext;
  knowledgeBase: AiKnowledgeBaseContext[];
  products: AiProductContext[];
  services: AiServiceContext[];
};

export async function getAiPlaygroundPageData(
  selectedConversationId?: string,
): Promise<PlaygroundPageData> {
  const selectedConversation = getFakePlaygroundConversation(selectedConversationId);

  if (!isSupabaseConfigured()) {
    return {
      canUse: false,
      fakeConversations: fakePlaygroundConversations,
      initialMessages: mapSeedMessages(selectedConversation),
      loadError:
        "Supabase ainda nao esta configurado. Configure o ambiente para persistir conversas de teste.",
      selectedFakeConversationId: selectedConversation.id,
    };
  }

  try {
    const profile = await requireOrganizationRole(["owner"]);
    const supabase = await createSupabaseServerClient();
    const conversationId = await findPlaygroundConversationId(
      supabase,
      profile.organizationId,
      selectedConversation.id,
    );
    const persistedMessages = conversationId
      ? await getConversationHistory(supabase, profile.organizationId, conversationId, 12)
      : [];
    const context = await loadPlaygroundAiContext({
      currentCustomerMessage: selectedConversation.defaultCustomerMessage,
      fakeConversation: selectedConversation,
      history: persistedMessages,
      persistedConversationId: conversationId ?? undefined,
      profile,
      supabase,
    });

    return {
      canUse: true,
      fakeConversations: fakePlaygroundConversations,
      initialDebug: context.debug,
      initialMessages: persistedMessages.length
        ? persistedMessages.map((message) => ({
            ...message,
            persisted: true,
          }))
        : mapSeedMessages(selectedConversation),
      selectedFakeConversationId: selectedConversation.id,
    };
  } catch {
    return {
      canUse: false,
      fakeConversations: fakePlaygroundConversations,
      initialMessages: mapSeedMessages(selectedConversation),
      loadError: "Somente o dono autenticado da organizacao pode usar o playground da IA.",
      selectedFakeConversationId: selectedConversation.id,
    };
  }
}

export async function loadPlaygroundAiContext({
  currentCustomerMessage,
  fakeConversation,
  history,
  persistedConversationId,
  profile,
  supabase,
}: {
  currentCustomerMessage: string;
  fakeConversation: PlaygroundFakeConversation;
  history: AiConversationMessage[];
  persistedConversationId?: string;
  profile: CurrentTenantProfile;
  supabase: SupabaseServerClient;
}): Promise<PlaygroundAiContext> {
  const [business, products, services, knowledgeBase] = await Promise.all([
    getBusinessContext(supabase, profile),
    getProductsContext(supabase, profile.organizationId),
    getServicesContext(supabase, profile.organizationId),
    getKnowledgeBaseContext(supabase, profile.organizationId),
  ]);
  const customer: AiCustomerContext = {
    email: fakeConversation.customer.email ?? null,
    name: fakeConversation.customer.name,
    phone: fakeConversation.customer.phone ?? null,
    tenantId: profile.organizationId,
  };

  return {
    business,
    customer,
    debug: buildDebugContext({
      business,
      currentCustomerMessage,
      fakeConversation,
      history,
      knowledgeBase,
      persistedConversationId,
      products,
      services,
    }),
    knowledgeBase,
    products,
    services,
  };
}

export async function findPlaygroundConversationId(
  supabase: SupabaseServerClient,
  organizationId: string,
  fakeConversationId: PlaygroundFakeConversationId,
) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("channel", "manual")
    .eq("external_thread_id", getPlaygroundExternalThreadId(organizationId, fakeConversationId))
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ConversationRow | null)?.id ?? null;
}

export async function getConversationHistory(
  supabase: SupabaseServerClient,
  organizationId: string,
  conversationId: string,
  limit = 20,
): Promise<AiConversationMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("body,created_at,sender_type")
    .eq("organization_id", organizationId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

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

function mapSeedMessages(fakeConversation: PlaygroundFakeConversation): PlaygroundMessagePreview[] {
  return fakeConversation.seedMessages.map((message) => ({
    content: message.content,
    persisted: false,
    role: message.role,
  }));
}

async function getBusinessContext(
  supabase: SupabaseServerClient,
  profile: CurrentTenantProfile,
): Promise<AiBusinessContext> {
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
        "tone_of_voice",
        "welcome_message",
      ].join(","),
    )
    .eq("organization_id", profile.organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = data as BusinessSettingsRow | null;

  return {
    address: row?.address ?? null,
    businessHours: row?.business_hours ?? null,
    cancellationPolicy: row?.cancellation_policy ?? null,
    description: row?.business_description ?? null,
    googleMapsUrl: row?.google_maps_url ?? null,
    humanHandoffMessage: row?.human_handoff_message ?? null,
    importantRules: row?.important_rules ?? null,
    instagramUrl: row?.instagram_url ?? null,
    name: row?.business_name || profile.organization.name,
    niche: row?.industry ?? null,
    primaryLanguage: row?.default_language ?? "pt-BR",
    tenantId: profile.organizationId,
    toneOfVoice: row?.tone_of_voice ?? "profissional",
    welcomeMessage: row?.welcome_message ?? null,
  };
}

async function getProductsContext(
  supabase: SupabaseServerClient,
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
  supabase: SupabaseServerClient,
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
  supabase: SupabaseServerClient,
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

function buildDebugContext({
  business,
  currentCustomerMessage,
  fakeConversation,
  history,
  knowledgeBase,
  persistedConversationId,
  products,
  services,
}: {
  business: AiBusinessContext;
  currentCustomerMessage: string;
  fakeConversation: PlaygroundFakeConversation;
  history: AiConversationMessage[];
  knowledgeBase: AiKnowledgeBaseContext[];
  persistedConversationId?: string;
  products: AiProductContext[];
  services: AiServiceContext[];
}): PlaygroundDebugContext {
  return {
    business: {
      businessHours: business.businessHours ?? null,
      name: business.name,
      niche: business.niche ?? null,
      toneOfVoice: business.toneOfVoice ?? null,
    },
    conversation: {
      fakeConversationId: fakeConversation.id,
      persistedConversationId,
      seedScenario: fakeConversation.label,
    },
    currentCustomerMessage,
    history: history.map((message) => ({
      content: message.content,
      createdAt: message.createdAt,
      role: message.role,
    })),
    knowledgeBase: knowledgeBase.map((item) => ({
      category: item.category ?? null,
      priority: item.priority ?? null,
      title: item.title,
    })),
    products: products.map((product) => ({
      category: product.category ?? null,
      name: product.name,
      priceCents: product.priceCents ?? null,
      status: product.status ?? null,
    })),
    services: services.map((service) => ({
      category: service.category ?? null,
      durationMinutes: service.durationMinutes ?? null,
      name: service.name,
      priceCents: service.priceCents ?? null,
      status: service.status ?? null,
    })),
  };
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
