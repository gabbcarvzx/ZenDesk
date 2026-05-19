"use server";

import { revalidatePath } from "next/cache";
import {
  BillingPolicyError,
  assertCanUseFeature,
  getBillingPolicyMessage,
} from "@/lib/billing/policy";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrganizationRole } from "@/lib/tenant.server";
import {
  parseConversationIdForm,
  parseCreateTestConversationForm,
  parseManualReplyForm,
  type ConversationActionState,
} from "@/features/conversations/schema";

const conversationsPath = "/app/conversations";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type ConversationRow = {
  customer_id: string | null;
  id: string;
  status: string;
};

type CustomerRow = {
  id: string;
};

type HandoffRow = {
  id: string;
};

export async function createTestConversationAction(
  _previousState: ConversationActionState,
  formData: FormData,
): Promise<ConversationActionState> {
  const parsed = parseCreateTestConversationForm(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revise os dados da conversa de teste.",
      status: "error",
    };
  }

  return saveConversationMutation(async () => {
    const profile = await requireOrganizationRole(["owner", "admin", "agent"]);
    const supabase = await createSupabaseServerClient();
    const now = new Date().toISOString();
    const customerId = await findOrCreateCustomer({
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      organizationId: profile.organizationId,
      supabase,
    });
    const { data: conversationData, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        channel: "manual",
        customer_id: customerId,
        external_thread_id: `manual-test:${profile.organizationId}:${Date.now()}`,
        last_message_at: now,
        metadata: {
          source: "manual_test",
        },
        organization_id: profile.organizationId,
        status: "open",
      })
      .select("id")
      .single();

    if (conversationError) {
      throw conversationError;
    }

    const conversationId = (conversationData as { id: string }).id;
    const { error: messageError } = await supabase.from("messages").insert({
      body: parsed.data.firstMessage,
      conversation_id: conversationId,
      customer_id: customerId,
      direction: "inbound",
      metadata: {
        source: "manual_test",
      },
      organization_id: profile.organizationId,
      sender_type: "customer",
      status: "sent",
    });

    if (messageError) {
      throw messageError;
    }

    await supabase
      .from("customers")
      .update({ last_interaction_at: now })
      .eq("organization_id", profile.organizationId)
      .eq("id", customerId);

    return "Conversa manual criada com sucesso.";
  });
}

export async function sendManualReplyAction(
  _previousState: ConversationActionState,
  formData: FormData,
): Promise<ConversationActionState> {
  const parsed = parseManualReplyForm(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Digite uma resposta valida.",
      status: "error",
    };
  }

  return saveConversationMutation(async () => {
    const profile = await requireOrganizationRole(["owner", "admin", "agent"]);
    const supabase = await createSupabaseServerClient();
    const conversation = await requireConversation(
      supabase,
      profile.organizationId,
      parsed.data.conversationId,
    );
    const now = new Date().toISOString();

    await assertCanUseFeature({
      feature: "humanHandoff",
      organizationId: profile.organizationId,
      planSlug: profile.organization.planSlug,
      supabase,
    });

    const { error: messageError } = await supabase.from("messages").insert({
      body: parsed.data.message,
      conversation_id: conversation.id,
      customer_id: conversation.customer_id,
      direction: "outbound",
      metadata: {
        source: "manual_agent_reply",
      },
      organization_id: profile.organizationId,
      sender_profile_id: profile.id,
      sender_type: "user",
      status: "sent",
    });

    if (messageError) {
      throw messageError;
    }

    const { error: conversationError } = await supabase
      .from("conversations")
      .update({
        assigned_profile_id: profile.id,
        last_message_at: now,
        status: "waiting_customer",
      })
      .eq("organization_id", profile.organizationId)
      .eq("id", conversation.id);

    if (conversationError) {
      throw conversationError;
    }

    if (conversation.customer_id) {
      await supabase
        .from("customers")
        .update({ last_interaction_at: now })
        .eq("organization_id", profile.organizationId)
        .eq("id", conversation.customer_id);
    }

    return "Resposta manual enviada.";
  });
}

