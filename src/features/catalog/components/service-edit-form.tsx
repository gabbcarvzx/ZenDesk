"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { deleteServiceAction, updateServiceAction } from "@/features/catalog/actions";
import { CatalogStatusMessage } from "@/features/catalog/components/catalog-status-message";
import { ServiceFields } from "@/features/catalog/components/service-create-form";
import { formatPriceInput, initialCatalogActionState } from "@/features/catalog/schema";
import type { CatalogService } from "@/features/catalog/types";

export function ServiceEditForm({
  canManage,
  service,
}: {
  canManage: boolean;
  service: CatalogService;
}) {
  const [state, action, isPending] = useActionState(
    updateServiceAction,
    initialCatalogActionState,
  );
  const disabled = !canManage || isPending;

  return (
    <details className="rounded-lg border border-border bg-[#f8faf9] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-foreground">
        Editar servico
      </summary>
      <div className="mt-4 space-y-4">
        {state.message ? (
          <CatalogStatusMessage
            message={state.message}
            tone={state.status === "success" ? "success" : "error"}
          />
        ) : null}
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <input name="id" type="hidden" value={service.id} />
          <ServiceFields
            defaultValues={{
              category: service.category,
              description: service.description,
              durationMinutes: service.durationMinutes,
              name: service.name,
              price: formatPriceInput(service.priceCents),
              status: service.status,
            }}
            disabled={disabled}
            errors={state.fieldErrors}
            idPrefix={`service-${service.id}`}
          />
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button disabled={disabled} type="submit">
              {isPending ? "Salvando..." : "Salvar servico"}
            </Button>
          </div>
        </form>
        <form action={deleteServiceAction}>
          <input name="id" type="hidden" value={service.id} />
          <Button disabled={!canManage} size="sm" type="submit" variant="danger">
            Deletar servico
          </Button>
        </form>
      </div>
    </details>
  );
}
