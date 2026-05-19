"use client";

import { useActionState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { createTestConversationAction } from "@/features/conversations/actions";
import { ConversationStatusMessage } from "@/features/conversations/components/conversation-status-message";
import { initialConversationActionState } from "@/features/conversations/schema";

export function ConversationCreateForm({ canManage }: { canManage: boolean }) {
  const [state, action, isPending] = useActionState(
    createTestConversationAction,
    initialConversationActionState,
  );
  const disabled = !canManage || isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conversa manual</CardTitle>
        <CardDescription>
          Simule atendimentos antes da integracao real com WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!canManage ? (
          <div className="mb-4">
            <ConversationStatusMessage
              message="Entre com uma conta vinculada a uma organizacao para criar conversas."
              tone="info"
            />
          </div>
        ) : null}
        <form action={action} className="space-y-4">
          {state.message ? (
            <ConversationStatusMessage
              message={state.message}
              tone={state.status === "success" ? "success" : "error"}
            />
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="conversation-customer-name">Nome do cliente</Label>
              <Input
                disabled={disabled}
                id="conversation-customer-name"
                name="customerName"
                placeholder="Cliente teste"
                required
              />
              <FieldError error={state.fieldErrors?.customerName?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conversation-customer-phone">Telefone opcional</Label>
              <Input
                disabled={disabled}
                id="conversation-customer-phone"
                inputMode="tel"
                name="customerPhone"
                placeholder="+55 11 99999-9999"
              />
              <FieldError error={state.fieldErrors?.customerPhone?.[0]} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="conversation-first-message">Primeira mensagem</Label>
            <Textarea
              disabled={disabled}
              id="conversation-first-message"
              name="firstMessage"
              placeholder="Oi, gostaria de saber mais sobre..."
              required
            />
            <FieldError error={state.fieldErrors?.firstMessage?.[0]} />
          </div>
          <Button className="gap-2" disabled={disabled} type="submit">
            <PlusCircle aria-hidden="true" className="size-4" />
            {isPending ? "Criando..." : "Criar conversa"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function FieldError({ error }: { error?: string }) {
  return error ? <p className="text-sm font-medium text-danger">{error}</p> : null;
}
