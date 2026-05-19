import Link from "next/link";
import { Bot, MessageSquareText, UserRound } from "lucide-react";
import { EmptyEducation } from "@/components/ui/empty-education";
import {
  ConversationOwnerBadge,
  ConversationStatusBadge,
  formatChannel,
  formatDateTime,
} from "@/features/conversations/components/conversation-badges";
import type {
  ConversationFilter,
  ConversationListItem,
} from "@/features/conversations/types";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function ConversationList({
  conversations,
  filter,
  selectedConversationId,
}: {
  conversations: ConversationListItem[];
  filter: ConversationFilter;
  selectedConversationId?: string;
}) {
  if (!conversations.length) {
    return (
      <EmptyEducation
        action={{ href: routes.onboarding, label: "Revisar implantacao" }}
        benefit="Conversas aparecem quando clientes entram pelo WhatsApp, web ou cadastro manual. Use este espaco para acompanhar IA e humano."
        icon={<MessageSquareText aria-hidden="true" className="size-5" />}
        title="Nenhuma conversa neste filtro"
        tutorial="Antes do go-live, use o modo demo em Treinamento para mostrar a equipe como uma conversa muda de IA para humano."
      />
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => {
        const isSelected = selectedConversationId === conversation.id;
        const customerName = conversation.customer?.name ?? "Contato sem cadastro";

        return (
          <Link
            className={cn(
              "block rounded-lg border p-4 transition",
              isSelected
                ? "border-primary bg-[#e5f2ee]"
                : "border-border bg-surface hover:bg-surface-muted",
            )}
            href={buildConversationHref(conversation.id, filter)}
            key={conversation.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <UserRound aria-hidden="true" className="size-4 text-primary" />
                  <h3 className="font-semibold text-foreground">{customerName}</h3>
                  <ConversationOwnerBadge ownerMode={conversation.ownerMode} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                  {conversation.lastMessage || "Sem mensagens registradas."}
                </p>
              </div>
              <span className="rounded-md bg-surface-muted px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {formatChannel(conversation.channel)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ConversationStatusBadge status={conversation.status} />
              {conversation.ownerMode === "human" ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-danger">
                  <MessageSquareText aria-hidden="true" className="size-3.5" />
                  {conversation.assignedProfileName ?? "Aguardando atendimento"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Bot aria-hidden="true" className="size-3.5" />
                  IA ativa
                </span>
              )}
            </div>
            <p className="mt-3 font-mono text-xs text-muted">
              {formatDateTime(conversation.lastMessageAt ?? conversation.createdAt)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

function buildConversationHref(conversationId: string, filter: ConversationFilter) {
  const params = new URLSearchParams({
    conversation: conversationId,
    filter,
  });

  return `${routes.conversations}?${params.toString()}`;
}
