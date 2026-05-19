import { isSupabaseConfigured } from "@/lib/env";
import { checkFeatureAccess } from "@/lib/billing/policy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentTenantProfile } from "@/lib/tenant.server";
import {
  parseAppointmentDate,
  parseAppointmentView,
  toDateInputValue,
} from "@/features/appointments/schema";
import type {
  Appointment,
  AppointmentCustomerOption,
  AppointmentsPageData,
  AppointmentServiceOption,
  AppointmentStatus,
  AppointmentViewMode,
} from "@/features/appointments/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type AppointmentRow = {
  conversation_id: string | null;
  customer_id: string;
  id: string;
  notes: string | null;
  scheduled_end_at: string | null;
  scheduled_start_at: string;
  service_id: string | null;
  status: AppointmentStatus | "requested" | "no_show";
};

type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
};

type ServiceRow = {
  duration_minutes: number | null;
  id: string;
  name: string;
  price_cents: number;
  status: "active" | "inactive";
};

export async function getAppointmentsPageData({
  date: rawDate,
  view: rawView,
}: {
  date?: string;
  view?: string;
} = {}): Promise<AppointmentsPageData> {
  const view = parseAppointmentView(rawView);
  const date = parseAppointmentDate(rawDate);
  const range = getAppointmentRange(date, view);

  if (!isSupabaseConfigured()) {
    return emptyAppointmentsPageData({
      date,
      loadError:
        "Supabase ainda nao esta configurado. Configure o ambiente para usar a agenda.",
      range,
      view,
    });
  }

  try {
    const profile = await getCurrentTenantProfile();

    if (!profile) {
      return emptyAppointmentsPageData({
        date,
        loadError:
          "Entre com uma conta vinculada a uma organizacao para acessar a agenda.",
        range,
        view,
      });
    }

    const supabase = await createSupabaseServerClient();
    const canManage = checkFeatureAccess({
      feature: "appointments",
      planSlug: profile.organization.planSlug,
    }).allowed;
    const [appointments, customers, services] = await Promise.all([
      getAppointments({
        organizationId: profile.organizationId,
        rangeEnd: range.end.toISOString(),
        rangeStart: range.start.toISOString(),
        supabase,
      }),
      getCustomerOptions(supabase, profile.organizationId),
      getServiceOptions(supabase, profile.organizationId),
    ]);

    return {
      appointments,
      canManage,
      customers,
      date,
      rangeEnd: range.end.toISOString(),
      rangeLabel: formatRangeLabel(range.start, range.end, view),
      rangeStart: range.start.toISOString(),
      services,
      view,
    };
  } catch {
    return emptyAppointmentsPageData({
      date,
      loadError:
        "Nao foi possivel carregar a agenda. Verifique permissao e configuracao do Supabase.",
      range,
      view,
    });
  }
}

async function getAppointments({
  organizationId,
  rangeEnd,
  rangeStart,
  supabase,
}: {
  organizationId: string;
  rangeEnd: string;
  rangeStart: string;
  supabase: SupabaseServerClient;
}): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("id,customer_id,service_id,conversation_id,scheduled_start_at,scheduled_end_at,status,notes")
    .eq("organization_id", organizationId)
    .gte("scheduled_start_at", rangeStart)
    .lt("scheduled_start_at", rangeEnd)
    .order("scheduled_start_at", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as AppointmentRow[];
  const customerIds = uniqueStrings(rows.map((appointment) => appointment.customer_id));
  const serviceIds = uniqueStrings(rows.map((appointment) => appointment.service_id));
  const [customerById, serviceById] = await Promise.all([
    getCustomersById(supabase, organizationId, customerIds),
    getServicesById(supabase, organizationId, serviceIds),
  ]);

  return rows.map((row) => ({
    conversationId: row.conversation_id,
    customer: customerById.get(row.customer_id) ?? null,
    customerId: row.customer_id,
    endAt: row.scheduled_end_at,
    id: row.id,
    notes: row.notes,
    service: row.service_id ? serviceById.get(row.service_id) ?? null : null,
    serviceId: row.service_id,
    startAt: row.scheduled_start_at,
    status: normalizeAppointmentStatus(row.status),
  }));
}

async function getCustomerOptions(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<AppointmentCustomerOption[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("id,name,phone")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })
    .limit(250);

  if (error) {
    throw error;
  }

  return ((data ?? []) as CustomerRow[]).map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
  }));
}

async function getServiceOptions(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<AppointmentServiceOption[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id,name,duration_minutes,price_cents,status")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })
    .limit(250);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ServiceRow[]).map(mapServiceRow);
}

async function getCustomersById(
  supabase: SupabaseServerClient,
  organizationId: string,
  customerIds: string[],
) {
  if (!customerIds.length) {
    return new Map<string, AppointmentCustomerOption>();
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id,name,phone")
    .eq("organization_id", organizationId)
    .in("id", customerIds);

  if (error) {
    throw error;
  }

  return new Map(
    ((data ?? []) as CustomerRow[]).map((customer) => [
      customer.id,
      {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
      },
    ]),
  );
}

async function getServicesById(
  supabase: SupabaseServerClient,
  organizationId: string,
  serviceIds: string[],
) {
  if (!serviceIds.length) {
    return new Map<string, AppointmentServiceOption>();
  }

  const { data, error } = await supabase
    .from("services")
    .select("id,name,duration_minutes,price_cents,status")
    .eq("organization_id", organizationId)
    .in("id", serviceIds);

  if (error) {
    throw error;
  }

  return new Map(((data ?? []) as ServiceRow[]).map((service) => [service.id, mapServiceRow(service)]));
}

function getAppointmentRange(dateValue: string, view: AppointmentViewMode) {
  const date = new Date(`${dateValue}T00:00:00`);
  const start = new Date(date);

  if (view === "week") {
    const day = start.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + mondayOffset);
  }

  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + (view === "week" ? 7 : 1));

  return { end, start };
}

function formatRangeLabel(start: Date, end: Date, view: AppointmentViewMode) {
  if (view === "day") {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "full",
    }).format(start);
  }

  const lastDay = new Date(end);
  lastDay.setDate(lastDay.getDate() - 1);

  return `${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(start)} ate ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(lastDay)}`;
}

function emptyAppointmentsPageData({
  date,
  loadError,
  range,
  view,
}: {
  date: string;
  loadError: string;
  range: { end: Date; start: Date };
  view: AppointmentViewMode;
}): AppointmentsPageData {
  return {
    appointments: [],
    canManage: false,
    customers: [],
    date,
    loadError,
    rangeEnd: range.end.toISOString(),
    rangeLabel: formatRangeLabel(range.start, range.end, view),
    rangeStart: range.start.toISOString(),
    services: [],
    view,
  };
}

function mapServiceRow(row: ServiceRow): AppointmentServiceOption {
  return {
    durationMinutes: row.duration_minutes,
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
    status: row.status,
  };
}

function normalizeAppointmentStatus(status: AppointmentRow["status"]): AppointmentStatus {
  if (status === "confirmed" || status === "canceled" || status === "completed") {
    return status;
  }

  return "scheduled";
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function getAdjacentDate(date: string, view: AppointmentViewMode, direction: -1 | 1) {
  const current = new Date(`${date}T00:00:00`);
  current.setDate(current.getDate() + direction * (view === "week" ? 7 : 1));

  return toDateInputValue(current);
}
