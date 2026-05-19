import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentTenantProfile } from "@/lib/tenant.server";
import { parseConversationFilter } from "@/features/conversations/schema";
import type {
  ActiveHandoff,
  ConversationChannel,
  ConversationCustomer,
  ConversationDetail,
  ConversationFilter,
  ConversationListItem,
  ConversationStatus,
  ConversationsPageData,
  HandoffStatus,
  MessageDirection,
  MessageSenderType,
} from "@/features/conversations/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type ConversationRow = {
  assigned_profile_id: string | null;
  channel: ConversationChannel;
  created_at: string;
  customer_id: string | null;
  id: string;
  last_message_at: string | null;
  status: ConversationStatus;
};

type CustomerRow = {
  email: string | null;
  id: string;
  name: string;
  phone: string | null;
};

type HandoffRow = {
  assigned_profile_id: string | null;
  conversation_id: string;
  id: string;
  reason: string | null;
  status: HandoffStatus;
};

type ProfileRow = {
  full_name: string | null;
  id: string;
};

type ListMessageRow = {
  body: string;
  conversation_id: string;
  created_at: string;
};

type DetailMessageRow = {
  body: string;
  created_at: string;
  direction: MessageDirection;
  id: string;
  sender_profile_id: string | null;
  sender_type: MessageSenderType;
};

export async function getConversationsPageData({
  filter: rawFilter,
  selectedConversationId,
}: {
  filter?: string;
  selectedConversationId?: string;
} = {}): Promise<ConversationsPageData> {
  const filter = parseConversationFilter(rawFilter);

  if (!isSupabaseConfigured()) {
    return emptyConversationsPageData({
      filter,
      loadError:
        "Supabase ainda nao esta configurado. Configure o ambiente para usar conversas.",
    });
  }

  try {
    const profile = await getCurrentTenantProfile();

    if (!profile) {
      return emptyConversationsPageData({
        filter,
        loadError:
          "Entre com uma conta vinculada a uma organizacao para acessar conversas.",
      });
    }

    const supabase = await createSupabaseServerClient();
    const conversations = await getConversationList({
      filter,
      organizationId: profile.organizationId,
      supabase,
    });
    const selectedListItem =
      conversations.find((conversation) => conversation.id === selectedConversationId) ??
      conversations[0] ??
      null;
    const selectedConversation = selectedListItem
      ? await getConversationDetail({
          conversation: selectedListItem,
          organizationId: profile.organizationId,
          supabase,
        })
      : null;

    return {
      canManage: true,
      conversations,
      filter,
      selectedConversation,
    };
  } catch {
    return emptyConversationsPageData({
      filter,
      loadError:
        "Nao foi possivel carregar conversas. Verifique permissao e configuracao do Supabase.",
    });
  }
}

