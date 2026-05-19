"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrganizationRole } from "@/lib/tenant.server";
import { respondToCustomer } from "@/lib/ai/respond";
import {
  getFakePlaygroundConversation,
  getPlaygroundExternalThreadId,
  type PlaygroundFakeConversation,
} from "@/features/ai/playground/data";
import {
  findPlaygroundConversationId,
  getConversationHistory,
  loadPlaygroundAiContext,
} from "@/features/ai/playground/queries";
import {
  parsePlaygroundGenerateForm,
  type PlaygroundActionState,
} from "@/features/ai/playground/schema";

const playgroundPath = "/app/ai/playground";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function generatePlaygroundResponseAction(
  previousState: PlaygroundActionState,
  formData: FormData,
): Promise<PlaygroundActionState> {
  const parsed = parsePlaygroundGenerateForm(formData);
  const selectedFakeConversationId = parsed.success
    ? parsed.data.fakeConversationId
    : previousState.selectedFakeConversationId;

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revise a mensagem de teste.",
      selectedFakeConversationId,
      status: "error",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      message: "Supabase nao esta configurado neste ambiente.",
      selectedFakeConversationId,
      status: "error",
    };
  }

  try {
    const profile = await requireOrganizationRole(["owner"]);
    const supabase = await createSupabaseServerClient();
    const fakeConversation = getFakePlaygroundConversation(parsed.data.fakeConversationId);
    const conversationId = await ensurePlaygroundConversation(
      supabase,
      profile.organizationId,
      fakeConversation,
    );
    const history = await getConversationHistory(
      supabase,
      profile.organizationId,
      conversationId,
      16,
    );
    const context = await loadPlaygroundAiContext({
      currentCustomerMessage: parsed.data.customerMessage,
      fakeConversation,
      history,
      persistedConversationId: conversationId,
      profile,
      supabase,
    });

    await saveCustomerMessage({
      body: parsed.data.customerMessage,
      conversationId,
      organizationId: profile.organizationId,
      supabase,
    });

    const aiResult = await respondToCustomer({
      business: context.business,
      conversationHistory: history,
      currentCustomerMessage: parsed.data.customerMessage,
      customer: context.customer,
      knowledgeBase: context.knowledgeBase,
      products: context.products,
      services: context.services,
      tenantId: profile.organizationId,
    });

    await saveAiMessage({
      body: aiResult.text,
      conversationId,
      organizationId: profile.organizationId,
      responseStatus: aiResult.status,
      supabase,
    });
    await touchConversation(supabase, profile.organizationId, conversationId);

    revalidatePath(playgroundPath);

    return {
      debug: {
        ...context.debug,
        promptMetadata: {
          activeKnowledgeItems: aiResult.promptMetadata.activeKnowledgeItems,
          activeProducts: aiResult.promptMetadata.activeProducts,
          activeServices: aiResult.promptMetadata.activeServices,
          historyMessages: aiResult.promptMetadata.historyMessages,
        },
      },
      message:
        aiResult.status === "generated"
          ? "Resposta gerada e salva na conversa fake."
          : "A IA pediu transferencia humana e a mensagem foi salva.",
      response: {
        finishReason: aiResult.finishReason,
        handoffReason: aiResult.handoffReason,
        model: aiResult.model,
        status: aiResult.status,
        text: aiResult.text,
      },
      selectedFakeConversationId,
      status: "success",
    };
  } catch {
    return {
      message:
        "Nao foi possivel gerar a resposta. Verifique permissao, contexto do negocio e credenciais da IA.",
      selectedFakeConversationId,
      status: "error",
    };
  }
}

async function ensurePlaygroundConversation(
  supabase: SupabaseServerClient,
  organizationId: string,
  fakeConversation: PlaygroundFakeConversation,
) {
  const existingConversationId = await findPlaygroundConversationId(
    supabase,
    organizationId,
    fakeConversation.id,
  );

  if (existingConversationId) {
    await ensureSeedMessages(supabase, organizationId, existingConversationId, fakeConversation);

    return existingConversationId;
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      channel: "manual",
      external_thread_id: getPlaygroundExternalThreadId(organizationId, fakeConversation.id),
      metadata: {
        customerName: fakeConversation.customer.name,
        fakeConversationId: fakeConversation.id,
        source: "ai_playground",
      },
      organization_id: organizationId,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  const conversationId = (data as { id: string }).id;
  await ensureSeedMessages(supabase, organizationId, conversationId, fakeConversation);

  return conversationId;
}

async function ensureSeedMessages(
  supabase: SupabaseServerClient,
  organizationId: string,
  conversationId: string,
  fakeConversation: PlaygroundFakeConversation,
) {
  const { count, error: countError } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("conversation_id", conversationId);

  if (countError) {
    throw countError;
  }

  if (count || !fakeConversation.seedMessages.length) {
    return;
  }

  const startAt = Date.now() - fakeConversation.seedMessages.length * 60_000;
  const { error } = await supabase.from("messages").insert(
    fakeConversation.seedMessages.map((message, index) => ({
      body: message.content,
      conversation_id: conversationId,
      created_at: new Date(startAt + index * 60_000).toISOString(),
      direction: message.role === "customer" ? "inbound" : "outbound",
      metadata: {
        fakeConversationId: fakeConversation.id,
        source: "ai_playground_seed",
      },
      organization_id: organizationId,
      sender_type: message.role === "customer" ? "customer" : "ai",
      status: "sent",
    })),
  );

  if (error) {
    throw error;
  }
}

async function saveCustomerMessage({
  body,
  conversationId,
  organizationId,
  supabase,
}: {
  body: string;
  conversationId: string;
  organizationId: string;
  supabase: SupabaseServerClient;
}) {
  const { error } = await supabase.from("messages").insert({
    body,
    conversation_id: conversationId,
    direction: "inbound",
    metadata: {
      source: "ai_playground",
    },
    organization_id: organizationId,
    sender_type: "customer",
    status: "sent",
  });

  if (error) {
    throw error;
  }
}

async function saveAiMessage({
  body,
  conversationId,
  organizationId,
  responseStatus,
  supabase,
}: {
  body: string;
  conversationId: string;
  organizationId: string;
  responseStatus: string;
  supabase: SupabaseServerClient;
}) {
  const { error } = await supabase.from("messages").insert({
    body,
    conversation_id: conversationId,
    direction: "outbound",
    metadata: {
      responseStatus,
      source: "ai_playground",
    },
    organization_id: organizationId,
    sender_type: "ai",
    status: "sent",
  });

  if (error) {
    throw error;
  }
}

async function touchConversation(
  supabase: SupabaseServerClient,
  organizationId: string,
  conversationId: string,
) {
  const { error } = await supabase
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      status: "waiting_customer",
    })
    .eq("organization_id", organizationId)
    .eq("id", conversationId);

  if (error) {
    throw error;
  }
}
