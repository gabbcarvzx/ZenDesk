import { Badge } from "@/components/ui/badge";
import { formatAppointmentStatus } from "@/features/appointments/schema";
import type { AppointmentStatus } from "@/features/appointments/types";

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const className =
    status === "confirmed"
      ? "bg-[#ecfdf3] text-[#067647]"
      : status === "canceled"
        ? "bg-[#fff1f0] text-danger"
        : status === "completed"
          ? "bg-[#eef2f6] text-muted"
          : "bg-[#fff7ed] text-[#b54708]";

  return <Badge className={className}>{formatAppointmentStatus(status)}</Badge>;
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "nao informado";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
