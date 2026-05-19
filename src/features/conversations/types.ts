export type ConversationFilter = "open" | "human" | "closed";

export type ConversationStatus = "open" | "waiting_customer" | "waiting_human" | "closed";

export type ConversationChannel = "manual" | "whatsapp" | "web";

export type MessageDirection = "inbound" | "outbound";

export type MessageSenderType = "customer" | "user" | "ai" | "system";

export type HandoffStatus = "open" | "assigned" | "resolved" | "canceled";

export type ConversationOwnerMode = "ai" | "human";

export type ConversationCustomer = {
  email: string | null;
  id: string;
  name: string;
  phone: string | null;
};

export type ActiveHandoff = {
  assignedProfileId: string | null;
  assignedProfileName: string | null;
  id: string;
  reason: string | null;
  status: HandoffStatus;
};

export type ConversationListItem = {
  activeHandoff: ActiveHandoff | null;
  assignedProfileId: string | null;
  assignedProfileName: string | null;
  channel: ConversationChannel;
  createdAt: string;
  customer: ConversationCustomer | null;
  id: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  ownerMode: ConversationOwnerMode;
  status: ConversationStatus;
};

export type ConversationMessage = {
  body: string;
  createdAt: string;
  direction: MessageDirection;
  id: string;
  senderProfileName: string | null;
  senderType: MessageSenderType;
};

export type ConversationDetail = ConversationListItem & {
  messages: ConversationMessage[];
};

export type ConversationsPageData = {
  canManage: boolean;
  conversations: ConversationListItem[];
  filter: ConversationFilter;
  loadError?: string;
  selectedConversation: ConversationDetail | null;
};
