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
import { createManualPaymentAction } from "@/features/payments/actions";
import { PaymentFields } from "@/features/payments/components/payment-fields";
import { PaymentStatusMessage } from "@/features/payments/components/payment-status-message";
import { initialPaymentActionState } from "@/features/payments/schema";
import type {
  PaymentConversationSummary,
  PaymentCustomerOption,
} from "@/features/payments/types";

export function PaymentCreateForm({
  canManage,
  conversations,
  customers,
}: {
  canManage: boolean;
  conversations: PaymentConversationSummary[];
  customers: PaymentCustomerOption[];
}) {
  const [state, action, isPending] = useActionState(
    createManualPaymentAction,
    initialPaymentActionState,
  );
  const disabled = !canManage || isPending || !customers.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar cobranca manual</CardTitle>
        <CardDescription>
          Registre cobrancas sem gateway agora, mantendo o modelo pronto para Mercado
          Pago depois.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!customers.length ? (
          <div className="mb-4">
            <PaymentStatusMessage
              message="Cadastre um cliente antes de criar cobrancas."
              tone="info"
            />
          </div>
        ) : null}
        <form action={action} className="grid gap-4 md:grid-cols-2">
          {state.message ? (
            <div className="md:col-span-2">
              <PaymentStatusMessage
                message={state.message}
                tone={state.status === "success" ? "success" : "error"}
              />
            </div>
          ) : null}
          <PaymentFields
            conversations={conversations}
            customers={customers}
            disabled={disabled}
            errors={state.fieldErrors}
            idPrefix="create-payment"
          />
          <div className="md:col-span-2">
            <Button className="gap-2" disabled={disabled} type="submit">
              <PlusCircle aria-hidden="true" className="size-4" />
              {isPending ? "Criando..." : "Criar cobranca"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