async function getConversationList({
  filter,
  organizationId,
  supabase,
}: {
  filter: ConversationFilter;
  organizationId: string;
  supabase: SupabaseServerClient;
}): Promise<ConversationListItem[]> {
  let query = supabase
    .from("conversations")
    .select("id,customer_id,channel,status,assigned_profile_id,last_message_at,created_at")
    .eq("organization_id", organizationId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(80);

  if (filter === "human") {
    query = query.eq("status", "waiting_human");
  } else if (filter === "closed") {
    query = query.eq("status", "closed");
  } else {
    query = query.in("status", ["open", "waiting_customer"]);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as ConversationRow[];
  const conversationIds = rows.map((conversation) => conversation.id);
  const customerIds = uniqueStrings(rows.map((conversation) => conversation.customer_id));
  const [customerById, activeHandoffByConversation, lastMessageByConversation] =
    await Promise.all([
      getCustomersById(supabase, organizationId, customerIds),
      getActiveHandoffsByConversation(supabase, organizationId, conversationIds),
      getLastMessagesByConversation(supabase, organizationId, conversationIds),
    ]);
  const profileIds = uniqueStrings([
    ...rows.map((conversation) => conversation.assigned_profile_id),
    ...Array.from(activeHandoffByConversation.values()).map(
      (handoff) => handoff.assigned_profile_id,
    ),
  ]);
  const profileNameById = await getProfileNameById(supabase, organizationId, profileIds);

  return rows.map((row) =>
    mapConversationListItem({
      activeHandoff: activeHandoffByConversation.get(row.id) ?? null,
      customer: row.customer_id ? customerById.get(row.customer_id) ?? null : null,
      lastMessage: lastMessageByConversation.get(row.id) ?? null,
      profileNameById,
      row,
    }),
  );
}

async function getConversationDetail({
  conversation,
  organizationId,
  supabase,
}: {
  conversation: ConversationListItem;
  organizationId: string;
  supabase: SupabaseServerClient;
}): Promise<ConversationDetail> {
  const { data, error } = await supabase
    .from("messages")
    .select("id,sender_type,sender_profile_id,direction,body,created_at")
    .eq("organization_id", organizationId)
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(120);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as DetailMessageRow[];
  const profileIds = uniqueStrings(rows.map((row) => row.sender_profile_id));
  const profileNameById = await getProfileNameById(supabase, organizationId, profileIds);

  return {
    ...conversation,
    messages: rows.map((row) => ({
      body: row.body,
      createdAt: row.created_at,
      direction: row.direction,
      id: row.id,
      senderProfileName: row.sender_profile_id
        ? profileNameById.get(row.sender_profile_id) ?? null
        : null,
      senderType: row.sender_type,
    })),
  };
}

async function getCustomersById(
  supabase: SupabaseServerClient,
  organizationId: string,
  customerIds: string[],
) {
  if (!customerIds.length) {
    return new Map<string, ConversationCustomer>();
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id,name,phone,email")
    .eq("organization_id", organizationId)
    .in("id", customerIds);

  if (error) {
    throw error;
  }

  return new Map(
    ((data ?? []) as CustomerRow[]).map((customer) => [
      customer.id,
      {
        email: customer.email,
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
      },
    ]),
  );
}

async function getActiveHandoffsByConversation(
  supabase: SupabaseServerClient,
  organizationId: string,
  conversationIds: string[],
) {
  if (!conversationIds.length) {
    return new Map<string, HandoffRow>();
  }

  const { data, error } = await supabase
    .from("human_handoffs")
    .select("id,conversation_id,status,reason,assigned_profile_id")
    .eq("organization_id", organizationId)
    .in("conversation_id", conversationIds)
    .in("status", ["open", "assigned"])
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const byConversation = new Map<string, HandoffRow>();

  for (const row of (data ?? []) as HandoffRow[]) {
    if (!byConversation.has(row.conversation_id)) {
      byConversation.set(row.conversation_id, row);
    }
  }

  return byConversation;
}

async function getLastMessagesByConversation(
  supabase: SupabaseServerClient,
  organizationId: string,
  conversationIds: string[],
) {
  if (!conversationIds.length) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from("messages")
    .select("conversation_id,body,created_at")
    .eq("organization_id", organizationId)
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false })
    .limit(240);

  if (error) {
    throw error;
  }

  const byConversation = new Map<string, string>();

  for (const row of (data ?? []) as ListMessageRow[]) {
    if (!byConversation.has(row.conversation_id)) {
      byConversation.set(row.conversation_id, row.body);
    }
  }

  return byConversation;
}

async function getProfileNameById(
  supabase: SupabaseServerClient,
  organizationId: string,
  profileIds: string[],
) {
  if (!profileIds.length) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name")
    .eq("organization_id", organizationId)
    .in("id", profileIds);

  if (error) {
    throw error;
  }

  return new Map(
    ((data ?? []) as ProfileRow[]).map((profile) => [
      profile.id,
      profile.full_name || "Atendente",
    ]),
  );
}

function mapConversationListItem({
  activeHandoff,
  customer,
  lastMessage,
  profileNameById,
  row,
}: {
  activeHandoff: HandoffRow | null;
  customer: ConversationCustomer | null;
  lastMessage: string | null;
  profileNameById: Map<string, string>;
  row: ConversationRow;
}): ConversationListItem {
  const assignedProfileId = activeHandoff?.assigned_profile_id ?? row.assigned_profile_id;
  const assignedProfileName = assignedProfileId
    ? profileNameById.get(assignedProfileId) ?? null
    : null;
  const ownerMode =
    row.status === "waiting_human" || Boolean(assignedProfileId) || Boolean(activeHandoff)
      ? "human"
      : "ai";
  const handoff: ActiveHandoff | null = activeHandoff
    ? {
        assignedProfileId: activeHandoff.assigned_profile_id,
        assignedProfileName,
        id: activeHandoff.id,
        reason: activeHandoff.reason,
        status: activeHandoff.status,
      }
    : null;

  return {
    activeHandoff: handoff,
    assignedProfileId,
    assignedProfileName,
    channel: row.channel,
    createdAt: row.created_at,
    customer,
    id: row.id,
    lastMessage,
    lastMessageAt: row.last_message_at,
    ownerMode,
    status: row.status,
  };
}

function emptyConversationsPageData({
  filter,
  loadError,
}: {
  filter: ConversationFilter;
  loadError: string;
}): ConversationsPageData {
  return {
    canManage: false,
    conversations: [],
    filter,
    loadError,
    selectedConversation: null,
  };
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
