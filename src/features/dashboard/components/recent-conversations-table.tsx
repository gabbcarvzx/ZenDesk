import { Badge } from "@/components/ui/badge";
import type { RecentConversation } from "@/features/dashboard/types";

type RecentConversationsTableProps = {
  conversations: RecentConversation[];
};

export function RecentConversationsTable({ conversations }: RecentConversationsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="hidden grid-cols-[1fr_150px_140px_120px] bg-surface-muted px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted md:grid">
        <span>Cliente</span>
        <span>Intencao</span>
        <span>Status</span>
        <span>Ultima acao</span>
      </div>
      <div className="divide-y divide-border">
        {conversations.map((conversation) => (
          <div
            className="grid gap-4 px-4 py-4 text-sm md:grid-cols-[1fr_150px_140px_120px] md:items-center"
            key={conversation.id}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">{conversation.customerName}</p>
                <span className="rounded-md bg-[#eef2f6] px-2 py-1 text-xs font-medium text-muted">
                  {conversation.channel}
                </span>
                {conversation.requiresHuman ? (
                  <Badge className="bg-[#fff1f0] text-danger">Humano</Badge>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-muted">{conversation.lastMessage}</p>
            </div>
            <span className="font-medium text-foreground">{conversation.intent}</span>
            <span className="text-muted">{conversation.status}</span>
            <span className="font-mono text-xs text-muted">{conversation.lastActivity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
