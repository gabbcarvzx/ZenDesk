"use client";

import { useActionState } from "react";
import { Power, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deleteKnowledgeBaseItemAction,
  updateKnowledgeBaseItemAction,
  updateKnowledgeBaseStatusAction,
} from "@/features/ai/knowledge-base/actions";
import { KnowledgeBaseFields } from "@/features/ai/knowledge-base/components/knowledge-base-fields";
import { KnowledgeBaseStatusMessage } from "@/features/ai/knowledge-base/components/knowledge-base-status-message";
import { initialKnowledgeBaseActionState } from "@/features/ai/knowledge-base/schema";
import type { KnowledgeBaseItem } from "@/features/ai/knowledge-base/types";

export function KnowledgeBaseEditForm({
  canManage,
  item,
}: {
  canManage: boolean;
  item: KnowledgeBaseItem;
}) {
  const [state, action, isPending] = useActionState(
    updateKnowledgeBaseItemAction,
    initialKnowledgeBaseActionState,
  );
  const disabled = !canManage || isPending;
  const nextStatus = item.status === "active" ? "inactive" : "active";

  return (
    <details className="rounded-lg border border-border bg-[#f8faf9] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-foreground">
        Editar conhecimento
      </summary>
      <div className="mt-4 space-y-4">
        {state.message ? (
          <KnowledgeBaseStatusMessage
            message={state.message}
            tone={state.status === "success" ? "success" : "error"}
          />
        ) : null}
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <input name="id" type="hidden" value={item.id} />
          <KnowledgeBaseFields
            defaultValues={{
              category: item.category,
              content: item.content,
              priority: item.priority,
              status: item.status,
              title: item.title,
            }}
            disabled={disabled}
            errors={state.fieldErrors}
            idPrefix={`knowledge-${item.id}`}
          />
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button className="gap-2" disabled={disabled} type="submit">
              <Save aria-hidden="true" className="size-4" />
              {isPending ? "Salvando..." : "Salvar conhecimento"}
            </Button>
          </div>
        </form>
        <div className="flex flex-wrap gap-3">
          <form action={updateKnowledgeBaseStatusAction}>
            <input name="id" type="hidden" value={item.id} />
            <input name="status" type="hidden" value={nextStatus} />
            <Button
              className="gap-2"
              disabled={!canManage}
              size="sm"
              type="submit"
              variant="outline"
            >
              <Power aria-hidden="true" className="size-4" />
              {item.status === "active" ? "Desativar" : "Ativar"}
            </Button>
          </form>
          <form action={deleteKnowledgeBaseItemAction}>
            <input name="id" type="hidden" value={item.id} />
            <Button
              className="gap-2"
              disabled={!canManage}
              size="sm"
              type="submit"
              variant="danger"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Deletar
            </Button>
          </form>
        </div>
      </div>
    </details>
  );
}
