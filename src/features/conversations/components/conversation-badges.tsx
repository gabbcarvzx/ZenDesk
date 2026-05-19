import { Badge } from "@/components/ui/badge";
import type {
  ConversationChannel,
  ConversationOwnerMode,
  ConversationStatus,
} from "@/features/conversations/types";

export function ConversationStatusBadge({ status }: { status: ConversationStatus }) {
  const className =
    status === "closed"
      ? "bg-[#f3f5f7] text-muted"
      : status === "waiting_human"
        ? "bg-[#fff1f0] text-danger"
        : status === "waiting_customer"
          ? "bg-[#fff7ed] text-[#b54708]"
          : "bg-[#ecfdf3] text-[#067647]";

  return <Badge className={className}>{formatConversationStatus(status)}</Badge>;
}

export function ConversationOwnerBadge({ ownerMode }: { ownerMode: ConversationOwnerMode }) {
  return (
    <Badge
      className={
        ownerMode === "human"
          ? "bg-[#fff1f0] text-danger"
          : "bg-[#e5f2ee] text-primary"
      }
    >
      {ownerMode === "human" ? "Humano" : "IA"}
    </Badge>
  );
}

export function formatConversationStatus(status: ConversationStatus) {
  const labels = {
    closed: "Finalizada",
    open: "Aberta",
    waiting_customer: "Aguardando cliente",
    waiting_human: "Aguardando humano",
  } as const;

  return labels[status];
}

export function formatChannel(channel: ConversationChannel) {
  const labels = {
    manual: "Manual",
    web: "Web",
    whatsapp: "WhatsApp",
  } as const;

  return labels[channel];
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "sem atividade";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "sem atividade";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
