export type CustomerStatus = "lead" | "customer" | "inactive";

export type CustomerLifecycleStatusRow =
  | "new"
  | "qualified"
  | "negotiating"
  | "customer"
  | "lost"
  | "inactive";

export type Customer = {
  createdAt: string;
  email: string | null;
  id: string;
  lastContactAt: string | null;
  name: string;
  notes: string | null;
  phone: string | null;
  source: string;
  status: CustomerStatus;
  tags: string[];
};

export type CustomerConversationMessage = {
  body: string;
  createdAt: string;
  id: string;
  senderType: "customer" | "user" | "ai" | "system";
};

export type CustomerConversation = {
  channel: "manual" | "whatsapp" | "web";
  createdAt: string;
  id: string;
  lastMessageAt: string | null;
  messages: CustomerConversationMessage[];
  status: "open" | "waiting_customer" | "waiting_human" | "closed";
};

export type CustomerAppointment = {
  endAt: string | null;
  id: string;
  notes: string | null;
  serviceName: string | null;
  startAt: string;
  status:
    | "requested"
    | "scheduled"
    | "confirmed"
    | "completed"
    | "canceled"
    | "no_show";
};

export type CustomersPageData = {
  appointments: CustomerAppointment[];
  canManage: boolean;
  conversations: CustomerConversation[];
  customers: Customer[];
  loadError?: string;
  search: string;
  selectedCustomer: Customer | null;
};
