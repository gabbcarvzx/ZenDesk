import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentTenantProfile } from "@/lib/tenant.server";
import { mapCustomerStatusFromRow } from "@/features/customers/schema";
import type {
  Customer,
  CustomerAppointment,
  CustomerConversation,
  CustomerConversationMessage,
  CustomerLifecycleStatusRow,
  CustomersPageData,
} from "@/features/customers/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type CustomerRow = {
  created_at: string;
  email: string | null;
  id: string;
  last_interaction_at: string | null;
  lifecycle_status: CustomerLifecycleStatusRow;
  name: string;
  notes: string | null;
  phone: string | null;
  source: string;
  tags: string[] | null;
};

type ConversationRow = {
  channel: CustomerConversation["channel"];
  created_at: string;
  id: string;
  last_message_at: string | null;
  status: CustomerConversation["status"];
};

type MessageRow = {
  body: string;
  conversation_id: string;
  created_at: string;
  id: string;
  sender_type: CustomerConversationMessage["senderType"];
};

type AppointmentRow = {
  id: string;
  notes: string | null;
  scheduled_end_at: string | null;
  scheduled_start_at: string;
  service_id: string | null;
  status: CustomerAppointment["status"];
};

type ServiceRow = {
  id: string;
  name: string;
};

export async function getCustomersPageData({
  search,
  selectedCustomerId,
}: {
  search?: string;
  selectedCustomerId?: string;
} = {}): Promise<CustomersPageData> {
  const normalizedSearch = (search ?? "").trim();

  if (!isSupabaseConfigured()) {
    return emptyCustomersPageData({
      loadError:
        "Supabase ainda nao esta configurado. Configure as variaveis de ambiente para usar clientes.",
      search: normalizedSearch,
    });
  }

  try {
    const profile = await getCurrentTenantProfile();

    if (!profile) {
      return emptyCustomersPageData({
        loadError:
          "Entre com uma conta vinculada a uma organizacao para acessar clientes.",
        search: normalizedSearch,
      });
    }

    const supabase = await createSupabaseServerClient();
    const customers = await getCustomers({
      organizationId: profile.organizationId,
      search: normalizedSearch,
      supabase,
    });
    const selectedCustomer =
      customers.find((customer) => customer.id === selectedCustomerId) ??
      customers[0] ??
      null;

    if (!selectedCustomer) {
      return {
        appointments: [],
        canManage: true,
        conversations: [],
        customers,
        search: normalizedSearch,
        selectedCustomer: null,
      };
    }

    const [conversations, appointments] = await Promise.all([
      getCustomerConversations({
        customerId: selectedCustomer.id,
        organizationId: profile.organizationId,
        supabase,
      }),
      getCustomerAppointments({
        customerId: selectedCustomer.id,
        organizationId: profile.organizationId,
        supabase,
      }),
    ]);

    return {
      appointments,
      canManage: true,
      conversations,
      customers,
      search: normalizedSearch,
      selectedCustomer,
    };
  } catch {
    return emptyCustomersPageData({
      loadError:
        "Nao foi possivel carregar clientes. Verifique permissao e configuracao do Supabase.",
      search: normalizedSearch,
    });
  }
}

async function getCustomers({
  organizationId,
  search,
  supabase,
}: {
  organizationId: string;
  search: string;
  supabase: SupabaseServerClient;
}): Promise<Customer[]> {
  let query = supabase
    .from("customers")
    .select(
      "id,name,phone,email,source,lifecycle_status,tags,notes,last_interaction_at,created_at",
    )
    .eq("organization_id", organizationId)
    .order("last_interaction_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(80);

  if (search) {
    const term = sanitizeSearchTerm(search);
    query = query.or(
      `name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return ((data ?? []) as CustomerRow[]).map(mapCustomerRow);
}

async function getCustomerConversations({
  customerId,
  organizationId,
  supabase,
}: {
  customerId: string;
  organizationId: string;
  supabase: SupabaseServerClient;
}): Promise<CustomerConversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id,channel,status,last_message_at,created_at")
    .eq("organization_id", organizationId)
    .eq("customer_id", customerId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    throw error;
  }

  const conversations = (data ?? []) as ConversationRow[];
  const conversationIds = conversations.map((conversation) => conversation.id);

  if (!conversationIds.length) {
    return [];
  }

  const { data: messagesData, error: messagesError } = await supabase
    .from("messages")
    .select("id,conversation_id,sender_type,body,created_at")
    .eq("organization_id", organizationId)
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true })
    .limit(80);

  if (messagesError) {
    throw messagesError;
  }

  const messagesByConversation = new Map<string, CustomerConversationMessage[]>();

  for (const message of (messagesData ?? []) as MessageRow[]) {
    const list = messagesByConversation.get(message.conversation_id) ?? [];
    list.push({
      body: message.body,
      createdAt: message.created_at,
      id: message.id,
      senderType: message.sender_type,
    });
    messagesByConversation.set(message.conversation_id, list);
  }

  return conversations.map((conversation) => ({
    channel: conversation.channel,
    createdAt: conversation.created_at,
    id: conversation.id,
    lastMessageAt: conversation.last_message_at,
    messages: (messagesByConversation.get(conversation.id) ?? []).slice(-6),
    status: conversation.status,
  }));
}

async function getCustomerAppointments({
  customerId,
  organizationId,
  supabase,
}: {
  customerId: string;
  organizationId: string;
  supabase: SupabaseServerClient;
}): Promise<CustomerAppointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("id,service_id,scheduled_start_at,scheduled_end_at,status,notes")
    .eq("organization_id", organizationId)
    .eq("customer_id", customerId)
    .order("scheduled_start_at", { ascending: false })
    .limit(12);

  if (error) {
    throw error;
  }

  const appointments = (data ?? []) as AppointmentRow[];
  const serviceIds = Array.from(
    new Set(
      appointments
        .map((appointment) => appointment.service_id)
        .filter((serviceId): serviceId is string => Boolean(serviceId)),
    ),
  );
  const serviceNameById = serviceIds.length
    ? await getServiceNameById(supabase, organizationId, serviceIds)
    : new Map<string, string>();

  return appointments.map((appointment) => ({
    endAt: appointment.scheduled_end_at,
    id: appointment.id,
    notes: appointment.notes,
    serviceName: appointment.service_id
      ? serviceNameById.get(appointment.service_id) ?? null
      : null,
    startAt: appointment.scheduled_start_at,
    status: appointment.status,
  }));
}

async function getServiceNameById(
  supabase: SupabaseServerClient,
  organizationId: string,
  serviceIds: string[],
) {
  const { data, error } = await supabase
    .from("services")
    .select("id,name")
    .eq("organization_id", organizationId)
    .in("id", serviceIds);

  if (error) {
    throw error;
  }

  return new Map(((data ?? []) as ServiceRow[]).map((service) => [service.id, service.name]));
}

function emptyCustomersPageData({
  loadError,
  search,
}: {
  loadError: string;
  search: string;
}): CustomersPageData {
  return {
    appointments: [],
    canManage: false,
    conversations: [],
    customers: [],
    loadError,
    search,
    selectedCustomer: null,
  };
}

function mapCustomerRow(row: CustomerRow): Customer {
  return {
    createdAt: row.created_at,
    email: row.email,
    id: row.id,
    lastContactAt: row.last_interaction_at,
    name: row.name,
    notes: row.notes,
    phone: row.phone,
    source: row.source,
    status: mapCustomerStatusFromRow(row.lifecycle_status),
    tags: row.tags ?? [],
  };
}

function sanitizeSearchTerm(search: string) {
  return search.replace(/[%,]/g, " ").trim();
}
