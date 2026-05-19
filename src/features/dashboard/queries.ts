import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentTenantProfile } from "@/lib/tenant.server";
import { mockDashboardOverview } from "@/features/dashboard/mock-data";
import type {
  DashboardOverviewData,
  MessageVolumePoint,
  RecentConversation,
} from "@/features/dashboard/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type ConversationRow = {
  channel: "manual" | "whatsapp" | "web";
  created_at: string;
  customer_id: string | null;
  id: string;
  last_message_at: string | null;
  status: "open" | "waiting_customer" | "waiting_human" | "closed";
};

type CustomerRow = {
  id: string;
  lifecycle_status?: string | null;
  name: string;
};

type MessageRow = {
  body: string;
  conversation_id: string;
  created_at: string;
};

type PaymentRow = {
  amount_cents: number;
  status: string;
};

type HandoffRow = {
  conversation_id: string;
};

export async function getDashboardOverview(): Promise<DashboardOverviewData> {
  if (!isSupabaseConfigured()) {
    return mockDashboardOverview;
  }

  const profile = await getCurrentTenantProfile();

  if (!profile) {
    return mockDashboardOverview;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const organizationId = profile.organizationId;
    const [
      totalConversations,
      totalCustomers,
      activeLeads,
      todayAppointments,
      pendingPayments,
      openHandoffs,
      messageVolume,
      recentConversations,
    ] = await Promise.all([
      getTableCount(supabase, "conversations", organizationId),
      getTableCount(supabase, "customers", organizationId),
      getActiveLeadCount(supabase, organizationId),
      getTodayAppointmentCount(supabase, organizationId),
      getPendingPayments(supabase, organizationId),
      getOpenHandoffCount(supabase, organizationId),
      getMessageVolume(supabase, organizationId),
      getRecentConversations(supabase, organizationId),
    ]);

    return {
      organizationName: profile.organization.name,
      periodLabel: "Últimos 7 dias",
      messageVolume,
      metrics: [
        {
          description: "Conversas registradas para este tenant.",
          label: "Total de conversas",
          tone: "primary",
          trend: "Base atual",
          value: formatNumber(totalConversations),
        },
        {
          description: "Clientes e leads salvos na organização.",
          label: "Total de clientes",
          tone: "neutral",
          trend: `${formatNumber(activeLeads)} leads ativos`,
          value: formatNumber(totalCustomers),
        },
        {
          description: "Oportunidades ainda em qualificação ou negociação.",
          label: "Leads em andamento",
          tone: "success",
          trend: "Prontos para follow-up",
          value: formatNumber(activeLeads),
        },
        {
          description: "Agenda de hoje, incluindo marcados e confirmados.",
          label: "Agendamentos do dia",
          tone: "primary",
          trend: "Operação de hoje",
          value: formatNumber(todayAppointments),
        },
        {
          description: "Valor em cobranças pendentes ou vencidas.",
          label: "Pagamentos pendentes",
          tone: "warning",
          trend: `${formatNumber(pendingPayments.count)} cobranças abertas`,
          value: formatCurrency(pendingPayments.amountCents),
        },
        {
          description: "Conversas esperando atendimento humano.",
          label: "Precisam de humano",
          tone: "danger",
          trend: "Handoffs abertos",
          value: formatNumber(openHandoffs),
        },
      ],
      recentConversations,
    };
  } catch {
    return {
      ...mockDashboardOverview,
      organizationName: profile.organization.name,
      periodLabel: "Fallback local",
    };
  }
}

