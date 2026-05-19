export type DashboardMetricTone = "primary" | "success" | "warning" | "danger" | "neutral";

export type DashboardMetric = {
  label: string;
  value: string;
  description: string;
  trend: string;
  tone: DashboardMetricTone;
};

export type MessageVolumePoint = {
  day: string;
  shortLabel: string;
  messages: number;
};

export type RecentConversation = {
  id: string;
  customerName: string;
  channel: "WhatsApp" | "Manual" | "Web";
  status: string;
  intent: string;
  lastMessage: string;
  lastActivity: string;
  requiresHuman: boolean;
};

export type DashboardOverviewData = {
  organizationName: string;
  periodLabel: string;
  metrics: DashboardMetric[];
  messageVolume: MessageVolumePoint[];
  recentConversations: RecentConversation[];
};
