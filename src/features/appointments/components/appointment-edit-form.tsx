"use client";

import { useActionState } from "react";
import { Ban, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cancelAppointmentAction,
  updateAppointmentAction,
} from "@/features/appointments/actions";
import { AppointmentFields } from "@/features/appointments/components/appointment-fields";
import { AppointmentStatusMessage } from "@/features/appointments/components/appointment-status-message";
import { initialAppointmentActionState } from "@/features/appointments/schema";
import type {
  Appointment,
  AppointmentCustomerOption,
  AppointmentServiceOption,
} from "@/features/appointments/types";

export function AppointmentEditForm({
  appointment,
  canManage,
  customers,
  services,
}: {
  appointment: Appointment;
  canManage: boolean;
  customers: AppointmentCustomerOption[];
  services: AppointmentServiceOption[];
}) {
  const [state, action, isPending] = useActionState(
    updateAppointmentAction,
    initialAppointmentActionState,
  );
  const disabled = !canManage || isPending;

  return (
    <details className="rounded-lg border border-border bg-[#f8faf9] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-foreground">
        Editar agendamento
      </summary>
      <div className="mt-4 space-y-4">
        {state.message ? (
          <AppointmentStatusMessage
            message={state.message}
            tone={state.status === "success" ? "success" : "error"}
          />
        ) : null}
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <input name="id" type="hidden" value={appointment.id} />
          <AppointmentFields
            appointment={appointment}
            customers={customers}
            disabled={disabled}
            errors={state.fieldErrors}
            idPrefix={`appointment-${appointment.id}`}
            services={services}
          />
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button className="gap-2" disabled={disabled} type="submit">
              <Save aria-hidden="true" className="size-4" />
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
        <form action={cancelAppointmentAction}>
          <input name="id" type="hidden" value={appointment.id} />
          <Button
            className="gap-2"
            disabled={!canManage || appointment.status === "canceled"}
            size="sm"
            type="submit"
            variant="danger"
          >
            <Ban aria-hidden="true" className="size-4" />
            Cancelar
          </Button>
        </form>
      </div>
    </details>
  );
}
