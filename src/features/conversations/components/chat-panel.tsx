import { Bot, UserRound } from "lucide-react";
import {
  ConversationOwnerBadge,
  ConversationStatusBadge,
  formatChannel,
  formatDateTime,
} from "@/features/conversations/components/conversation-badges";
import { ConversationActions } from "@/features/conversations/components/conversation-actions";
import { ManualReplyForm } from "@/features/conversations/components/manual-reply-form";
import type {
  ConversationDetail,
  ConversationMessage,
} from "@/features/conversations/types";
import { cn } from "@/lib/utils";

export function ChatPanel({
  canManage,
  conversation,
}: {
  canManage: boolean;
  conversation: ConversationDetail | null;
}) {
  if (!conversation) {
    return (
      <section className="rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-[#e5f2ee] text-primary">
          <Bot aria-hidden="true" className="size-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          Nenhuma conversa selecionada
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          Crie uma conversa manual ou selecione uma conversa da lista para abrir o chat.
        </p>
      </section>
    );
  }

  const customerName = conversation.customer?.name ?? "Contato sem cadastro";
  const replyDisabled = conversation.status === "closed";

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <header className="border-b border-border bg-surface px-5 py-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <UserRound aria-hidden="true" className="size-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{customerName}</h3>
              <ConversationOwnerBadge ownerMode={conversation.ownerMode} />
              <ConversationStatusBadge status={conversation.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
              <span>{formatChannel(conversation.channel)}</span>
              <span>{conversation.customer?.phone || "Sem telefone"}</span>
              <span>{conversation.customer?.email || "Sem email"}</span>
            </div>
            {conversation.activeHandoff ? (
              <p className="mt-2 text-sm text-muted">
                Handoff humano:{" "}
                {conversation.activeHandoff.assignedProfileName ?? "sem responsavel"}.
              </p>
            ) : null}
          </div>
          <ConversationActions canManage={canManage} conversation={conversation} />
        </div>
      </header>

      <div className="flex max-h-[620px] min-h-[420px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto bg-[#f8faf9] px-4 py-5">
          {conversation.messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
              Esta conversa ainda nao tem mensagens.
            </div>
          ) : (
            conversation.messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))
          )}
        </div>
        <div className="border-t border-border bg-surface p-4">
          <ManualReplyForm
            canManage={canManage}
            conversationId={conversation.id}
            disabled={replyDisabled}
          />
        </div>
      </div>
    </section>
  );
}

function ChatBubble({ message }: { message: ConversationMessage }) {
  const isInbound = message.direction === "inbound";
  const sender = formatSender(message);

  return (
    <div className={cn("flex", isInbound ? "justify-start" : "justify-end")}>
      <article
        className={cn(
          "max-w-[86%] rounded-lg border px-4 py-3 shadow-sm md:max-w-[72%]",
          isInbound
            ? "border-border bg-surface text-foreground"
            : "border-primary/20 bg-[#e5f2ee] text-foreground",
        )}
      >
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            {sender}
          </span>
          <span className="font-mono text-xs text-muted">
            {formatDateTime(message.createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
      </article>
    </div>
  );
}

function formatSender(message: ConversationMessage) {
  if (message.senderType === "ai") {
    return "IA";
  }

  if (message.senderType === "user") {
    return message.senderProfileName ?? "Atendente";
  }

  if (message.senderType === "system") {
    return "Sistema";
  }

  return "Cliente";
}
