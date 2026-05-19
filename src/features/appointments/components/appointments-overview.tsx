import { CalendarCheck2, CalendarClock, CircleOff } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { Appointment } from "@/features/appointments/types";

export function AppointmentsOverview({ appointments }: { appointments: Appointment[] }) {
  const scheduled = appointments.filter(
    (appointment) =>
      appointment.status === "scheduled" || appointment.status === "confirmed",
  ).length;
  const completed = appointments.filter(
    (appointment) => appointment.status === "completed",
  ).length;
  const canceled = appointments.filter(
    (appointment) => appointment.status === "canceled",
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        description="Marcados ou confirmados"
        icon={<CalendarClock aria-hidden="true" className="size-5" />}
        label="Ativos"
        value={String(scheduled)}
      />
      <MetricCard
        description="Servicos ja finalizados"
        icon={<CalendarCheck2 aria-hidden="true" className="size-5" />}
        label="Concluidos"
        value={String(completed)}
      />
      <MetricCard
        description="Cancelados no periodo"
        icon={<CircleOff aria-hidden="true" className="size-5" />}
        label="Cancelados"
        value={String(canceled)}
      />
    </div>
  );
}

function MetricCard({
  description,
  icon,
  label,
  value,
}: {
  description: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
          <p className="mt-2 text-sm text-muted">{description}</p>
        </div>
        <span className="rounded-lg bg-[#e5f2ee] p-2 text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}
