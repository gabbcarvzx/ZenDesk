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
import { createCustomerAction } from "@/features/customers/actions";
import { CustomerFields } from "@/features/customers/components/customer-fields";
import { CustomerStatusMessage } from "@/features/customers/components/customer-status-message";
import { initialCustomerActionState } from "@/features/customers/schema";

export function CustomerCreateForm({ canManage }: { canManage: boolean }) {
  const [state, action, isPending] = useActionState(
    createCustomerAction,
    initialCustomerActionState,
  );
  const disabled = !canManage || isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo cliente</CardTitle>
        <CardDescription>
          Cadastro manual tenant-scoped para leads, clientes e contatos inativos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!canManage ? (
          <div className="mb-4">
            <CustomerStatusMessage
              message="CRM com cadastro e edicao manual esta disponivel nos planos Pro e Business."
              tone="info"
            />
          </div>
        ) : null}
        <form action={action} className="grid gap-4 md:grid-cols-2">
          {state.message ? (
            <div className="md:col-span-2">
              <CustomerStatusMessage
                message={state.message}
                tone={state.status === "success" ? "success" : "error"}
              />
            </div>
          ) : null}
          <CustomerFields
            disabled={disabled}
            errors={state.fieldErrors}
            idPrefix="create-customer"
          />
          <div className="md:col-span-2">
            <Button className="gap-2" disabled={disabled} type="submit">
              <PlusCircle aria-hidden="true" className="size-4" />
              {isPending ? "Salvando..." : "Criar cliente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