export async function assumeConversationAction(formData: FormData): Promise<void> {
  const parsed = parseConversationIdForm(formData);

  if (!parsed.success || !isSupabaseConfigured()) {
    return;
  }

  try {
    const profile = await requireOrganizationRole(["owner", "admin", "agent"]);
    const supabase = await createSupabaseServerClient();
    const conversation = await requireConversation(
      supabase,
      profile.organizationId,
      parsed.data.conversationId,
    );

    await assertCanUseFeature({
      feature: "humanHandoff",
      organizationId: profile.organizationId,
      planSlug: profile.organization.planSlug,
      supabase,
    });

    const activeHandoff = await getActiveHandoff(
      supabase,
      profile.organizationId,
      conversation.id,
    );

    if (activeHandoff) {
      const { error } = await supabase
        .from("human_handoffs")
        .update({
          assigned_profile_id: profile.id,
          status: "assigned",
        })
        .eq("organization_id", profile.organizationId)
        .eq("id", activeHandoff.id);

      if (error) {
        throw error;
      }
    } else {
      const { error } = await supabase.from("human_handoffs").insert({
        assigned_profile_id: profile.id,
        conversation_id: conversation.id,
        customer_id: conversation.customer_id,
        metadata: {
          source: "manual_takeover",
        },
        organization_id: profile.organizationId,
        reason: "Atendente assumiu pelo painel.",
        status: "assigned",
      });

      if (error) {
        throw error;
      }
    }

    const { error: conversationError } = await supabase
      .from("conversations")
      .update({
        assigned_profile_id: profile.id,
        status: "waiting_human",
      })
      .eq("organization_id", profile.organizationId)
      .eq("id", conversation.id);

    if (conversationError) {
      throw conversationError;
    }

    revalidatePath(conversationsPath);
  } catch {
    // The UI remains unchanged when authorization or mutation fails.
  }
}

export async function returnConversationToAiAction(formData: FormData): Promise<void> {
  const parsed = parseConversationIdForm(formData);

  if (!parsed.success || !isSupabaseConfigured()) {
    return;
  }

  try {
    const profile = await requireOrganizationRole(["owner", "admin", "agent"]);
    const supabase = await createSupabaseServerClient();
    const conversation = await requireConversation(
      supabase,
      profile.organizationId,
      parsed.data.conversationId,
    );

    await supabase
      .from("human_handoffs")
      .update({
        resolved_at: new Date().toISOString(),
        status: "resolved",
      })
      .eq("organization_id", profile.organizationId)
      .eq("conversation_id", conversation.id)
      .in("status", ["open", "assigned"]);

    const { error: conversationError } = await supabase
      .from("conversations")
      .update({
        assigned_profile_id: null,
        status: "open",
      })
      .eq("organization_id", profile.organizationId)
      .eq("id", conversation.id);

    if (conversationError) {
      throw conversationError;
    }

    revalidatePath(conversationsPath);
  } catch {
    // The UI remains unchanged when authorization or mutation fails.
  }
}

async function saveConversationMutation(
  mutation: () => Promise<string>,
): Promise<ConversationActionState> {
  if (!isSupabaseConfigured()) {
    return {
      message: "Supabase nao esta configurado neste ambiente.",
      status: "error",
    };
  }

  try {
    const message = await mutation();
    revalidatePath(conversationsPath);

    return {
      message,
      status: "success",
    };
  } catch (error) {
    if (error instanceof BillingPolicyError) {
      return {
        message: getBillingPolicyMessage(error),
        status: "error",
      };
    }

    return {
      message:
        "Nao foi possivel salvar. Verifique permissao, tenant ativo e dados obrigatorios.",
      status: "error",
    };
  }
}

async function findOrCreateCustomer({
  customerName,
  customerPhone,
  organizationId,
  supabase,
}: {
  customerName: string;
  customerPhone: string;
  organizationId: string;
  supabase: SupabaseServerClient;
}) {
  const normalizedPhone = customerPhone.trim();

  if (normalizedPhone) {
    const { data, error } = await supabase
      .from("customers")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const existingCustomer = data as CustomerRow | null;

    if (existingCustomer) {
      return existingCustomer.id;
    }
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      lifecycle_status: "new",
      name: customerName,
      organization_id: organizationId,
      phone: normalizedPhone || null,
      source: "manual",
      tags: ["teste-manual"],
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return (data as CustomerRow).id;
}

async function requireConversation(
  supabase: SupabaseServerClient,
  organizationId: string,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id,customer_id,status")
    .eq("organization_id", organizationId)
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Conversation not found");
  }

  return data as ConversationRow;
}

async function getActiveHandoff(
  supabase: SupabaseServerClient,
  organizationId: string,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("human_handoffs")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("conversation_id", conversationId)
    .in("status", ["open", "assigned"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as HandoffRow | null;
}