async function getTableCount(
  supabase: SupabaseServerClient,
  table: "conversations" | "customers",
  organizationId: string,
) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getActiveLeadCount(supabase: SupabaseServerClient, organizationId: string) {
  const { count, error } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("lifecycle_status", ["new", "qualified", "negotiating"]);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getTodayAppointmentCount(
  supabase: SupabaseServerClient,
  organizationId: string,
) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  const { count, error } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("scheduled_start_at", start.toISOString())
    .lt("scheduled_start_at", end.toISOString())
    .in("status", ["scheduled", "confirmed"]);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getPendingPayments(supabase: SupabaseServerClient, organizationId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("amount_cents,status")
    .eq("organization_id", organizationId)
    .in("status", ["pending", "overdue"]);

  if (error) {
    throw error;
  }

  const payments = (data ?? []) as PaymentRow[];

  return {
    amountCents: payments.reduce((total, payment) => total + payment.amount_cents, 0),
    count: payments.length,
  };
}

async function getOpenHandoffCount(supabase: SupabaseServerClient, organizationId: string) {
  const { count, error } = await supabase
    .from("human_handoffs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", ["open", "assigned"]);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getMessageVolume(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<MessageVolumePoint[]> {
  const days = getLastSevenDays();
  const { data, error } = await supabase
    .from("messages")
    .select("created_at")
    .eq("organization_id", organizationId)
    .gte("created_at", days[0].start.toISOString());

  if (error) {
    throw error;
  }

  const countByDay = new Map(days.map((day) => [day.key, 0]));

  for (const message of (data ?? []) as { created_at: string }[]) {
    const key = toDateKey(new Date(message.created_at));
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  }

  return days.map((day) => ({
    day: day.label,
    messages: countByDay.get(day.key) ?? 0,
    shortLabel: day.shortLabel,
  }));
}

async function getRecentConversations(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<RecentConversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id,customer_id,channel,status,last_message_at,created_at")
    .eq("organization_id", organizationId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw error;
  }

  const conversations = (data ?? []) as ConversationRow[];
  const conversationIds = conversations.map((conversation) => conversation.id);
  const customerIds = conversations
    .map((conversation) => conversation.customer_id)
    .filter((customerId): customerId is string => Boolean(customerId));
  const [customerById, lastMessageByConversation, handoffConversationIds] =
    await Promise.all([
      getCustomersById(supabase, organizationId, customerIds),
      getLastMessagesByConversation(supabase, organizationId, conversationIds),
      getOpenHandoffConversationIds(supabase, organizationId, conversationIds),
    ]);

  return conversations.map((conversation) => {
    const customer = conversation.customer_id
      ? customerById.get(conversation.customer_id)
      : null;
    const lastMessage = lastMessageByConversation.get(conversation.id);
    const requiresHuman =
      conversation.status === "waiting_human" ||
      handoffConversationIds.has(conversation.id);

    return {
      channel: mapChannel(conversation.channel),
      customerName: customer?.name ?? "Cliente sem nome",
      id: conversation.id,
      intent: mapIntent(customer?.lifecycle_status),
      lastActivity: formatRelativeDate(conversation.last_message_at ?? conversation.created_at),
      lastMessage: lastMessage?.body ?? "Conversa sem mensagem recente.",
      requiresHuman,
      status: mapConversationStatus(conversation.status),
    };
  });
}

async function getCustomersById(
  supabase: SupabaseServerClient,
  organizationId: string,
  customerIds: string[],
) {
  if (!customerIds.length) {
    return new Map<string, CustomerRow>();
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id,name,lifecycle_status")
    .eq("organization_id", organizationId)
    .in("id", customerIds);

  if (error) {
    throw error;
  }

  return new Map(((data ?? []) as CustomerRow[]).map((customer) => [customer.id, customer]));
}

async function getLastMessagesByConversation(
  supabase: SupabaseServerClient,
  organizationId: string,
  conversationIds: string[],
) {
  if (!conversationIds.length) {
    return new Map<string, MessageRow>();
  }

  const { data, error } = await supabase
    .from("messages")
    .select("conversation_id,body,created_at")
    .eq("organization_id", organizationId)
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    throw error;
  }

  const messagesByConversation = new Map<string, MessageRow>();

  for (const message of (data ?? []) as MessageRow[]) {
    if (!messagesByConversation.has(message.conversation_id)) {
      messagesByConversation.set(message.conversation_id, message);
    }
  }

  return messagesByConversation;
}

async function getOpenHandoffConversationIds(
  supabase: SupabaseServerClient,
  organizationId: string,
  conversationIds: string[],
) {
  if (!conversationIds.length) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from("human_handoffs")
    .select("conversation_id")
    .eq("organization_id", organizationId)
    .in("conversation_id", conversationIds)
    .in("status", ["open", "assigned"]);

  if (error) {
    throw error;
  }

  return new Set(((data ?? []) as HandoffRow[]).map((handoff) => handoff.conversation_id));
}

function getLastSevenDays() {
  const formatter = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });
  const shortFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      key: toDateKey(date),
      label: capitalize(formatter.format(date)),
      shortLabel: capitalize(shortFormatter.format(date).replace(".", "")),
      start: date,
    };
  });
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function mapChannel(channel: ConversationRow["channel"]): RecentConversation["channel"] {
  if (channel === "whatsapp") {
    return "WhatsApp";
  }

  if (channel === "web") {
    return "Web";
  }

  return "Manual";
}

function mapConversationStatus(status: ConversationRow["status"]) {
  const labels: Record<ConversationRow["status"], string> = {
    closed: "Finalizada",
    open: "Aberta",
    waiting_customer: "Aguardando cliente",
    waiting_human: "Aguardando humano",
  };

  return labels[status];
}

function mapIntent(lifecycleStatus?: string | null) {
  if (lifecycleStatus === "qualified" || lifecycleStatus === "negotiating") {
    return "Venda";
  }

  if (lifecycleStatus === "customer") {
    return "Cliente";
  }

  if (lifecycleStatus === "inactive" || lifecycleStatus === "lost") {
    return "Recuperação";
  }

  return "Atendimento";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(valueInCents / 100);
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffInMinutes = Math.floor((Date.now() - date.getTime()) / 60_000);

  if (diffInMinutes < 1) {
    return "Agora";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} min`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours} h`;
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
