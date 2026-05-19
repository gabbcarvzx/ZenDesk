export type AppointmentViewMode = "day" | "week";

export type AppointmentStatus = "scheduled" | "confirmed" | "canceled" | "completed";

export type AppointmentCustomerOption = {
  id: string;
  name: string;
  phone: string | null;
};

export type AppointmentServiceOption = {
  durationMinutes: number | null;
  id: string;
  name: string;
  priceCents: number;
  status: "active" | "inactive";
};

export type Appointment = {
  conversationId: string | null;
  customer: AppointmentCustomerOption | null;
  customerId: string;
  endAt: string | null;
  id: string;
  notes: string | null;
  service: AppointmentServiceOption | null;
  serviceId: string | null;
  startAt: string;
  status: AppointmentStatus;
};

export type AppointmentsPageData = {
  appointments: Appointment[];
  canManage: boolean;
  customers: AppointmentCustomerOption[];
  date: string;
  loadError?: string;
  rangeEnd: string;
  rangeLabel: string;
  rangeStart: string;
  services: AppointmentServiceOption[];
  view: AppointmentViewMode;
};
