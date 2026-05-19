import type { Metadata } from "next";
import { AppointmentCreateForm } from "@/features/appointments/components/appointment-create-form";
import { AppointmentStatusMessage } from "@/features/appointments/components/appointment-status-message";
import { AppointmentViewControls } from "@/features/appointments/components/appointment-view-controls";
import { AppointmentsList } from "@/features/appointments/components/appointments-list";
import { AppointmentsOverview } from "@/features/appointments/components/appointments-overview";
import { AppointmentsShell } from "@/features/appointments/components/appointments-shell";
import { getAppointmentsPageData } from "@/features/appointments/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agenda",
};

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string; view?: string }>;
}) {
  const params = await searchParams;
  const data = await getAppointmentsPageData({
    date: params?.date,
    view: params?.view,
  });

  return (
    <AppointmentsShell
      description="Gerencie agendamentos por cliente e servico, com estrutura pronta para a IA criar horarios futuramente."
      title="Agenda"
    >
      {data.loadError ? (
        <AppointmentStatusMessage message={data.loadError} tone="error" />
      ) : null}
      <AppointmentsOverview appointments={data.appointments} />
      <AppointmentViewControls
        date={data.date}
        rangeLabel={data.rangeLabel}
        view={data.view}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
        <AppointmentCreateForm
          canManage={data.canManage}
          customers={data.customers}
          services={data.services}
        />
        <AppointmentsList
          appointments={data.appointments}
          canManage={data.canManage}
          customers={data.customers}
          services={data.services}
          view={data.view}
        />
      </div>
    </AppointmentsShell>
  );
}
