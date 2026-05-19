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
import { createAppointmentAction } from "@/features/appointments/actions";
import { AppointmentFields } from "@/features/appointments/components/appointment-fields";
import { AppointmentStatusMessage } from "@/features/appointments/components/appointment-status-message";
import { initialAppointmentActionState } from "@/features/appointments/schema";
import type {
  AppointmentCustomerOption,
  AppointmentServiceOption,
} from "@/features/appointments/types";

export function AppointmentCreateForm({
  canManage,
  customers,
  services,
}: {
  canManage: boolean;
  customers: AppointmentCustomerOption[];
  services: AppointmentServiceOption[];
}) {
  const [state, action, isPending] = useActionState(
    createAppointmentAction,
    initialAppointmentActionState,
  );
  const disabled = !canManage || isPending || !customers.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar agendamento</CardTitle>
        <CardDescription>
          Vincule cliente e servico para preparar a agenda que a IA podera usar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!customers.length ? (
          <div className="mb-4">
            <AppointmentStatusMessage
              message="Cadastre um cliente antes de criar agendamentos."
              tone="info"
            />
          </div>
        ) : null}
        <form action={action} className="grid gap-4 md:grid-cols-2">
          {state.message ? (
            <div className="md:col-span-2">
              <AppointmentStatusMessage
                message={state.message}
                tone={state.status === "success" ? "success" : "error"}
              />
            </div>
          ) : null}
          <AppointmentFields
            customers={customers}
            disabled={disabled}
            errors={state.fieldErrors}
            idPrefix="create-appointment"
            services={services}
          />
          <div className="md:col-span-2">
            <Button className="gap-2" disabled={disabled} type="submit">
              <PlusCircle aria-hidden="true" className="size-4" />
              {isPending ? "Criando..." : "Criar agendamento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
