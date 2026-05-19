"use client";

import { useActionState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createKnowledgeBaseItemAction } from "@/features/ai/knowledge-base/actions";
import { KnowledgeBaseFields } from "@/features/ai/knowledge-base/components/knowledge-base-fields";
import { KnowledgeBaseStatusMessage } from "@/features/ai/knowledge-base/components/knowledge-base-status-message";
import { initialKnowledgeBaseActionState } from "@/features/ai/knowledge-base/schema";

export function KnowledgeBaseCreateForm({ canManage }: { canManage: boolean }) {
  const [state, action, isPending] = useActionState(
    createKnowledgeBaseItemAction,
    initialKnowledgeBaseActionState,
  );
  const disabled = !canManage || isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conhecimento</CardTitle>
        <CardDescription>
          Cadastre informacoes que depois serao usadas para montar o contexto da IA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!canManage ? (
          <div className="mb-4">
            <KnowledgeBaseStatusMessage
              message="Somente o dono da organizacao pode alterar a base de conhecimento."
              tone="info"
            />
          </div>
        ) : null}
        <form action={action} className="grid gap-4 md:grid-cols-2">
          {state.message ? (
            <div className="md:col-span-2">
              <KnowledgeBaseStatusMessage
                message={state.message}
                tone={state.status === "success" ? "success" : "error"}
              />
            </div>
          ) : null}
          <KnowledgeBaseFields
            disabled={disabled}
            errors={state.fieldErrors}
            idPrefix="create-knowledge"
          />
          <div className="md:col-span-2">
            <Button className="gap-2" disabled={disabled} type="submit">
              <PlusCircle aria-hidden="true" className="size-4" />
              {isPending ? "Salvando..." : "Criar conhecimento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
