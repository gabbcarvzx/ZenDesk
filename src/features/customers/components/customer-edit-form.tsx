"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateCustomerAction } from "@/features/customers/actions";
import { CustomerFields } from "@/features/customers/components/customer-fields";
import { CustomerStatusMessage } from "@/features/customers/components/customer-status-message";
import { initialCustomerActionState } from "@/features/customers/schema";
import type { Customer } from "@/features/customers/types";

export function CustomerEditForm({
  canManage,
  customer,
}: {
  canManage: boolean;
  customer: Customer;
}) {
  const [state, action, isPending] = useActionState(
    updateCustomerAction,
    initialCustomerActionState,
  );
  const disabled = !canManage || isPending;

  return (
    <details className="rounded-lg border border-border bg-[#f8faf9] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-foreground">
        Editar cliente
      </summary>
      <div className="mt-4 space-y-4">
        {state.message ? (
          <CustomerStatusMessage
            message={state.message}
            tone={state.status === "success" ? "success" : "error"}
          />
        ) : null}
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <input name="id" type="hidden" value={customer.id} />
          <CustomerFields
            customer={customer}
            disabled={disabled}
            errors={state.fieldErrors}
            idPrefix={`customer-${customer.id}`}
          />
          <div className="md:col-span-2">
            <Button className="gap-2" disabled={disabled} type="submit">
              <Save aria-hidden="true" className="size-4" />
              {isPending ? "Salvando..." : "Salvar cliente"}
            </Button>
          </div>
        </form>
      </div>
    </details>
  );
}
