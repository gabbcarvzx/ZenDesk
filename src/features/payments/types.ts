import type {
  PaymentProviderChargeStatus,
  PaymentProviderMethod,
} from "@/lib/billing/payment-provider";

export type PaymentStatus = PaymentProviderChargeStatus;

export type PaymentDatabaseStatus =
  | "pending"
  | "paid"
  | "overdue"
  | "canceled"
  | "refunded"
  | "failed";

export type PaymentMethod = PaymentProviderMethod;

export type PaymentCustomerOption = {
  email: string | null;
  id: string;
  name: string;
  phone: string | null;
};

export type PaymentConversationSummary = {
  channel: "manual" | "whatsapp" | "web";
  createdAt: string;
  customerId: string | null;
  customerName: string | null;
  id: string;
  lastMessageAt: string | null;
  status: "open" | "waiting_customer" | "waiting_human" | "closed";
};

export type Payment = {
  amountCents: number;
  conversation: PaymentConversationSummary | null;
  conversationId: string | null;
  createdAt: string;
  currency: string;
  customer: PaymentCustomerOption | null;
  customerId: string;
  description: string | null;
  dueAt: string | null;
  id: string;
  method: PaymentMethod;
  paidAt: string | null;
  provider: string;
  providerPaymentId: string | null;
  status: PaymentStatus;
};

export type PaymentsPageData = {
  canManage: boolean;
  conversations: PaymentConversationSummary[];
  customers: PaymentCustomerOption[];
  loadError?: string;
  payments: Payment[];
};
