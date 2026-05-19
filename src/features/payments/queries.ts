import { isSupabaseConfigured } from "@/lib/env";
import { checkFeatureAccess } from "@/lib/billing/policy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentTenantProfile } from "@/lib/tenant.server";
import { mapPaymentStatusFromRow } from "@/features/payments/schema";
import type {
  PaymentConversationSummary,
  PaymentCustomerOption,
  PaymentDatabaseStatus,
  PaymentMethod,
  PaymentsPageData,
} from "@/features/payments/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type PaymentRow = {
  amount_cents: number;
  conversation_id: string | null;
  created_at: string;
  currency: string;
  customer_id: string;
  description: string | null;
  due_at: string | null;
  id: string;
  metadata: unknown;
  paid_at: string | null;
  provider: string;
  provider_payment_id: string | null;
  status: PaymentDatabaseStatus;
};

type CustomerRow = {
  email: string | null;
  id: string;
  name: string;
  phone: string | null;
};

type ConversationRow = {
  channel: PaymentConversationSummary["channel"];
  created_at: string;
  customer_id: string | null;
  id: string;
  last_message_at: string | null;
  status: PaymentConversationSummary["status"];
};

const paymentMethods: PaymentMethod[] = ["pix", "card", "cash", "other"];

export async function getPaymentsPageData(): Promise<PaymentsPageData> {
  if (!isSupabaseConfigured()) {
    return emptyPaymentsPageData(
      "Supabase ainda nao esta configurado. Configure o ambiente para usar pagamentos.",
    );
  }

  try {
    const profile = await getCurrentTenantProfile();

    if (!profile) {
      return emptyPaymentsPageData(
        "Entre com uma conta vinculada a uma organizacao para acessar pagamentos.",
      );
    }

    const supabase = await createSupabaseServerClient();
    const canManage = checkFeatureAccess({
      feature: "pixPayments",
      planSlug: profile.organization.planSlug,
    }).allowed;
    const [paymentRows, customers, conversations] = await Promise.all([
      getPaymentRows(supabase, profile.organizationId),
      getCustomerOptions(supabase, profile.organizationId),
      getConversationOptions(supabase, profile.organizationId),
    ]);
    const customerIds = uniqueStrings(paymentRows.map((payment) => payment.customer_id));
    const conversationIds = uniqueStrings(
      paymentRows.map((payment) => payment.conversation_id),
    );
    const [customerById, conversationById] = await Promise.all([
      getCustomersById(supabase, profile.organizationId, customerIds),
      getConversationsById(supabase, profile.organizationId, conversationIds),
    ]);

    return {
      canManage,
      conversations,
      customers,
      payments: paymentRows.map((row) => ({
        amountCents: row.amount_cents,
        conversation: row.conversation_id
          ? conversationById.get(row.conversation_id) ?? null
          : null,
        conversationId: row.conversation_id,
        createdAt: row.created_at,
        currency: row.currency,
        customer: customerById.get(row.customer_id) ?? null,
        customerId: row.customer_id,
        description: row.description,
        dueAt: row.due_at,
        id: row.id,
        method: getPaymentMethod(row.metadata),
        paidAt: row.paid_at,
        provider: row.provider,
        providerPaymentId: row.provider_payment_id,
        status: mapPaymentStatusFromRow(row.status),
      })),
    };
  } catch {
    return emptyPaymentsPageData(
      "Nao foi possivel carregar pagamentos. Verifique permissao e configuracao do Supabase.",
    );
  }
}

async function getPaymentRows(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(
      "id,customer_id,conversation_id,amount_cents,currency,status,provider,provider_payment_id,description,due_at,paid_at,metadata,created_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    throw error;
  }

  return (data ?? []) as PaymentRow[];
}

async function getCustomerOptions(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<PaymentCustomerOption[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("id,name,phone,email")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })
    .limit(250);

  if (error) {
    throw error;
  }

  return ((data ?? []) as CustomerRow[]).map(mapCustomerRow);
}

async function getConversationOptions(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<PaymentConversationSummary[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id,customer_id,channel,status,last_message_at,created_at")
    .eq("organization_id", organizationId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as ConversationRow[];
  const customerNameById = await getCustomerNameById(
    supabase,
    organizationId,
    uniqueStrings(rows.map((conversation) => conversation.customer_id)),
  );

  return rows.map((row) => mapConversationRow(row, customerNameById));
}

async function getCustomersById(
  supabase: SupabaseServerClient,
  organizationId: string,
  customerIds: string[],
) {
  if (!customerIds.length) {
    return new Map<string, PaymentCustomerOption>();
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
      mapCustomerRow(customer),
    ]),
  );
}

async function getConversationsById(
  supabase: SupabaseServerClient,
  organizationId: string,
  conversationIds: string[],
) {
  if (!conversationIds.length) {
    return new Map<string, PaymentConversationSummary>();
  }

  const { data, error } = await supabase
    .from("conversations")
    .select("id,customer_id,channel,status,last_message_at,created_at")
    .eq("organization_id", organizationId)
    .in("id", conversationIds);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as ConversationRow[];
  const customerNameById = await getCustomerNameById(
    supabase,
    organizationId,
    uniqueStrings(rows.map((conversation) => conversation.customer_id)),
  );

  return new Map(
    rows.map((conversation) => [
      conversation.id,
      mapConversationRow(conversation, customerNameById),
    ]),
  );
}

async function getCustomerNameById(
  supabase: SupabaseServerClient,
  organizationId: string,
  customerIds: string[],
) {
  if (!customerIds.length) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id,name")
    .eq("organization_id", organizationId)
    .in("id", customerIds);

  if (error) {
    throw error;
  }

  return new Map(((data ?? []) as CustomerRow[]).map((customer) => [customer.id, customer.name]));
}

function mapCustomerRow(row: CustomerRow): PaymentCustomerOption {
  return {
    email: row.email,
    id: row.id,
    name: row.name,
    phone: row.phone,
  };
}

function mapConversationRow(
  row: ConversationRow,
  customerNameById: Map<string, string>,
): PaymentConversationSummary {
  return {
    channel: row.channel,
    createdAt: row.created_at,
    customerId: row.customer_id,
    customerName: row.customer_id ? customerNameById.get(row.customer_id) ?? null : null,
    id: row.id,
    lastMessageAt: row.last_message_at,
    status: row.status,
  };
}

function getPaymentMethod(metadata: unknown): PaymentMethod {
  if (!isRecord(metadata) || typeof metadata.method !== "string") {
    return "other";
  }

  return paymentMethods.includes(metadata.method as PaymentMethod)
    ? (metadata.method as PaymentMethod)
    : "other";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emptyPaymentsPageData(loadError: string): PaymentsPageData {
  return {
    canManage: false,
    conversations: [],
    customers: [],
    loadError,
    payments: [],
  };
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
