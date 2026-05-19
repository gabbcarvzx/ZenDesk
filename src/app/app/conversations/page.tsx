import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatPanel } from "@/features/conversations/components/chat-panel";
import { ConversationCreateForm } from "@/features/conversations/components/conversation-create-form";
import { ConversationFilters } from "@/features/conversations/components/conversation-filters";
import { ConversationList } from "@/features/conversations/components/conversation-list";
import { ConversationStatusMessage } from "@/features/conversations/components/conversation-status-message";
import { ConversationsOverview } from "@/features/conversations/components/conversations-overview";
import { ConversationsShell } from "@/features/conversations/components/conversations-shell";
import { getConversationsPageData } from "@/features/conversations/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conversas",
};

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ conversation?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const data = await getConversationsPageData({
    filter: params?.filter,
    selectedConversationId: params?.conversation,
  });

  return (
    <ConversationsShell
      description="Atenda conversas manuais, acompanhe handoffs e teste o fluxo IA-humano antes de conectar o WhatsApp real."
      title="Conversas"
    >
      {data.loadError ? (
        <ConversationStatusMessage message={data.loadError} tone="error" />
      ) : null}
      <ConversationsOverview conversations={data.conversations} />
      <ConversationFilters filter={data.filter} />
      <div className="grid gap-6 xl:grid-cols-[minmax(340px,0.78fr)_minmax(0,1.22fr)]">
        <div className="space-y-6">
          <ConversationCreateForm canManage={data.canManage} />
          <Card>
            <CardHeader>
              <CardTitle>Fila de conversas</CardTitle>
              <CardDescription>
                Conversas filtradas por status e isoladas por organization_id.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConversationList
                conversations={data.conversations}
                filter={data.filter}
                selectedConversationId={data.selectedConversation?.id}
              />
            </CardContent>
          </Card>
        </div>
        <ChatPanel canManage={data.canManage} conversation={data.selectedConversation} />
      </div>
    </ConversationsShell>
  );
}
