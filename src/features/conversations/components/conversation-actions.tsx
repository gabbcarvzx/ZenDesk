import { Bot, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  assumeConversationAction,
  returnConversationToAiAction,
} from "@/features/conversations/actions";
import type { ConversationDetail } from "@/features/conversations/types";

export function ConversationActions({
  canManage,
  conversation,
}: {
  canManage: boolean;
  conversation: ConversationDetail;
}) {
  const isHuman = conversation.ownerMode === "human";

  return (
    <div className="flex flex-wrap gap-2">
      <form action={assumeConversationAction}>
        <input name="conversationId" type="hidden" value={conversation.id} />
        <Button
          className="gap-2"
          disabled={!canManage || isHuman || conversation.status === "closed"}
          size="sm"
          type="submit"
        >
          <Hand aria-hidden="true" className="size-4" />
          Assumir conversa
        </Button>
      </form>
      <form action={returnConversationToAiAction}>
        <input name="conversationId" type="hidden" value={conversation.id} />
        <Button
          className="gap-2"
          disabled={!canManage || !isHuman || conversation.status === "closed"}
          size="sm"
          type="submit"
          variant="outline"
        >
          <Bot aria-hidden="true" className="size-4" />
          Devolver para IA
        </Button>
      </form>
    </div>
  );
}
