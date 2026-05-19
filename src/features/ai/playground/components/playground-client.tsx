"use client";

import { useActionState, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Database,
  Loader2,
  MessageSquareText,
  Send,
} from "lucide-react";
import { MessageResponse } from "@/components/ai-elements/message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label, Select, Textarea } from "@/components/ui/input";
import { generatePlaygroundResponseAction } from "@/features/ai/playground/actions";
import type { PlaygroundPageData } from "@/features/ai/playground/queries";
import {
  initialPlaygroundActionState,
  type PlaygroundDebugContext,
} from "@/features/ai/playground/schema";
import { PlaygroundStatusMessage } from "@/features/ai/playground/components/playground-status-message";

export function PlaygroundClient({
  canUse,
  fakeConversations,
  initialDebug,
  initialMessages,
  loadError,
  selectedFakeConversationId,
}: PlaygroundPageData) {
  const [state, action, isPending] = useActionState(
    generatePlaygroundResponseAction,
    {
      ...initialPlaygroundActionState,
      selectedFakeConversationId,
    },
  );
  const [selectedId, setSelectedId] = useState(selectedFakeConversationId);
  const selectedConversation = useMemo(
    () =>
      fakeConversations.find((conversation) => conversation.id === selectedId) ??
      fakeConversations[0],
    [fakeConversations, selectedId],
  );
  const [customerMessage, setCustomerMessage] = useState<string>(
    selectedConversation.defaultCustomerMessage,
  );
  const disabled = !canUse || isPending;
  const debug = state.debug ?? initialDebug;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        {loadError ? <PlaygroundStatusMessage message={loadError} tone="error" /> : null}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Simulador de conversa</CardTitle>
                <CardDescription>
                  Gere uma resposta usando dados reais do tenant e salve o teste em
                  conversations/messages.
                </CardDescription>
              </div>
              <Badge>Owner only</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!canUse ? (
              <div className="mb-4">
                <PlaygroundStatusMessage
                  message="Somente o dono da organizacao pode gerar respostas de teste."
                  tone="info"
                />
              </div>
            ) : null}
            <form action={action} className="space-y-4">
              {state.message ? (
                <PlaygroundStatusMessage
                  message={state.message}
                  tone={state.status === "success" ? "success" : "error"}
                />
              ) : null}
              <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
                <div className="space-y-2">
                  <Label htmlFor="fakeConversationId">Conversa fake</Label>
                  <Select
                    disabled={disabled}
                    id="fakeConversationId"
                    name="fakeConversationId"
                    onChange={(event) => {
                      const nextConversation =
                        fakeConversations.find(
                          (conversation) => conversation.id === event.target.value,
                        ) ?? fakeConversations[0];

                      setSelectedId(nextConversation.id);
                      setCustomerMessage(nextConversation.defaultCustomerMessage);
                    }}
                    value={selectedId}
                  >
                    {fakeConversations.map((conversation) => (
                      <option key={conversation.id} value={conversation.id}>
                        {conversation.label}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs leading-5 text-muted">
                    {selectedConversation.description}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerMessage">Mensagem do cliente</Label>
                  <Textarea
                    disabled={disabled}
                    id="customerMessage"
                    name="customerMessage"
                    onChange={(event) => setCustomerMessage(event.target.value)}
                    placeholder="Digite como se fosse o cliente no WhatsApp."
                    required
                    value={customerMessage}
                  />
                  {state.fieldErrors?.customerMessage?.[0] ? (
                    <p className="text-sm font-medium text-danger">
                      {state.fieldErrors.customerMessage[0]}
                    </p>
                  ) : null}
                </div>
              </div>
              <Button className="gap-2" disabled={disabled} type="submit">
                {isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Send aria-hidden="true" className="size-4" />
                )}
                {isPending ? "Gerando..." : "Gerar resposta"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquareText aria-hidden="true" className="size-5 text-primary" />
              <CardTitle>Resposta da IA</CardTitle>
            </div>
            <CardDescription>
              Resultado salvo como mensagem outbound da IA na conversa fake selecionada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.response ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={
                      state.response.status === "generated"
                        ? "bg-[#ecfdf3] text-[#067647]"
                        : "bg-[#fff1f0] text-danger"
                    }
                  >
                    {state.response.status === "generated" ? "Gerada" : "Handoff"}
                  </Badge>
                  <Badge>{state.response.model}</Badge>
                  {state.response.finishReason ? (
                    <Badge>finish: {state.response.finishReason}</Badge>
                  ) : null}
                </div>
                <div className="rounded-lg border border-border bg-surface-muted p-4">
                  <MessageResponse>{state.response.text}</MessageResponse>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<MessageSquareText aria-hidden="true" className="size-5" />}
                text="Nenhuma resposta gerada nesta sessao."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database aria-hidden="true" className="size-5 text-primary" />
              <CardTitle>Historico fake</CardTitle>
            </div>
            <CardDescription>
              Mensagens iniciais do cenario ou ultimas mensagens persistidas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {initialMessages.map((message, index) => (
                <div
                  className="rounded-lg border border-border bg-surface-muted p-3"
                  key={`${message.role}-${index}-${message.content.slice(0, 16)}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                      {formatRole(message.role)}
                    </span>
                    {message.persisted ? (
                      <CheckCircle2 aria-hidden="true" className="size-4 text-[#067647]" />
                    ) : (
                      <AlertTriangle aria-hidden="true" className="size-4 text-accent" />
                    )}
                  </div>
                  <p className="text-sm leading-6 text-foreground">{message.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <DebugPanel debug={debug} />
      </aside>
    </div>
  );
}

function DebugPanel({ debug }: { debug?: PlaygroundDebugContext }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bug aria-hidden="true" className="size-5 text-primary" />
          <CardTitle>Debug de contexto</CardTitle>
        </div>
        <CardDescription>
          Dados operacionais usados para montar o contexto da IA neste teste.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {debug ? (
          <pre className="max-h-[520px] overflow-auto rounded-lg border border-border bg-[#101828] p-4 font-mono text-xs leading-5 text-white">
            {JSON.stringify(debug, null, 2)}
          </pre>
        ) : (
          <EmptyState
            icon={<Bug aria-hidden="true" className="size-5" />}
            text="Sem contexto carregado para debug."
          />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-surface-muted p-4 text-sm text-muted">
      <span className="text-primary">{icon}</span>
      {text}
    </div>
  );
}

function formatRole(role: string) {
  if (role === "ai") {
    return "IA";
  }

  if (role === "human") {
    return "Humano";
  }

  return "Cliente";
}
