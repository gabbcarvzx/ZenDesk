import { CalendarClock, Clock3, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AppointmentStatusBadge,
  formatDateTime,
  formatTime,
} from "@/features/appointments/components/appointment-badges";
import { AppointmentEditForm } from "@/features/appointments/components/appointment-edit-form";
import type {
  Appointment,
  AppointmentCustomerOption,
  AppointmentServiceOption,
  AppointmentViewMode,
} from "@/features/appointments/types";

export function AppointmentsList({
  appointments,
  canManage,
  customers,
  services,
  view,
}: {
  appointments: Appointment[];
  canManage: boolean;
  customers: AppointmentCustomerOption[];
  services: AppointmentServiceOption[];
  view: AppointmentViewMode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendamentos</CardTitle>
        <CardDescription>
          Visualizacao por {view === "week" ? "semana" : "dia"} com cliente e servico
          vinculados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface-muted p-8 text-center text-sm text-muted">
            Nenhum agendamento neste periodo.
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <article className="rounded-lg border border-border p-4" key={appointment.id}>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CalendarClock aria-hidden="true" className="size-5 text-primary" />
                      <h3 className="font-semibold text-foreground">
                        {appointment.service?.name ?? "Servico nao vinculado"}
                      </h3>
                      <AppointmentStatusBadge status={appointment.status} />
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted md:grid-cols-2">
                      <span className="inline-flex items-center gap-2">
                        <UserRound aria-hidden="true" className="size-4" />
                        {appointment.customer?.name ?? "Cliente nao encontrado"}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3 aria-hidden="true" className="size-4" />
                        {formatDateTime(appointment.startAt)}
                        {appointment.endAt ? ` - ${formatTime(appointment.endAt)}` : ""}
                      </span>
                    </div>
                    {appointment.notes ? (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">
                        {appointment.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                    {appointment.customer?.phone ? (
                      <Badge>{appointment.customer.phone}</Badge>
                    ) : null}
                    {appointment.service?.durationMinutes ? (
                      <Badge>{appointment.service.durationMinutes} min</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4">
                  <AppointmentEditForm
                    appointment={appointment}
                    canManage={canManage}
                    customers={customers}
                    services={services}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
