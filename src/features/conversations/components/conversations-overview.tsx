import { Bot, CheckCircle2, Handshake } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { ConversationListItem } from "@/features/conversations/types";

export function ConversationsOverview({
  conversations,
}: {
  conversations: ConversationListItem[];
}) {
  const aiCount = conversations.filter((conversation) => conversation.ownerMode === "ai").length;
  const humanCount = conversations.filter(
    (conversation) => conversation.ownerMode === "human",
  ).length;
  const closedCount = conversations.filter(
    (conversation) => conversation.status === "closed",
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        description="Conversas no filtro atual"
        icon={<Bot aria-hidden="true" className="size-5" />}
        label="Com IA"
        value={String(aiCount)}
      />
      <MetricCard
        description="Atendimento humano ativo ou solicitado"
        icon={<Handshake aria-hidden="true" className="size-5" />}
        label="Com humano"
        value={String(humanCount)}
      />
      <MetricCard
        description="Finalizadas no filtro atual"
        icon={<CheckCircle2 aria-hidden="true" className="size-5" />}
        label="Finalizadas"
        value={String(closedCount)}
      />
    </div>
  );
}

function MetricCard({
  description,
  icon,
  label,
  value,
}: {
  description: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
          <p className="mt-2 text-sm text-muted">{description}</p>
        </div>
        <span className="rounded-lg bg-[#e5f2ee] p-2 text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}
