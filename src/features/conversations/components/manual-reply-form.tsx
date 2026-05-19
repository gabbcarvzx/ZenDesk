"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { sendManualReplyAction } from "@/features/conversations/actions";
import { ConversationStatusMessage } from "@/features/conversations/components/conversation-status-message";
import { initialConversationActionState } from "@/features/conversations/schema";

export function ManualReplyForm({
  canManage,
  conversationId,
  disabled,
}: {
  canManage: boolean;
  conversationId: string;
  disabled: boolean;
}) {
  const [state, action, isPending] = useActionState(
    sendManualReplyAction,
    initialConversationActionState,
  );
  const isDisabled = !canManage || disabled || isPending;

  return (
    <form action={action} className="space-y-3">
      <input name="conversationId" type="hidden" value={conversationId} />
      {state.message ? (
        <ConversationStatusMessage
          message={state.message}
          tone={state.status === "success" ? "success" : "error"}
        />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="manual-reply">Resposta manual do atendente</Label>
        <Textarea
          disabled={isDisabled}
          id="manual-reply"
          name="message"
          placeholder="Digite uma resposta que sera salva como mensagem outbound manual."
          required
        />
        {state.fieldErrors?.message?.[0] ? (
          <p className="text-sm font-medium text-danger">
            {state.fieldErrors.message[0]}
          </p>
        ) : null}
      </div>
      <Button className="gap-2" disabled={isDisabled} type="submit">
        <Send aria-hidden="true" className="size-4" />
        {isPending ? "Enviando..." : "Enviar resposta"}
      </Button>
    </form>
  );
}
